import type { SemanticScholarPaper, Journal } from '@/lib/types/journal';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { tracePayload, traceDocuments } from '@/lib/utils/traceUtils';

const S2_API = 'https://api.semanticscholar.org/graph/v1/paper/search';

export async function searchSemanticScholar(
    query: string,
    minYear: string,
    maxYear: string
): Promise<Journal[]> {
    return tracer.startActiveSpan('rag.retrieval.semantic_scholar', async (span: Span) => {
        span.setAttribute('openinference.span.kind', 'RETRIEVER');
        try {
            span.setAttribute('input.query', query);
            span.setAttribute('input.year_range', `${minYear}-${maxYear}`);

            const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 5000) => {
                return fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
            };

            try {
                const params = new URLSearchParams({
                    query: query,
                    year: `${minYear}-${maxYear}`,
                    fields: 'title,year,abstract,url,venue,citationCount,authors,openAccessPdf',
                    limit: '10'
                });

                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'JurnalGPT/1.0 (mailto:public@jurnalgpt.com)'
                };

                let response;
                let retries = 1;

                while (retries >= 0) {
                    try {
                        response = await fetchWithTimeout(`${S2_API}?${params}`, { headers });
                        break;
                    } catch (e: any) {
                        if ((e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') && retries > 0) {
                            console.warn(`⚠️ Semantic Scholar timeout, retrying... (${retries} left)`);
                            retries--;
                            continue;
                        }
                        throw e;
                    }
                }

                if (!response || !response.ok) {
                    if (response?.status === 429) {
                        console.warn('⚠️ Semantic Scholar rate limit reached. Returning empty results for this source.');
                        return [];
                    }
                    throw new Error(`Semantic Scholar API error: ${response?.status || 'Unknown'}`);
                }

                const data = await response.json();
                const papers: SemanticScholarPaper[] = data.data || [];
                const journals = papers
                    .map(transformSemanticScholarPaper)
                    .filter(journal => journal.abstract && journal.abstract !== 'No abstract available' && journal.abstract.length > 50);

                span.setAttribute('output.results_count', journals.length);
                span.setAttribute('output.documents', traceDocuments(journals));

                return journals;
            } catch (error: any) {
                // Don't log expected rate limit errors that might bubble up (double safety)
                if (error.message?.includes('429')) {
                    return [];
                }

                if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
                    console.warn('⚠️ Semantic Scholar timeout after retries. Skipping this source.');
                } else {
                    console.error('Semantic Scholar search failed:', error);
                }

                span.recordException(error as Error);
                return [];
            }
        } finally {
            span.end();
        }
    });
}

function transformSemanticScholarPaper(paper: SemanticScholarPaper): Journal {
    return {
        title: paper.title || 'Untitled',
        year: paper.year || new Date().getFullYear(),
        publisher: paper.venue || 'Unknown',
        journalLink: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
        abstract: paper.abstract || 'No abstract available',
        authors: paper.authors?.map(a => a.name) || [],
        citationCount: paper.citationCount || 0,
        pdfLink: paper.openAccessPdf?.url,
        source: 'semantic-scholar'
    };
}
