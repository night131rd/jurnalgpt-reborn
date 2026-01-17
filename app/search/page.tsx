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
import ResultsSummary from "@/components/ResultsSummary";
import Link from "next/link";
import { Lock, Zap } from "lucide-react";

function SearchContent() {
    const searchParams = useSearchParams();
    const initialQuery = searchParams.get('q') || "";
    const initialMinYear = searchParams.get('minYear') || "2020";
    const initialMaxYear = searchParams.get('maxYear') || "2025";
    const initialScope = (searchParams.get('scope') as 'all' | 'national' | 'international') || 'all';

    const [isLoading, setIsLoading] = useState(false);
    const [loadingStatus, setLoadingStatus] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);

    // Decoupled States
    const [journals, setJournals] = useState<Journal[]>([]);
    const [answer, setAnswer] = useState('');
    const [currentSearchKey, setCurrentSearchKey] = useState('');

    const [userRole, setUserRole] = useState<"free" | "premium" | "guest">("free");
    const [refreshTrigger, setRefreshTrigger] = useState(0);

    const [detailJournal, setDetailJournal] = useState<Journal | null>(null);
    const [detailTab, setDetailTab] = useState<'abstract' | 'pdf'>('abstract');
    const resultsRef = useRef<HTMLDivElement>(null);

    // Fetch user role
    useEffect(() => {
        const fetchRole = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data } = await supabase
                    .from('profiles')
                    .select('role')
                    .eq('id', session.user.id)
                    .single();

                if (data?.role) {
                    setUserRole(data.role as "free" | "premium");
                }
            } else {
                setUserRole("guest");
            }
        };
        fetchRole();
    }, []);

    // Auto-trigger search or restore from cache
    useEffect(() => {
        if (initialQuery && !showResults && !isLoading) {
            const cacheKey = `search_cache_${initialQuery}_${initialMinYear}_${initialMaxYear}_${initialScope}`;
            const cachedData = sessionStorage.getItem(cacheKey);

            if (cachedData) {
                try {
                    const parsed = JSON.parse(cachedData);
                    setJournals(parsed.journals);
                    setAnswer(parsed.answer);
                    setShowResults(true);
                    setIsLoading(false);
                    return; // Skip new search if cache hit
                } catch (e) {
                    sessionStorage.removeItem(cacheKey);
                }
            }

            handleSearch(initialQuery, initialMinYear, initialMaxYear, initialScope);
        }
    }, [initialQuery, initialMinYear, initialMaxYear, initialScope]);

    const abortControllerRef = useRef<AbortController | null>(null);

    const handleSearch = async (query: string, minYear: string, maxYear: string, scope: 'all' | 'national' | 'international') => {
        const searchKey = `${query}-${minYear}-${maxYear}-${scope}`;

        // 0. Update URL search parameters
        if (typeof window !== 'undefined') {
            const params = new URLSearchParams(window.location.search);
            params.set('q', query);
            params.set('minYear', minYear);
            params.set('maxYear', maxYear);
            params.set('scope', scope);
            window.history.pushState({}, '', `${window.location.pathname}?${params.toString()}`);
        }

        // 1. Reset and Abort
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        abortControllerRef.current = new AbortController();
        const signal = abortControllerRef.current.signal;

        setIsLoading(true);
        setShowResults(false);
        setJournals([]);
        setAnswer('');
        setCurrentSearchKey(searchKey);
        setLoadingStatus(null);

        try {
            const response = await fetch('/api/search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ query, minYear, maxYear, scope }),
                signal
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

            // Start showing results section early for better UX
            setShowResults(true);

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

                            // Hide global loading and show results area as soon as we move past retrieval
                            if (['reranking', 'summarizing', 'answer_start'].includes(status.type)) {
                                setIsLoading(false);
                                if (!showResults) {
                                    setShowResults(true);
                                }
                            }
                        } catch (e) {
                            console.error('Failed to parse status:', e);
                        }
                    } else if (prefix === 'J:') {
                        try {
                            const data = JSON.parse(content);
                            receivedJournals = data.journals;
                            setJournals(data.journals);

                            setIsLoading(false);
                            if (!showResults) {
                                setShowResults(true);
                                setTimeout(() => {
                                    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                }, 100);
                            }
                        } catch (e) {
                            console.error('Failed to parse journals:', e);
                        }
                    } else if (prefix === 'T:') {
                        try {
                            const chunk = JSON.parse(content);
                            accumulatedAnswer += chunk;
                            setAnswer(accumulatedAnswer);

                            setIsLoading(false);
                            if (!showResults) {
                                setShowResults(true);
                            }
                        } catch (e) {
                            console.error('Failed to parse text chunk:', e);
                        }
                    }
                }
            }

            setIsLoading(false);
            setShowResults(true);

            // Save to Cache
            if (receivedJournals.length > 0) {
                // 1. Cache
                const cacheKey = `search_cache_${query}_${minYear}_${maxYear}_${scope}`;
                sessionStorage.setItem(cacheKey, JSON.stringify({
                    journals: receivedJournals,
                    answer: accumulatedAnswer
                }));
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
                                    {showResults && journals.length >= 0 ? (
                                        <motion.div
                                            key={currentSearchKey || "results"}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, ease: "easeOut" }}
                                            className="mx-auto w-full"
                                        >
                                            <AnswerSection
                                                answer={answer}
                                                journals={journals}
                                                onOpenJournalDetail={(j, tab) => {
                                                    setDetailJournal(j);
                                                    setDetailTab(tab || 'abstract');
                                                }}
                                            />

                                            {/* Results Meta Summary */}
                                            <ResultsSummary
                                                role={userRole}
                                                stepCount={3}
                                                sourceCount={journals.length}
                                                className="mb-6"
                                            />

                                            <div className="mb-8 flex flex-col gap-4">
                                                {/* Visible Journals (First 10) */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    {journals.slice(0, 10).map((journal, index) => (
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

                                                {/* Hidden / Blurred Journals */}
                                                {journals.length > 10 && (
                                                    <div className="relative">
                                                        <div className={cn(
                                                            "grid grid-cols-1 md:grid-cols-2 gap-4 transition-all duration-300",
                                                            (userRole === "free" || userRole === "guest") && "blur-[10px] pointer-events-none select-none opacity-30"
                                                        )}>
                                                            {journals.slice(10).map((journal, index) => (
                                                                <JournalCard
                                                                    key={index + 10}
                                                                    {...journal}
                                                                    index={index + 10}
                                                                    isActive={detailJournal?.title === journal.title}
                                                                    onOpenJournalDetail={(j) => {
                                                                        if (userRole === "premium") {
                                                                            setDetailJournal(j);
                                                                            setDetailTab('abstract');
                                                                        }
                                                                    }}
                                                                />
                                                            ))}
                                                        </div>

                                                        {(userRole === "free" || userRole === "guest") && (
                                                            <div className="absolute inset-x-0 top-0 z-20 flex justify-center pt-28 px-6">
                                                                <div className="max-w-4xl text-center">

                                                                    {/* Badge */}
                                                                    <div className="mb-6 inline-flex items-center gap-3 rounded-full bg-white/90 px-4 py-2 text-sm text-zinc-900 shadow-sm backdrop-blur">
                                                                        <span className="font-medium">
                                                                            {journals.length - 10} hasil pencarian tidak ditampilkan
                                                                        </span>
                                                                    </div>

                                                                    {/* Headline */}
                                                                    <h1 className="font-serifPremium text-1xl sm:text-1xl md:text-4xl leading-tight tracking-tight text-black">
                                                                        Kamu cuma bisa lihat{" "}
                                                                        <span className="italic text-indigo-500">10%</span>{" "}
                                                                        dari jurnal yang relevan.
                                                                        <br />
                                                                    </h1>

                                                                    {/* Subheadline */}
                                                                    <p className="mt-4 text-base sm:text-lg text-zinc-600 max-w-2xl mx-auto">
                                                                        Nggak perlu ribet cari jurnal ke banyak website.
                                                                    </p>

                                                                    {/* CTA */}
                                                                    <div className="mt-4">
                                                                        <Link
                                                                            href="/pricing"
                                                                            className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3 text-sm font-medium text-zinc-900 shadow-lg transition hover:bg-zinc-100"
                                                                        >
                                                                            Tampilkan Semua
                                                                        </Link>
                                                                    </div>

                                                                </div>
                                                            </div>
                                                        )}


                                                    </div>
                                                )}
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
