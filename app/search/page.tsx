"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/Navbar";
import SearchCard from "@/components/SearchCard";
import LoadingAnimation from "@/components/LoadingAnimation";
import AnswerSection from "@/components/AnswerSection";
import JournalCard from "@/components/JournalCard";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SearchResult } from "@/lib/types/journal";
import { useSearchParams } from "next/navigation";

function SearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || "";
    const initialMinYear = searchParams.get('minYear') || "2020";
    const initialMaxYear = searchParams.get('maxYear') || "2025";
    const initialScope = (searchParams.get('scope') as 'all' | 'national' | 'international') || 'all';

    const [isLoading, setIsLoading] = useState(false);
    const [showResults, setShowResults] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const resultsRef = useRef<HTMLDivElement>(null);

    // Auto-trigger search if query parameter exists
    useEffect(() => {
        if (initialQuery && !showResults && !isLoading) {
            handleSearch(initialQuery, initialMinYear, initialMaxYear, initialScope);
        }
    }, [initialQuery]);

    const handleSearch = async (query: string, minYear: string, maxYear: string, scope: 'all' | 'national' | 'international') => {
        setIsLoading(true);
        setShowResults(false);
        setSearchResult(null);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, minYear, maxYear, scope }),
            });

            if (!response.ok) {
                if (response.status === 403) {
                    setIsLoading(false);
                    return;
                }
                throw new Error('Search failed');
            }

            const reader = response.body?.getReader();
            if (!reader) throw new Error('No reader available');

            setRefreshTrigger(prev => prev + 1);

            const decoder = new TextDecoder();
            let buffer = '';
            let isJournalsLoaded = false;
            let accumulatedAnswer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const text = decoder.decode(value, { stream: true });

                if (!isJournalsLoaded) {
                    buffer += text;
                    const newlineIndex = buffer.indexOf('\n');
                    if (newlineIndex !== -1) {
                        const line = buffer.slice(0, newlineIndex);
                        if (line.startsWith('J:')) {
                            try {
                                const data = JSON.parse(line.slice(2));
                                setSearchResult({ journals: data.journals, answer: '' });
                                setIsLoading(false);
                                setShowResults(true);
                                isJournalsLoaded = true;

                                setTimeout(() => {
                                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);

                                const remaining = buffer.slice(newlineIndex + 1);
                                if (remaining) {
                                    accumulatedAnswer += remaining;
                                    setSearchResult(prev => prev ? ({ ...prev, answer: accumulatedAnswer }) : null);
                                }
                                buffer = '';
                            } catch (e) {
                                console.error('Failed to parse journals JSON:', e);
                            }
                        }
                    }
                } else {
                    accumulatedAnswer += text;
                    setSearchResult(prev => prev ? ({ ...prev, answer: accumulatedAnswer }) : null);
                }
            }
        } catch (error) {
            console.error('Search error:', error);
            setIsLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <section className="relative pt-32 pb-20">
                <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
                    <motion.div layout className="flex flex-col items-center">
                        <AnimatePresence mode="wait">
                            {!isLoading && !showResults && (
                                <motion.div
                                    key="mascot"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.3 } }}
                                    transition={{ duration: 0.5, delay: 0.2 }}
                                    className="relative mt-12 mb-8"
                                >
                                    <div className="relative">
                                        <motion.div
                                            animate={{ y: [0, -8, 0] }}
                                            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                                            className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-lg ring-1 ring-black/5"
                                        >
                                            Ada yang aku bisa bantu cari? 🔍
                                            <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white ring-1 ring-black/5"></div>
                                        </motion.div>

                                        <div className="relative h-32 w-32">
                                            <Image
                                                src="/dog_thinking.png"
                                                alt="JurnalGPT Assistant"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <motion.div
                            layout
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="w-full flex justify-center"
                        >
                            <SearchCard
                                onSearch={handleSearch}
                                initialQuery={initialQuery}
                                initialMinYear={initialMinYear}
                                initialMaxYear={initialMaxYear}
                                initialScope={initialScope}
                                refreshTrigger={refreshTrigger}
                            />
                        </motion.div>
                    </motion.div>

                    <div ref={resultsRef} className="mt-16 scroll-mt-32 min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {isLoading ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                    transition={{ duration: 0.3 }}
                                >
                                    <LoadingAnimation />
                                </motion.div>
                            ) : showResults && searchResult ? (
                                <motion.div
                                    key="results"
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.5, ease: "easeOut" }}
                                    className="mx-auto max-w-4xl"
                                >
                                    <AnswerSection answer={searchResult.answer} />

                                    <div className="mb-8">
                                        <div className="grid gap-4">
                                            {searchResult.journals.map((journal, index) => (
                                                <JournalCard key={index} {...journal} index={index} />
                                            ))}
                                        </div>
                                    </div>
                                </motion.div>
                            ) : null}
                        </AnimatePresence>
                    </div>
                </div>
            </section>
        </main>
    );
}

export default function SearchPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><LoadingAnimation /></div>}>
            <SearchContent />
        </Suspense>
    );
}
