"use client";

import { Suspense, useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoadingAnimation from "@/components/LoadingAnimation";
import DashboardLayout from "@/components/DashboardLayout";
import SearchCard from "@/components/SearchCard";
import AnswerSection from "@/components/AnswerSection";
import JournalCard from "@/components/JournalCard";
import PaperDetailPanel from "@/components/PaperDetailPanel";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { SearchResult, Journal } from "@/lib/types/journal";
import { useSearchParams } from "next/navigation";
import DashboardNavbar from "@/components/DashboardNavbar";
import { supabase } from "@/lib/supabase";

function SearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || "";
    const initialMinYear = searchParams.get('minYear') || "2020";
    const initialMaxYear = searchParams.get('maxYear') || "2025";
    const initialScope = (searchParams.get('scope') as 'all' | 'national' | 'international') || 'all';

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);
    const [searchResult, setSearchResult] = useState<SearchResult | null>(null);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [detailJournal, setDetailJournal] = useState<Journal | null>(null);
    const [detailTab, setDetailTab] = useState<'abstract' | 'pdf'>('abstract');
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
        setLoadingStatus(null);

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
            let accumulatedAnswer = '';
            let receivedJournals: any[] = [];
            let buffer = '';

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                buffer += decoder.decode(value, { stream: true });
                const lines = buffer.split('\n');

                // Keep the last partial line in the buffer
                buffer = lines.pop() || '';

                for (const line of lines) {
                    if (!line || line.trim() === '') continue;

                    const prefix = line.substring(0, 2);
                    const content = line.substring(2);

                    if (prefix === 'S:') {
                        try {
                            const status = JSON.parse(content);
                            setLoadingStatus(status);
                        } catch (e) {
                            console.error('Failed to parse status:', e);
                        }
                    } else if (prefix === 'J:') {
                        try {
                            const data = JSON.parse(content);
                            receivedJournals = data.journals;
                            setSearchResult({ journals: data.journals, answer: '' });
                            setIsLoading(false);
                            setShowResults(true);

                            setTimeout(() => {
                                resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                            }, 100);
                        } catch (e) {
                            console.error('Failed to parse journals:', e);
                        }
                    } else if (prefix === 'T:') {
                        try {
                            accumulatedAnswer += JSON.parse(content);
                            setSearchResult(prev => prev ? ({ ...prev, answer: accumulatedAnswer }) : null);
                        } catch (e) {
                            console.error('Failed to parse text chunk:', e);
                        }
                    }
                }
            }

            // Save search history with full conversation results after streaming completes (fire and forget)
            if (receivedJournals.length > 0) {
                const conversation = [
                    { role: 'user', content: query, filters: { minYear, maxYear, scope } },
                    { role: 'assistant', content: accumulatedAnswer, journals: receivedJournals }
                ];

                supabase.auth.getSession().then(({ data: { session } }) => {
                    if (session) {
                        fetch('/api/history', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': `Bearer ${session.access_token}`
                            },
                            body: JSON.stringify({
                                query,
                                payload: conversation
                            })
                        }).catch(console.error);
                    }
                });
            }
        } catch (error) {
            console.error('Search error:', error);
            setIsLoading(false);
        }
    };

    const [scrolled, setScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrolled(e.currentTarget.scrollTop > 10);
    };

    return (
        <div className="flex h-full overflow-hidden bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [background-position:center]">
            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 relative h-full">
                <DashboardNavbar />
                {/* Scrollable Area */}
                <div
                    ref={scrollContainerRef}
                    onScroll={handleScroll}
                    className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
                >
                    <section className="relative pt-16 pb-20">
                        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                            <motion.div layout className="flex flex-col items-center">
                                <AnimatePresence mode="wait">
                                    {!isLoading && !showResults && (
                                        <motion.div
                                            key="slogan"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, scale: 0.9, y: -20, transition: { duration: 0.3 } }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="text-center mt-12 mb-12"
                                        >
                                            <motion.h1
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ duration: 0.6, delay: 0.1 }}
                                                className="text-center text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-zinc-900 mx-auto max-w-4xl"
                                            >
                                                Jawaban, Kutipan, dan Daftar Pustaka,
                                                <span className="block mt-2 text-xl sm:text-2xl lg:text-3xl bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
                                                    semua dalam satu tempat.
                                                </span>
                                            </motion.h1>



                                            <p className="sr-only">
                                                AI yang menjawab berdasarkan jurnal untuk membantu mahasiswa dalam mengerjakan laprak & skripsi.
                                            </p>
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
                                        isLoading={isLoading}
                                        loadingStatus={loadingStatus}
                                    />
                                </motion.div>

                            </motion.div>

                            <div ref={resultsRef} className="mt-16 scroll-mt-32 min-h-[400px]">
                                <AnimatePresence mode="wait">
                                    {showResults && searchResult ? (
                                        <motion.div
                                            key="results"
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="mx-auto w-full"
                                        >
                                            <AnswerSection
                                                answer={searchResult.answer}
                                                journals={searchResult.journals}
                                                onOpenJournalDetail={(j, tab) => {
                                                    setDetailJournal(j);
                                                    setDetailTab(tab || 'abstract');
                                                }}
                                            />

                                            <div className="mb-8 overflow-x-hidden">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {searchResult.journals.map((journal, index) => (
                                                        <JournalCard
                                                            key={index}
                                                            {...journal}
                                                            index={index}
                                                            isActive={detailJournal?.title === journal.title}
                                                            onOpenJournalDetail={(j) => {
                                                                setDetailJournal(j);
                                                                setDetailTab('abstract');
                                                            }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : null}
                                </AnimatePresence>
                            </div>
                        </div>
                    </section>
                </div>
            </div>

            {/* Right Panel - Always full height */}
            {detailJournal && (
                <PaperDetailPanel
                    journal={detailJournal}
                    onClose={() => setDetailJournal(null)}
                    initialTab={detailTab}
                />
            )}
        </div>
    );
}

export default function SearchPage() {
    return (
        <DashboardLayout>
            <Suspense fallback={<div className="min-h-screen bg-white flex items-center justify-center"><LoadingAnimation /></div>}>
                <SearchContent />
            </Suspense>
        </DashboardLayout>
    );
}
