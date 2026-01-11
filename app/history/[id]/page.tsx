"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import AnswerSection from "@/components/AnswerSection";
import JournalCard from "@/components/JournalCard";
import PaperDetailPanel from "@/components/PaperDetailPanel";
import { ArrowLeft, Clock, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { cn } from "@/lib/utils";
import DashboardNavbar from "@/components/DashboardNavbar";
import type { Journal } from "@/lib/types/journal";

interface HistoryDetail {
    id: string;
    query: string;
    filters: {
        minYear: string;
        maxYear: string;
        scope: string;
    };
    answer: string;
    journals: Journal[];
    payload: any[];
    created_at: string;
}

export default function HistoryDetailPage() {
    const params = useParams();
    const router = useRouter();
    const historyId = params.id as string;

    const [historyData, setHistoryData] = useState<HistoryDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [detailJournal, setDetailJournal] = useState<Journal | null>(null);
    const [detailTab, setDetailTab] = useState<'abstract' | 'pdf'>('abstract');

    const [scrolled, setScrolled] = useState(false);
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        setScrolled(e.currentTarget.scrollTop > 10);
    };

    useEffect(() => {
        fetchHistoryDetail();
    }, [historyId]);

    const fetchHistoryDetail = async () => {
        setIsLoading(true);
        setError(null);

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login?redirect=/history/' + historyId);
                return;
            }

            const response = await fetch(`/api/history?limit=100`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to fetch history');
            }

            const data = await response.json();
            const entry = data.history?.find((h: any) => h.id === historyId);

            if (!entry) {
                setError('Histori tidak ditemukan');
                return;
            }

            // Extract from conversation payload
            const userPart = entry.payload?.find((p: any) => p.role === 'user');
            const assistantPart = entry.payload?.find((p: any) => p.role === 'assistant');

            setHistoryData({
                id: entry.id,
                query: entry.query,
                filters: userPart?.filters || {},
                answer: assistantPart?.content || '',
                journals: assistantPart?.journals || [],
                payload: entry.payload || [],
                created_at: entry.created_at
            });
        } catch (err) {
            console.error('Failed to fetch history detail:', err);
            setError('Gagal memuat histori');
        } finally {
            setIsLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (isLoading) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin w-8 h-8 border-4 border-zinc-200 border-t-blue-600 rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    if (error || !historyData) {
        return (
            <DashboardLayout>
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
                    <p className="text-zinc-500 mb-4">{error || 'Histori tidak ditemukan'}</p>
                    <button
                        onClick={() => router.push('/history')}
                        className="text-blue-600 hover:text-blue-700 font-medium"
                    >
                        ← Kembali ke Histori
                    </button>
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <div className="flex h-full overflow-hidden bg-white bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:24px_24px] [background-position:center]">
                {/* Main Content Area */}
                <div className="flex-1 flex flex-col min-w-0 relative h-full">
                    <DashboardNavbar />
                    {/* Scrollable Main content Area */}
                    <div
                        ref={scrollContainerRef}
                        onScroll={handleScroll}
                        className="flex-1 overflow-y-auto overflow-x-hidden custom-scrollbar"
                    >
                        <section className="relative pt-16 pb-20">
                            <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                                {/* Back button and header */}
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-8"
                                >
                                    <button
                                        onClick={() => router.push('/history')}
                                        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 transition-colors mb-4"
                                    >
                                        <ArrowLeft size={18} />
                                        <span className="text-sm font-medium">Kembali ke Histori</span>
                                    </button>

                                    {/* Query header */}
                                    <div className="bg-gradient-to-br from-zinc-50 to-white rounded-2xl border border-zinc-100 p-6">
                                        <h1 className="text-2xl font-bold text-zinc-900 mb-3">
                                            {historyData.query}
                                        </h1>
                                        <div className="flex flex-wrap items-center gap-4 text-sm text-zinc-500">
                                            <div className="flex items-center gap-1.5">
                                                <Calendar size={14} />
                                                <span>{formatDate(historyData.created_at)}</span>
                                            </div>
                                            {historyData.filters && (
                                                <div className="flex items-center gap-2">
                                                    <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-xs">
                                                        {historyData.filters.minYear} - {historyData.filters.maxYear}
                                                    </span>
                                                    <span className="px-2 py-0.5 bg-zinc-100 rounded-full text-xs capitalize">
                                                        {historyData.filters.scope === 'all' ? 'Semua' : historyData.filters.scope}
                                                    </span>
                                                </div>
                                            )}
                                            <div className="flex items-center gap-1.5">
                                                <Clock size={14} />
                                                <span>{historyData.journals.length} jurnal</span>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>

                                {/* Answer Section */}
                                {historyData.answer && (
                                    <motion.div
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                    >
                                        <AnswerSection
                                            answer={historyData.answer}
                                            journals={historyData.journals}
                                            onOpenJournalDetail={(j, tab) => {
                                                setDetailJournal(j);
                                                setDetailTab(tab || 'abstract');
                                            }}
                                        />
                                    </motion.div>
                                )}

                                {/* Journal Cards */}
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ delay: 0.2 }}
                                    className="mb-8 overflow-x-hidden"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {historyData.journals.map((journal, index) => (
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
                                </motion.div>
                            </div>
                        </section>
                    </div>
                </div>

                {/* Right Panel - Paper Detail */}
                {detailJournal && (
                    <PaperDetailPanel
                        journal={detailJournal}
                        onClose={() => setDetailJournal(null)}
                        initialTab={detailTab}
                    />
                )}
            </div>
        </DashboardLayout>
    );
}
