import { searchOpenAlex } from './openalex';
import { searchSemanticScholar } from './semanticScholar';
import { generateAnswer, expandQuery } from './llmService';
import { mergeAndDeduplicate } from '@/lib/utils/mergeResults';
import { rerankDocuments } from './documentReranking';
import type { SearchResult, Journal } from '@/lib/types/journal';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';

export async function searchJournals(
    query: string,
    minYear: string,
    maxYear: string,
    scope: 'all' | 'national' | 'international' = 'all',
    isPremium: boolean = false
): Promise<{ journals: Journal[]; stream: AsyncGenerator<string, void, unknown> }> {
    const rerankCount = isPremium ? 16 : 8;
    const resultCount = isPremium ? 8 : 4;

    return tracer.startActiveSpan('JurnalGPT Search Pipeline', async (span: Span) => {
        try {
            span.setAttribute('openinference.span.kind', 'CHAIN');
            // Set input attributes for the parent span
            span.setAttribute('input.query', query);
            span.setAttribute('input.year_range', `${minYear}-${maxYear}`);
            span.setAttribute('input.scope', scope);

            // STEP 1: Expand query using LLM (with scope)
            console.log(`🔍 Original query: "${query}" [Scope: ${scope}]`);
            const expandedQueries = await expandQuery(query, scope);
            console.log(`✨ Expanded to: ${JSON.stringify(expandedQueries)}`);


            // STEP 2: Search both APIs (Optimized with Boolean Queries)
            // OpenAlex uses 'OR', Semantic Scholar uses '|' (pipe)
            // Update: OpenAlex optimization guide recommends using pipe '|' inside filter=default.search
            const combinedQuery = expandedQueries.join('|');

            console.log(`  Combined Query: "${combinedQuery}"`);

            const [openAlexResults, semanticResults] = await Promise.allSettled([
                searchOpenAlex(combinedQuery, minYear, maxYear),
                searchSemanticScholar(combinedQuery, minYear, maxYear)
            ]);

            // STEP 3: Extract successful results
            const openAlex = openAlexResults.status === 'fulfilled' ? openAlexResults.value : [];
            const semantic = semanticResults.status === 'fulfilled' ? semanticResults.value : [];

            console.log(`  ✅ OpenAlex: ${openAlex.length} results`);
            console.log(`  ✅ Semantic Scholar: ${semantic.length} results`);

            const allJournals = [...openAlex, ...semantic];


            console.log(`  ✅ Total raw results: ${allJournals.length}`);

            // STEP 3: Merge and deduplicate
            const mergedJournals = mergeAndDeduplicate(allJournals);
            console.log(`  🔀 Merged: ${mergedJournals.length} unique journals`);

            // STEP 4: Semantic Reranking
            console.log(`  📊 Reranking ${mergedJournals.slice(0, rerankCount).length} documents...`);
            // We send up to rerankCount documents for reranking to get the absolute best context
            const rerankedJournals = await rerankDocuments(query, mergedJournals.slice(0, rerankCount), resultCount);
            console.log(`  ✅ Reranked top ${rerankedJournals.length} documents`);

            // STEP 5: Generate AI answer
            // Use top resultCount filtered/reranked documents for context
            const contextJournals = rerankedJournals.slice(0, resultCount);
            console.log(`  🤖 Generating AI answer with ${contextJournals.length} context docs...`);
            const stream = generateAnswer(query, contextJournals);

            // Set output attributes
            span.setAttribute('output.total_journals', rerankedJournals.slice(0, resultCount).length);

            return {
                stream,
                journals: rerankedJournals.slice(0, resultCount) // Return top re-ranked journals to frontend
            };
        } finally {
            span.end();
        }
    });
}
