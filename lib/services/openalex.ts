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
            // Set input attributes
            span.setAttribute('input.query', query);
            span.setAttribute('input.year_range', `${minYear}-${maxYear}`);

            // Build query parameters
            const params = new URLSearchParams({
                // Use filter=default.search:term1|term2 for boolean OR search
                filter: `publication_year:${minYear}-${maxYear},default.search:${query}`,
                // Select only necessary fields to reduce payload size
                select: 'id,doi,title,publication_year,primary_location,abstract_inverted_index,authorships,relevance_score,cited_by_count',
                sort: 'relevance_score:desc',
                per_page: '50',
                mailto: process.env.OPENALEX_EMAIL || 'user@example.com'
            });

            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30s timeout

            const response = await fetch(`${OPENALEX_API}?${params}`, {
                headers: {
                    'User-Agent': 'JurnalGPT/1.0'
                },
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            if (!response.ok) {
                span.setAttribute('output.error', `API Error ${response.status}`);
                throw new Error(`OpenAlex API error: ${response.status}`);
            }

            const data = await response.json();
            const works: OpenAlexWork[] = data.results || [];

            // Transform results
            const journals = works
                .map((work) => transformOpenAlexWork(work))
                .filter(journal => journal.abstract && journal.abstract !== 'No abstract available' && journal.abstract.length > 50);

            // Set output attributes
            span.setAttribute('output.results_count', journals.length);

            // Log FULL documents for evaluation (smart tracing)
            span.setAttribute('output.documents', tracePayload(journals));

            return journals;
        } catch (error) {
            console.error('OpenAlex search failed:', error);
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