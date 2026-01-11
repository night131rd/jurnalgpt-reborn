import type { CoreWork, Journal } from '@/lib/types/journal';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { tracePayload, traceDocuments } from '@/lib/utils/traceUtils';

const CORE_API_URL = 'https://api.core.ac.uk/v3/search/works';

export async function searchCoreAc(
    query: string,
    minYear: string,
    maxYear: string
): Promise<Journal[]> {
    return tracer.startActiveSpan('rag.retrieval.core', async (span: Span) => {
        span.setAttribute('openinference.span.kind', 'RETRIEVER');
        try {
            span.setAttribute('input.query', query);
            span.setAttribute('input.year_range', `${minYear}-${maxYear}`);

            const apiKey = process.env.CORE_API_KEY;

            if (!apiKey) {
                console.warn('⚠️ No CORE_API_KEY found. Request might be rate limited.');
            }

            const headers: HeadersInit = {
                'Content-Type': 'application/json',
            };
            if (apiKey) headers['Authorization'] = `Bearer ${apiKey}`;

            const fetchWithTimeout = async (url: string, options: RequestInit, timeout: number = 20000) => {
                return fetch(url, { ...options, signal: AbortSignal.timeout(timeout) });
            };

            const body = JSON.stringify({
                q: query,
                limit: 50,
                filters: {
                    yearPublished: { gte: Number(minYear), lte: Number(maxYear) }
                }
            });

            let response;
            let retries = 1;

            while (retries >= 0) {
                try {
                    response = await fetchWithTimeout(CORE_API_URL, {
                        method: 'POST',
                        headers,
                        body,
                        redirect: 'follow'
                    });

                    if (response.status === 429) {
                        console.warn(`⚠️ Core.ac.uk rate limit reached (${2 - retries}/2).`);
                        if (retries > 0) await new Promise(r => setTimeout(r, (2 - retries) * 1500));
                    } else if (response.ok) {
                        break;
                    }
                } catch (e: any) {
                    if ((e.name === 'TimeoutError' || e.code === 'ETIMEDOUT') && retries > 0) {
                        console.warn(`⚠️ Core.ac.uk timeout, retrying... (${retries} left)`);
                    }
                }
                retries--;
            }

            if (!response || !response.ok) {
                return [];
            }

            const data = await response.json();
            const works: CoreWork[] = data.results || [];

            const journals = works
                .map(transformCoreWork)
                .filter(journal => journal.abstract && journal.abstract.length > 50);

            span.setAttribute('output.results_count', journals.length);
            span.setAttribute('output.documents', traceDocuments(journals));

            return journals;
        } catch (error: any) {
            console.error('Core.ac.uk search failed:', error);
            span.recordException(error);
            return [];
        } finally {
            span.end();
        }
    });
}

function transformCoreWork(work: CoreWork): Journal {
    return {
        title: work.title || 'Untitled',
        year: work.yearPublished || new Date().getFullYear(),
        publisher: work.publisher || 'Unknown',
        journalLink: work.downloadUrl || (work.id ? `https://core.ac.uk/works/${work.id}` : ''),
        abstract: work.abstract || 'No abstract available',
        doi: work.doi,
        authors: work.authors?.map(a => a.name) || [],
        citationCount: work.citationCount || 0,
        source: 'core-ac-uk'
    };
}
