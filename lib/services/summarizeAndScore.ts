import type { Journal } from '@/lib/types/journal';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { keyManager } from './keyManager';

const MODEL_NAME = 'gpt-oss-120b';

function createClient(apiKey: string) {
    return new Cerebras({ apiKey });
}

async function withCerebrasRotation<T>(
    fn: (client: Cerebras, keyName: string) => Promise<T>,
    span?: Span,
    maxRetry = 3
): Promise<T> {
    let lastError: unknown;

    for (let i = 0; i < maxRetry; i++) {
        const { key, name } = await keyManager.getAvailableKey('cerebras', MODEL_NAME);
        const client = createClient(key);

        try {
            span?.addEvent('Using Cerebras API key', {
                key_name: name,
                retry_count: i
            });

            return await fn(client, name);
        } catch (err: any) {
            lastError = err;

            if (err?.status === 429) {
                console.error(`🚨 429 Rate Limit Error for ${name}:`, err.message);
                continue;
            }

            if (err?.code === 'ETIMEDOUT' || err?.message?.includes('Connection error') || err?.message?.includes('fetch failed')) {
                console.warn(`⚠️ Cerebras connection error on key ${name}, retrying...`, err.message);
                continue;
            }

            throw err;
        }
    }

    throw lastError;
}

export interface EnrichedJournal extends Journal {
    summary: string;
    correlationScore: number;
}

/**
 * Summarizes journal abstracts and calculates correlation scores with the query.
 * Uses LLM to generate concise 2-3 sentence summaries and relevance scores (0.0-1.0).
 */
export async function summarizeAndScoreJournals(
    query: string,
    journals: Journal[],
    span?: Span
): Promise<EnrichedJournal[]> {
    if (journals.length === 0) return [];

    const activeSpan = span || tracer.startSpan('rag.summarize_and_score');
    activeSpan.setAttribute('openinference.span.kind', 'CHAIN');
    activeSpan.setAttribute('input.query', query);
    activeSpan.setAttribute('input.journal_count', journals.length);

    try {
        console.log(`  📝 Summarizing and scoring ${journals.length} journals...`);

        // Process journals in batches to avoid overwhelming the LLM
        const batchSize = 20;
        const enrichedJournals: EnrichedJournal[] = [];

        for (let i = 0; i < journals.length; i += batchSize) {
            const batch = journals.slice(i, i + batchSize);
            const batchResults = await Promise.all(
                batch.map(journal => summarizeAndScoreOne(query, journal, activeSpan))
            );
            enrichedJournals.push(...batchResults);
        }

        // Sort by correlation score (highest to lowest)
        enrichedJournals.sort((a, b) => b.correlationScore - a.correlationScore);

        console.log(`  ✅ Summarized and scored ${enrichedJournals.length} journals`);
        activeSpan.setAttribute('output.enriched_count', enrichedJournals.length);

        return enrichedJournals;
    } catch (error) {
        console.error('Summarization and scoring failed:', error);
        activeSpan.recordException(error as Error);

        // Fallback: return journals with original abstract as summary and score 0.5
        return journals.map(journal => ({
            ...journal,
            summary: journal.abstract.slice(0, 200) + '...',
            correlationScore: 0.5
        }));
    } finally {
        if (!span) activeSpan.end();
    }
}

async function summarizeAndScoreOne(
    query: string,
    journal: Journal,
    parentSpan?: Span
): Promise<EnrichedJournal> {
    const span = tracer.startSpan('rag.summarize_one', { parent: parentSpan });

    try {
        const prompt = `You are a research assistant tasked with summarizing journal abstracts and scoring their relevance to a research query.

QUERY: "${query}"

JOURNAL TITLE: ${journal.title}

JOURNAL ABSTRACT:
${journal.abstract}

Your task:
1. Write a concise 2-3 sentence summary of this abstract in Bahasa Indonesia
2. Score how relevant this journal is to the query (0.0 = not relevant, 1.0 = highly relevant)

Respond ONLY with valid JSON in this exact format:
{
  "summary": "Your 2-3 sentence summary here",
  "score": 0.85
}`;

        const response = await withCerebrasRotation(
            (client) => client.chat.completions.create({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: 'You are a precise research assistant. Always respond with valid JSON only.' },
                    { role: 'user', content: prompt }
                ],
                temperature: 0,
                reasoning_effort: 'low',
                max_tokens: 200
            }),
            span
        );

        const text = (response as any)?.choices?.[0]?.message?.content?.trim();

        if (!text) {
            throw new Error('Empty response from LLM');
        }

        // Parse JSON response
        const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const result = JSON.parse(cleanedText);

        return {
            ...journal,
            summary: result.summary || journal.abstract.slice(0, 200) + '...',
            correlationScore: Math.max(0, Math.min(1, result.score || 0.5))
        };
    } catch (error) {
        console.warn(`Failed to summarize journal "${journal.title}":`, error);
        span.recordException(error as Error);

        // Fallback
        return {
            ...journal,
            summary: journal.abstract.slice(0, 200) + '...',
            correlationScore: 0.5
        };
    } finally {
        span.end();
    }
}
