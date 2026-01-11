import type { Journal } from '@/lib/types/journal';
import Cerebras from '@cerebras/cerebras_cloud_sdk';
import { tracer } from '@/lib/instrumentation';
import { Span } from '@opentelemetry/api';
import { tracePayload, traceDocuments } from '@/lib/utils/traceUtils';


import { keyManager } from './keyManager';

export const runtime = "nodejs";

const MODEL_NAME = 'gpt-oss-120b'; // Example model, adjust if necessary

function createClient(apiKey: string) {
    return new Cerebras({ apiKey });
}

interface CerebrasResponse {
    _response: {
        headers: Headers;
    };
}

function parseRateLimitHeader(headers: Headers, name: string): number {
    const val = headers.get(name);
    return val ? Number(val) : -1;
}

async function handleRateLimits(headers: Headers, keyName: string) {
    const periods = ['minute', 'hour', 'day'] as const;
    const types = ['requests', 'tokens'] as const;

    const RPM_THRESHOLD = 5;
    const TPM_THRESHOLD = 2000;

    for (const period of periods) {
        for (const type of types) {
            const remainingName = `x-ratelimit-remaining-${type}-${period}`;
            const resetName = `x-ratelimit-reset-${type}-${period}`;

            const remaining = parseRateLimitHeader(headers, remainingName);
            const reset = parseRateLimitHeader(headers, resetName);

            if (remaining === -1) continue;

            // Determine limit type for DB (rpm, rph, rpd, tpm, tph, tpd)
            const dbLimitType = `${type === 'requests' ? 'r' : 't'}p${period[0]}` as any;
            const threshold = type === 'requests' ? RPM_THRESHOLD : TPM_THRESHOLD;

            if (remaining < threshold) {
                console.warn(`⚠️ High usage detected for ${keyName} (${dbLimitType}): ${remaining} remaining. Reporting to DB.`);
                await keyManager.reportLimit({
                    provider: 'cerebras',
                    model: MODEL_NAME,
                    keyName: keyName,
                    limitType: dbLimitType,
                    remaining: remaining,
                    resetInSeconds: Math.ceil(reset)
                });
            }
        }
    }
}

async function withCerebrasRotation<T>(
    fn: (client: Cerebras, keyName: string) => Promise<T>,
    span?: Span,
    maxRetry = 3
): Promise<T> {
    let lastError: unknown;
    let retriesExhausted = false;

    for (let i = 0; i < maxRetry; i++) {
        const { key, name } = await keyManager.getAvailableKey('cerebras', MODEL_NAME);
        const client = createClient(key);

        try {
            span?.addEvent('Using Cerebras API key', {
                key_name: name,
                retry_count: i
            });

            const result = await fn(client, name);

            // If the SDK provides the raw response in the result
            if ((result as any)?._response?.headers) {
                await handleRateLimits((result as any)._response.headers, name);
            }

            return result;
        } catch (err: any) {
            lastError = err;

            // Report limit if we get a 429
            if (err?.status === 429) {
                console.error(`🚨 429 Rate Limit Error for ${name}:`, err.message);

                // Parse error message for more details
                const errorMsg = err?.message || '';
                const errorBody = err?.error || {};

                // Log full error for debugging
                console.error('Full error details:', {
                    status: err?.status,
                    message: errorMsg,
                    error: errorBody,
                    headers: err?.headers
                });

                // Determine limit type from error message first
                let limitType: 'rpm' | 'rph' | 'rpd' | 'tpm' | 'tph' | 'tpd' = 'rpm';

                if (errorMsg.toLowerCase().includes('tokens per day') || errorMsg.toLowerCase().includes('tpd')) {
                    limitType = 'tpd';
                } else if (errorMsg.toLowerCase().includes('tokens per hour') || errorMsg.toLowerCase().includes('tph')) {
                    limitType = 'tph';
                } else if (errorMsg.toLowerCase().includes('tokens per minute') || errorMsg.toLowerCase().includes('tpm')) {
                    limitType = 'tpm';
                } else if (errorMsg.toLowerCase().includes('requests per day') || errorMsg.toLowerCase().includes('rpd')) {
                    limitType = 'rpd';
                } else if (errorMsg.toLowerCase().includes('requests per hour') || errorMsg.toLowerCase().includes('rph')) {
                    limitType = 'rph';
                }

                // Set appropriate default reset time based on limit type
                let resetInSeconds: number;
                if (limitType === 'rpm' || limitType === 'tpm') {
                    resetInSeconds = 60; // 1 minute
                } else if (limitType === 'rph' || limitType === 'tph') {
                    resetInSeconds = 3600; // 1 hour (60 minutes)
                } else { // rpd or tpd
                    resetInSeconds = 86400; // 24 hours
                }

                // Try to extract reset time from error message (this overrides default)
                // Cerebras might include "Retry after X seconds" or similar
                const retryMatch = errorMsg.match(/retry after (\d+) seconds?/i);
                if (retryMatch) {
                    resetInSeconds = parseInt(retryMatch[1]);
                    console.log(`📊 Extracted reset time from error: ${resetInSeconds}s`);
                }

                console.log(`📊 Rate limit type detected: ${limitType}, reset in ${resetInSeconds}s`);

                await keyManager.reportLimit({
                    provider: 'cerebras',
                    model: MODEL_NAME,
                    keyName: name,
                    limitType: limitType,
                    remaining: 0,
                    resetInSeconds: resetInSeconds
                });

                // Mark that we hit rate limits
                retriesExhausted = true;
                continue;
            }

            // Handle Connection/Timeout errors
            if (err?.code === 'ETIMEDOUT' || err?.message?.includes('Connection error') || err?.message?.includes('fetch failed')) {
                console.warn(`⚠️ Cerebras connection error on key ${name}, retrying...`, err.message);
                continue;
            }

            if (err?.message?.includes('rate limit')) {
                retriesExhausted = true;
                continue;
            }

            throw err;
        }
    }

    // If we exhausted all retries due to rate limits, throw a user-friendly error
    if (retriesExhausted && lastError && (lastError as any)?.status === 429) {
        throw new Error('All API keys have reached their rate limits. Please try again later or upgrade your plan for more capacity.');
    }

    throw lastError;
}


export async function expandQuery(
    query: string,
    scope: 'all' | 'national' | 'international' = 'all'
): Promise<string[]> {
    return tracer.startActiveSpan('rag.query_expansion', async (span: Span) => {
        span.setAttribute('openinference.span.kind', 'CHAIN');
        try {
            span.setAttribute('input.query', query);
            span.setAttribute('input.scope', scope);

            let language = 'English';
            if (scope === 'national') {
                language = 'Bahasa Indonesia';
            } else if (scope === 'international') {
                language = 'English';
            } else {
                language = 'English + Bahasa Indonesia';
            }

            try {
                const prompt = `You are an expert research assistant.
    Please provide additional search keywords and phrases for each of the key aspects of the following queries that make it easier to find the scientific document that supports or rejects the scientific fact in the query field 
    Your task is to generate 5 short and effective academic search queries based on the user input using language ${language}.

    STRICT RULES:
    1. Queries MUST be short and concise (1-3 keywords each).
    2. Avoid long phrases, sentences, or unnecessary descriptors.
    6. If the user input is short or ambiguous, expand ONLY by adding essential keywords (topic, method, or domain) — keep it compact.
    7. Each query should represent a different angle:
    - Core topic
    - Method / approach
    - Application / domain
    8. DO NOT use full sentences.
    9. DO NOT include explanations, numbering, or metadata.
    10. Return ONLY a raw JSON array of strings.

    OUTPUT FORMAT (STRICT):
    ["query1", "query2", "query3", "query4", "query5"]
    `;

                const response = await withCerebrasRotation(
                    (client, keyName) => client.chat.completions.create({
                        model: MODEL_NAME,
                        messages: [
                            { role: 'system', content: prompt },
                            { role: 'user', content: query }
                        ],
                        reasoning_effort: 'low',
                        temperature: 1.5,
                        max_tokens: 100,
                        stop: ['\n\n']
                    }),
                    span
                );

                const text = (response as any)?.choices?.[0]?.message?.content;
                if (!text) {
                    span.setAttribute('output.expanded_queries', JSON.stringify([query]));
                    span.setAttribute('output.query_count', 1);
                    return [query];
                }

                const cleanedText = text.replace(/```json/g, '').replace(/```/g, '').trim();

                try {
                    const queries = JSON.parse(cleanedText);
                    if (Array.isArray(queries) && queries.length > 0) {
                        const expandedQueries = queries.slice(0, 5);
                        span.setAttribute('output.expanded_queries', JSON.stringify(expandedQueries));
                        span.setAttribute('output.query_count', expandedQueries.length);
                        return expandedQueries;
                    }
                } catch (e) {
                    console.warn('Failed to parse expanded queries JSON:', text);
                }

                span.setAttribute('output.expanded_queries', JSON.stringify([query]));
                span.setAttribute('output.query_count', 1);
                return [query];
            } catch (error) {
                console.error('Query expansion failed:', error);
                span.recordException(error as Error);
                span.setAttribute('output.expanded_queries', JSON.stringify([query]));
                span.setAttribute('output.query_count', 1);
                return [query];
            }
        } finally {
            span.end();
        }
    });
}

export async function* generateAnswer(
    query: string,
    journals: Journal[]
): AsyncGenerator<string, void, unknown> {
    // Start a span for the entire answer generation process
    const span = tracer.startSpan('rag.answer_generation');
    span.setAttribute('openinference.span.kind', 'CHAIN');

    try {
        // Set input attributes
        span.setAttribute('input.query', query);
        span.setAttribute('input.documents', traceDocuments(journals));
        span.setAttribute('input.context_journals_count', journals.length);

        // Prepare context with numbered indexing for citation
        const context = journals
            .map((journal, index) => {
                const authors = journal.authors && journal.authors.length > 0
                    ? journal.authors.join(", ")
                    : "Author tidak diketahui";
                return `[ID: ${index + 1}]
Penulis: ${authors}
Tahun: ${journal.year}
Abstrak: ${journal.abstract}`;
            })
            .join('\n\n---\n\n');

        // Record context (FULL for evaluation, truncated in prod)
        span.setAttribute('input.context', tracePayload(context));

        const SYSTEM_PROMPT = `
            <goal> Anda adalah **JurnalGPT**, asisten riset mendalam yang andal dan objektif. 
            Tugas Anda adalah menyusun **laporan riset ilmiah yang komprehensif, 
            terstruktur dengan baik, dan mudah dipahami** berdasarkan *Query* dari pengguna serta konteks yang diberikan. 
            Laporan harus menjawab seluruh aspek pertanyaan pengguna secara menyeluruh. </goal> 

            <report_format>
            Tuliskan satu paragraf utuh dalam gaya laporan ilmiah yang ditujukan untuk audiens luas. 
            Paragraf harus mengalir secara alami dan koheren. 
            Jangan gunakan poin, daftar, atau subbagian apa pun yang memecah paragraf.
            </report_format>

            <style_guide>
            Gunakan bahasa akademik formal dan objektif. 
            Terapkan format Markdown standar agar mudah disalin ke Microsoft Word. 
            Gunakan teks tebal  temuan penting dan 
            teks miring untuk  istilah asing atau bahasa lain. 
            Awali paragraf dengan kalimat topik yang jelas tanpa mengutip jurnal dan pastikan alur logis antarkalimat tetap terjaga.
            </style_guide>

            <citations> 
            - Dalam kalimat tuliskan kutipan, Nama (Tahun), Nama dan Nama (Tahun), Nama et al. (Tahun)
            - Gunakan marker numerik dalam tanda kurung siku seperti [1], [2], [3] untuk mensitasi.
            - Angka di dalam kurung [n] merujuk pada [ID: n] yang ada di KONTEKS JURNAL.
            - Marker ditempatkan langsung SETELAH klaim faktual atau pernyataan yang didukung sumber tersebut.
            - Satu marker hanya boleh merujuk pada SATU referensi. Jika ada dua sumber, gunakan dua marker terpisah (contoh: "...seperti ini [1] [2]"). 
            - DILARANG menggabungkan marker seperti [1,2] atau [1-3].
            - JANGAN menyertakan bagian "Daftar Pustaka" atau "References" di akhir teks.
            - Jika sumber tersedia dan relevan, WAJIB menyertakan sitasi.
            </citations>

            <output> 
            Tuliskan laporan **dalam Bahasa Indonesia**, terdiri dari **satu paragraf yang padat**, 
            tanpa daftar atau poin. Gunakan nada akademik yang netral, presisi tinggi, dan setara dengan 
            tulisan jurnal ilmiah. Seluruh aturan di atas **WAJIB** dipatuhi. 
            </output>`;

        const user_prompt = `
                QUERY:
                ${query}

                KONTEKS JURNAL:
                ${context}
                `;


        const response = await withCerebrasRotation(
            (client, keyName) => client.chat.completions.create({
                model: MODEL_NAME,
                messages: [
                    { role: 'system', content: SYSTEM_PROMPT },
                    { role: 'user', content: user_prompt }
                ],
                stream: true,
                temperature: 0,
                reasoning_effort: 'low',
            }),
            span,

        );

        let fullAnswer = '';
        for await (const chunk of response) {
            const content = (chunk as any).choices[0]?.delta?.content;
            if (content) {
                fullAnswer += content;
                yield content;
            }
        }

        // Record the complete answer
        span?.addEvent('prompt_cache_check', {
            cached_tokens: (response as any)?.usage?.prompt_tokens_details?.cached_tokens ?? 0
        });

        span.setAttribute('output.answer', fullAnswer);
    } catch (error) {
        console.error('LLM generation failed:', error);
        span.recordException(error as Error);
        yield 'Maaf, terjadi kesalahan saat menghasilkan jawaban. Silakan coba lagi.';
    } finally {
        span.end();
    }
}
