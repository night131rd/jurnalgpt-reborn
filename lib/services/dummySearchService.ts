import type { Journal } from '@/lib/types/journal';
import { SearchStatus } from './searchService';

/**
 * Mock version of searchJournals that simulates the RAG pipeline with delays.
 * Use this to test UI/Loading animations without consuming API credits.
 */
export async function* searchJournals(
    query: string,
    minYear?: number,
    maxYear?: number,
    scope?: 'national' | 'international',
    isPremium?: boolean
): AsyncGenerator<SearchStatus, void, unknown> {
    const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

    // 1. Simulate Expansion
    yield {
        type: 'expansion',
        keywords: [
            `${query} review`,
            `${query} 2024 studies`,
            'scientific analysis',
            'comparative research'
        ]
    };
    await sleep(2000);

    // 2. Simulate Retrieval
    yield {
        type: 'retrieval',
        sources: [
            { name: 'OpenAlex', count: 42 },
            { name: 'Semantic Scholar', count: 28 },
            { name: 'Core.ac.uk', count: 15 }
        ]
    };
    await sleep(2500);

    // 3. Simulate Reranking Start
    yield { type: 'reranking' };
    await sleep(2000);

    // 4. Simulate Reranking Complete
    yield { type: 'reranked', count: 12 };
    await sleep(1000);

    // 5. Yield Mock Journals
    const mockJournals: Journal[] = [
        {
            title: "Exploring the Future of JurnalGPT: A User Interface Study",
            year: 2024,
            publisher: "OpenAlex",
            journalLink: "https://bankdata.kpai.go.id/files/2021/02/Hasil-Survei-KPAI-2020-Pemenuhan-dan-Perlidunga-di-Masa-Covid-19.pdf",
            abstract: "This study explores how loading animations affect user perceived latency in AI-driven research assistant applications...",
            doi: "10.1234/debug.2024.1",
            authors: ["Dr. Jane Smith", "Prof. Alan Turing"],
            citationCount: 12,
            source: "openalex"
        },
        {
            title: "Advancements in RAG Systems for Academic Search",
            year: 2023,
            publisher: "Semantic Scholar",
            journalLink: "https://bankdata.kpai.go.id/files/2021/02/Hasil-Survei-KPAI-2020-Pemenuhan-dan-Perlidunga-di-Masa-Covid-19.pdf",
            abstract: "Recent developments in Retrieval Augmented Generation have revolutionized how we interact with scientific literature...",
            doi: "10.1234/debug.2023.2",
            authors: ["Dr. Robert Miles", "Yann LeCun"],
            citationCount: 156,
            source: "semantic-scholar"
        }
    ];
    yield { type: 'journals', journals: mockJournals };

    // 6. Simulate Answer Start
    // We create a mini-generator for the text
    async function* mockAnswerStream() {
        const text = "Hasil pencarian menunjukkan bahwa JurnalGPT adalah asisten riset yang sangat efisien [1]. Sistem ini mampu mengintegrasikan berbagai sumber data secara real-time untuk memberikan jawaban yang akurat [2]. Penggunaan animasi loading yang progresif juga terbukti meningkatkan kepuasan pengguna dalam menunggu hasil [1] [2].";
        const words = text.split(" ");
        for (const word of words) {
            yield word + " ";
            await sleep(30); // Typing effect
        }
    }

    yield { type: 'answer_start', stream: mockAnswerStream() };
}
