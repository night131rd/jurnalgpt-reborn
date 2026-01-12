import { searchCoreAc } from './coreAc';
import { searchOpenAlex } from './openalex';
import { searchSemanticScholar } from './semanticScholar';
import { generateAnswer, expandQuery } from './llmService';
import { mergeAndDeduplicate } from '@/lib/utils/mergeResults';
import { rerankDocuments } from './documentReranking';
import { summarizeAndScoreJournals } from './summarizeAndScore';
import type { SearchResult, Journal } from '@/lib/types/journal';

export type SearchStatus =
    | { type: 'expansion', keywords: string[] }
    | { type: 'retrieval', sources: { name: string; count: number }[] }
    | { type: 'reranking' }
    | { type: 'reranked', count: number }
    | { type: 'summarizing' }
    | { type: 'summarized', count: number }
    | { type: 'journals', journals: Journal[] }
    | { type: 'answer_start', stream: AsyncGenerator<string, void, unknown> };

export async function* searchJournals(
    query: string,
    minYear: string,
    maxYear: string,
    scope: 'all' | 'national' | 'international' = 'all',
    isPremium: boolean = false
): AsyncGenerator<SearchStatus, void, unknown> {
    const rerankCount = isPremium ? 30 : 20;
    const summaryCount = isPremium ? 16 : 8;
    const resultCount = isPremium ? 8 : 4;

    // STEP 1: Expand query using LLM (with scope)
    console.log(`🔍 Original query: "${query}" [Scope: ${scope}]`);
    const expandedQueries = await expandQuery(query, scope);
    console.log(`✨ Expanded to: ${JSON.stringify(expandedQueries)}`);

    yield { type: 'expansion', keywords: expandedQueries };

    // STEP 2: Search APIs (Optimized with Boolean Queries)
    const oaQuery = expandedQueries.join('|');
    const ssQuery = expandedQueries.join('|');
    const coreQuery = expandedQueries[0];

    console.log(`  Combined Query OpenAlex: "${oaQuery}"`);
    console.log(`  Combined Query Semantic Scholar: "${ssQuery}"`);
    console.log(`  Combined Query Core: "${coreQuery}"`);

    const [openAlexResults, semanticResults, coreResult] = await Promise.allSettled([
        searchOpenAlex(oaQuery, minYear, maxYear),
        searchSemanticScholar(ssQuery, minYear, maxYear),
        searchCoreAc(coreQuery, minYear, maxYear)
    ]);

    // Extract successful results
    const openAlex = openAlexResults.status === 'fulfilled' ? openAlexResults.value : [];
    const semantic = semanticResults.status === 'fulfilled' ? semanticResults.value : [];
    const coreAc = coreResult.status === 'fulfilled' ? coreResult.value : [];

    console.log(`  ✅ OpenAlex: ${openAlex.length} results`);
    console.log(`  ✅ Semantic Scholar: ${semantic.length} results`);
    console.log(`  ✅ Core.ac.uk: ${coreAc.length} results`);

    yield {
        type: 'retrieval',
        sources: [
            { name: 'OpenAlex', count: openAlex.length },
            { name: 'Semantic Scholar', count: semantic.length },
            { name: 'Core.ac.uk', count: coreAc.length }
        ]
    };

    const allJournals = [...openAlex, ...semantic, ...coreAc];
    console.log(`  ✅ Total raw results: ${allJournals.length}`);
    const mergedJournals = mergeAndDeduplicate(allJournals);
    console.log(`  🔀 Merged: ${mergedJournals.length} unique journals`);

    // STEP 4: Semantic Reranking
    yield { type: 'reranking' };

    // We send up to rerankCount documents for reranking to get the absolute best context
    console.log(`  📊 Reranking ${mergedJournals.slice(0, 50).length} documents...`);
    const rerankedJournals = await rerankDocuments(query, mergedJournals.slice(0, 50), rerankCount);
    console.log(`  ✅ Reranked top ${rerankedJournals.length} documents`);

    yield { type: 'reranked', count: rerankedJournals.length };

    // STEP 4.5: Summarize and Score
    yield { type: 'summarizing' };
    const enrichedJournals = await summarizeAndScoreJournals(query, rerankedJournals.slice(0, summaryCount));
    yield { type: 'summarized', count: enrichedJournals.length };

    // Combine enriched journals (with summaries) and remaining reranked journals for UI
    // Enriched journals come first (most relevant + analyzed)
    const processedTitles = new Set<string>();

    // 1. Enriched (Top Priority)
    const enrichedUnique = enrichedJournals.filter(j => {
        const title = j.title.trim().toLowerCase();
        if (processedTitles.has(title)) return false;
        processedTitles.add(title);
        return true;
    });

    // 2. Remaining Reranked (Medium Priority)
    const rerankedUnique = rerankedJournals.filter(j => {
        const title = j.title.trim().toLowerCase();
        if (processedTitles.has(title)) return false;
        processedTitles.add(title);
        return true;
    });

    // 3. Merged / Rest (Low Priority)
    const mergedUnique = mergedJournals.filter(j => {
        const title = j.title.trim().toLowerCase();
        if (processedTitles.has(title)) return false;
        processedTitles.add(title);
        return true;
    });

    const finalJournals = [...enrichedUnique, ...rerankedUnique, ...mergedUnique];
    console.log(`  📋 Final UI journals: ${enrichedUnique.length} enriched + ${rerankedUnique.length} reranked + ${mergedUnique.length} merged = ${finalJournals.length} total`);

    yield { type: 'journals', journals: finalJournals };

    // STEP 5: Generate AI answer with enriched context (top resultCount journals)
    console.log(`  🤖 Generating AI answer with ${resultCount} enriched context docs...`);
    const stream = generateAnswer(query, enrichedJournals.slice(0, resultCount));
    yield { type: 'answer_start', stream };
}
