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
    | { type: 'retrieval_update', source: string, count: number }
    | { type: 'retrieval_complete', total: number }
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

    let allRawJournals: Journal[] = [];
    const sources = [
        { name: 'OpenAlex', fn: () => searchOpenAlex(oaQuery, minYear, maxYear) },
        { name: 'Semantic Scholar', fn: () => searchSemanticScholar(ssQuery, minYear, maxYear) },
        { name: 'Core.ac.uk', fn: () => searchCoreAc(coreQuery, minYear, maxYear) }
    ];

    // Execute searches in parallel and push results to a queue
    let currentJournals: Journal[] = [];
    const queue: { name: string; results: Journal[] }[] = [];
    let resolveNext: (() => void) | null = null;

    sources.forEach(async (source) => {
        try {
            const results = await source.fn();
            console.log(`  ✅ ${source.name}: ${results.length} results`);
            queue.push({ name: source.name, results });
        } catch (error) {
            console.error(`  ❌ ${source.name} failed:`, error);
            queue.push({ name: source.name, results: [] });
        } finally {
            if (resolveNext) {
                resolveNext();
                resolveNext = null;
            }
        }
    });

    // Yield results as they arrive in the queue
    for (let i = 0; i < sources.length; i++) {
        if (queue.length === 0) {
            await new Promise<void>(r => resolveNext = r);
        }

        const res = queue.shift();
        if (res) {
            // Always yield update so user knows source is done
            yield { type: 'retrieval_update', source: res.name, count: res.results.length };

            if (res.results.length > 0) {
                currentJournals = [...currentJournals, ...res.results];
                yield { type: 'journals', journals: mergeAndDeduplicate(currentJournals) };
            }
        }
    }

    const mergedJournals = mergeAndDeduplicate(currentJournals);
    yield { type: 'retrieval_complete', total: mergedJournals.length };

    // STEP 4: Semantic Reranking
    yield { type: 'reranking' };

    // We send up to rerankCount documents for reranking to get the absolute best context
    console.log(`  📊 Reranking ${mergedJournals.slice(0, 50).length} documents...`);
    const rerankedJournals = await rerankDocuments(query, mergedJournals.slice(0, 50), rerankCount);
    console.log(`  ✅ Reranked top ${rerankedJournals.length} documents`);

    yield { type: 'reranked', count: rerankedJournals.length };

    // Update UI with reranked results even before summary
    const tempFinalForRerank = [...rerankedJournals, ...mergedJournals.filter(mj => !rerankedJournals.some(rj => rj.title.toLowerCase() === mj.title.toLowerCase()))];
    yield { type: 'journals', journals: tempFinalForRerank };

    // STEP 4.5: Summarize and Score
    yield { type: 'summarizing' };
    const enrichedJournals = await summarizeAndScoreJournals(query, rerankedJournals.slice(0, summaryCount));
    yield { type: 'summarized', count: enrichedJournals.length };

    // Combine enriched journals (with summaries) and remaining reranked journals for UI
    // Enriched journals come first (most relevant + analyzed)
    const processedTitles = new Set<string>();

    const getFinalJournals = (enriched: Journal[], reranked: Journal[], merged: Journal[]) => {
        const final: Journal[] = [];
        const titles = new Set<string>();

        const addUnique = (list: Journal[]) => {
            for (const j of list) {
                const title = j.title.trim().toLowerCase();
                if (!titles.has(title)) {
                    titles.add(title);
                    final.push(j);
                }
            }
        };

        addUnique(enriched);
        addUnique(reranked);
        addUnique(merged);
        return final;
    };

    const finalJournals = getFinalJournals(enrichedJournals, rerankedJournals, mergedJournals);
    console.log(`  📋 Final UI journals: ${enrichedJournals.length} enriched + ${rerankedJournals.length} reranked + others = ${finalJournals.length} total`);

    yield { type: 'journals', journals: finalJournals };

    // STEP 5: Generate AI answer with enriched context (top resultCount journals)
    console.log(`  🤖 Generating AI answer with ${resultCount} enriched context docs...`);
    const stream = generateAnswer(query, enrichedJournals.slice(0, resultCount));
    yield { type: 'answer_start', stream };
}
