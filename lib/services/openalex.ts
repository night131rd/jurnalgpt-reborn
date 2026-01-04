import type { OpenAlexWork, Journal } from '@/lib/types/journal';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { tracePayload } from '@/lib/utils/traceUtils';

const OPENALEX_API = 'https://api.openalex.org/works';

export async function searchOpenAlex(
    query: string,
    minYear: string,
    maxYear: string
): Promise<Journal[]> {
    return tracer.startActiveSpan('OpenAlex Retrieval', async (span: Span) => {
        span.setAttribute('openinference.span.kind', 'RETRIEVER');
        try {
            span.setAttribute('input.query', query);
            span.setAttribute('input.year_range', `${minYear}-${maxYear}`);

            const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 10000) => {
                return fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
            };

            const params = new URLSearchParams({
                filter: `publication_year:${minYear}-${maxYear},default.search:${query}`,
                select: 'id,doi,title,publication_year,primary_location,abstract_inverted_index,authorships,relevance_score,cited_by_count',
                sort: 'relevance_score:desc',
                per_page: '50',
                mailto: process.env.OPENALEX_EMAIL || 'user@example.com'
            });

            let response;
            let retries = 1;

            while (retries >= 0) {
                try {
                    response = await fetchWithTimeout(`${OPENALEX_API}?${params}`, {
                        headers: { 'User-Agent': 'JurnalGPT/1.0' }
                    });
                    break;
                } catch (e: any) {
                    if ((e.name === 'TimeoutError' || e.code === 'ETIMEDOUT' || e.message?.includes('fetch failed')) && retries > 0) {
                        console.warn(`⚠️ OpenAlex timeout or fetch failed, retrying... (${retries} left)`);
                        retries--;
                        continue;
                    }
                    throw e;
                }
            }

            if (!response || !response.ok) {
                span.setAttribute('output.error', `API Error ${response?.status || 'Unknown'}`);
                return [];
            }

            const data = await response.json();
            const works: OpenAlexWork[] = data.results || [];

            const journals = works
                .map((work) => transformOpenAlexWork(work))
                .filter(journal => journal.abstract && journal.abstract !== 'No abstract available' && journal.abstract.length > 50);

            span.setAttribute('output.results_count', journals.length);
            span.setAttribute('output.documents', tracePayload(journals));

            return journals;
        } catch (error: any) {
            if (error.name === 'TimeoutError' || error.code === 'ETIMEDOUT') {
                console.warn('⚠️ OpenAlex timeout after retries. Skipping.');
            } else {
                console.error('OpenAlex search failed:', error);
            }
            span.recordException(error as Error);
            span.setAttribute('output.results_count', 0);
            return [];
        } finally {
            span.end();
        }
    });
}

function transformOpenAlexWork(work: OpenAlexWork): Journal {
    return {
        title: work.title || 'Untitled',
        year: work.publication_year || new Date().getFullYear(),
        publisher: work.primary_location?.source?.display_name || 'Unknown',
        journalLink: work.doi ? `https://doi.org/${work.doi}` : work.id,
        abstract: reconstructAbstract(work.abstract_inverted_index) || 'No abstract available',
        doi: work.doi,
        authors: work.authorships?.map(a => a.author.display_name) || [],
        citationCount: work.cited_by_count || 0,
        source: 'openalex'
    };
}

function reconstructAbstract(invertedIndex: Record<string, number[]> | null): string {
    if (!invertedIndex) return '';

    const words: [string, number][] = [];
    for (const [word, positions] of Object.entries(invertedIndex)) {
        positions.forEach(pos => words.push([word, pos]));
    }

    words.sort((a, b) => a[1] - b[1]);
    return words.map(([word]) => word).join(' ');
}