import type { SemanticScholarPaper, Journal } from '@/lib/types/journal';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { tracePayload } from '@/lib/utils/traceUtils';

const S2_API = 'https://api.semanticscholar.org/graph/v1/paper/search';

export async function searchSemanticScholar(
    query: string,
    minYear: string,
    maxYear: string
): Promise<Journal[]> {
    return tracer.startActiveSpan('Semantic Scholar Retrieval', async (span: Span) => {
        span.setAttribute('openinference.span.kind', 'RETRIEVER');
        try {
            // Set input attributes
            span.setAttribute('input.query', query);
            span.setAttribute('input.year_range', `${minYear}-${maxYear}`);

            try {
                const params = new URLSearchParams({
                    query: query,
                    year: `${minYear}-${maxYear}`,
                    fields: 'title,year,abstract,url,venue,citationCount,authors',
                    limit: '10'
                });

                const headers: HeadersInit = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'JurnalGPT/1.0 (mailto:public@jurnalgpt.com)'
                };

                const response = await fetch(`${S2_API}?${params}`, { headers });


                if (!response.ok) {
                    if (response.status === 429) {
                        console.warn('⚠️ Semantic Scholar rate limit reached. Returning empty results for this source.');
                        span.setAttribute('output.results_count', 0);
                        span.setAttribute('output.error', 'Rate limit reached');
                        return [];
                    }
                    throw new Error(`Semantic Scholar API error: ${response.status}`);
                }

                const data = await response.json();
                const papers: SemanticScholarPaper[] = data.data || [];
                const journals = papers
                    .map(transformSemanticScholarPaper)
                    .filter(journal => journal.abstract && journal.abstract !== 'No abstract available' && journal.abstract.length > 50);

                // Set output attributes
                span.setAttribute('output.results_count', journals.length);

                // Log FULL documents for evaluation (smart tracing)
                span.setAttribute('output.documents', tracePayload(journals));

                return journals;
            } catch (error) {
                // Don't log expected rate limit errors that might bubble up (double safety)
                if (error instanceof Error && error.message.includes('429')) {
                    span.setAttribute('output.results_count', 0);
                    span.setAttribute('output.error', 'Rate limit reached');
                    return [];
                }
                console.error('Semantic Scholar search failed:', error);
                span.recordException(error as Error);
                span.setAttribute('output.results_count', 0);
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
        source: 'semantic-scholar'
    };
}
