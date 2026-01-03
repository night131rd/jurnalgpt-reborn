import type { Journal } from '@/lib/types/journal';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { tracePayload } from '@/lib/utils/traceUtils';

const LANGSEARCH_API = 'https://api.langsearch.com/v1/rerank';

interface RerankResult {
    index: number;
    relevance_score: number;
}

interface RerankResponse {
    code: number;
    results: RerankResult[];
    msg?: string;
}

export async function rerankDocuments(
    query: string,
    documents: Journal[],
    topN: number
): Promise<Journal[]> {
    return tracer.startActiveSpan('Document Reranking', async (span: Span) => {
        span.setAttribute('openinference.span.kind', 'RERANKER');
        try {
            // Set input attributes
            span.setAttribute('input.query', query);
            span.setAttribute('input.documents_count', documents.length);
            span.setAttribute('input.top_n', topN);
            // Log FULL input documents for evaluation (smart tracing)
            span.setAttribute('input.documents', tracePayload(documents));

            if (documents.length === 0) {
                span.setAttribute('output.reranked_count', 0);
                return [];
            }

            try {
                // API Key Rotation Logic
                const apiKeysStr = process.env.LANGSEARCH_API_KEYS || process.env.LANGSEARCH_API_KEY;
                if (!apiKeysStr) {
                    console.warn('No LANGSEARCH_API_KEYS found. Skipping reranking.');
                    span.setAttribute('output.reranked_count', documents.slice(0, topN).length);
                    span.setAttribute('output.skipped', true);
                    return documents.slice(0, topN);
                }

                const apiKeys = apiKeysStr.split(',').map(k => k.trim()).filter(Boolean);
                // Randomly select an API key to distribute load
                const selectedApiKey = apiKeys[Math.floor(Math.random() * apiKeys.length)];

                // Prepare documents for API
                // Truncate abstract further to avoid 504 Timeouts
                const docTexts = documents.map(doc =>
                    `Title: ${doc.title}\nAbstract: ${doc.abstract ? doc.abstract.substring(0, 1000) : ''}`
                );

                // Add Timeout (12 seconds)
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 3000);

                const response = await fetch(LANGSEARCH_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${selectedApiKey}`
                    },
                    body: JSON.stringify({
                        model: 'langsearch-reranker-v1',
                        query: query,
                        documents: docTexts,
                        top_n: topN
                    }),
                    signal: controller.signal
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    throw new Error(`Rerank API error: ${response.status} ${response.statusText}`);
                }

                const data: RerankResponse = await response.json();

                if (data.code !== 200) {
                    throw new Error(`Rerank failed: ${data.msg}`);
                }

                // Map results back to original documents
                const rerankedDocs = data.results.map(result => {
                    return documents[result.index];
                });

                // Set output attributes
                span.setAttribute('output.reranked_count', rerankedDocs.length);
                span.setAttribute('output.documents', tracePayload(rerankedDocs));
                span.setAttribute('output.api_key_used', `${selectedApiKey.substring(0, 4)}...`);

                // Record relevance scores
                const relevanceScores = data.results.map(r => r.relevance_score);
                span.setAttribute('output.relevance_scores', JSON.stringify(relevanceScores));

                return rerankedDocs;

            } catch (error: any) {
                const isTimeout = error.name === 'AbortError';
                console.warn(`Semantic reranking failed ${isTimeout ? '(timed out)' : ''}:`, error.message || error);
                span.recordException(error as Error);

                // Fallback: return original list truncated
                const fallbackDocs = documents.slice(0, topN);
                span.setAttribute('output.reranked_count', fallbackDocs.length);
                span.setAttribute('output.fallback', true);
                span.setAttribute('output.fallback_reason', isTimeout ? 'timeout' : 'error');
                return fallbackDocs;
            }
        } finally {
            span.end();
        }
    });
}
