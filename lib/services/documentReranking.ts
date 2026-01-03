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
                const apiKey = process.env.LANGSEARCH_API_KEY;
                if (!apiKey) {
                    console.warn('LANGSEARCH_API_KEY not found. Skipping reranking.');
                    span.setAttribute('output.reranked_count', documents.slice(0, topN).length);
                    span.setAttribute('output.skipped', true);
                    return documents.slice(0, topN);
                }

                // Prepare documents for API
                // Truncate abstract to avoid 504 Timeouts / Payload too large
                const docTexts = documents.map(doc =>
                    `Title: ${doc.title}\nAbstract: ${doc.abstract ? doc.abstract.substring(0, 1000) : ''}`
                );

                const response = await fetch(LANGSEARCH_API, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${apiKey}`
                    },
                    body: JSON.stringify({
                        model: 'langsearch-reranker-v1',
                        query: query,
                        documents: docTexts,
                        top_n: topN
                    })
                });

                if (!response.ok) {
                    throw new Error(`Rerank API error: ${response.status} ${response.statusText}`);
                }

                const data: RerankResponse = await response.json();

                if (data.code !== 200) {
                    throw new Error(`Rerank failed: ${data.msg}`);
                }

                // Map results back to original documents
                // The API returns indices sorted by relevance score
                const rerankedDocs = data.results.map(result => {
                    // We can check score threshold here if needed
                    return documents[result.index];
                });

                // Set output attributes
                span.setAttribute('output.reranked_count', rerankedDocs.length);

                // Log FULL output documents for evaluation (smart tracing)
                span.setAttribute('output.documents', tracePayload(rerankedDocs));

                // Record relevance scores
                const relevanceScores = data.results.map(r => r.relevance_score);
                span.setAttribute('output.relevance_scores', JSON.stringify(relevanceScores));

                return rerankedDocs;

            } catch (error) {
                console.warn('Semantic reranking failed (using fallback):', error);
                span.recordException(error as Error);
                // Fallback: return original list truncated
                const fallbackDocs = documents.slice(0, topN);
                span.setAttribute('output.reranked_count', fallbackDocs.length);
                span.setAttribute('output.fallback', true);
                return fallbackDocs;
            }
        } finally {
            span.end();
        }
    });
}
