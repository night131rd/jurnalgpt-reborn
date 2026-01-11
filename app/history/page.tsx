"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardLayout from "@/components/DashboardLayout";
import { History, Bookmark, Clock, Trash2, ExternalLink, Search, BookOpen } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import DashboardNavbar from "@/components/DashboardNavbar";
import type { Journal } from "@/lib/types/journal";

interface HistoryEntry {
    id: string;
    query: string;
    payload: any[];
    created_at: string;
}

interface SavedJournal extends Journal {
    id: string;
    saved_at: string;
}

export default function HistoryPage() {
    const [activeTab, setActiveTab] = useState<'history' | 'saved'>('history');
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [savedJournals, setSavedJournals] = useState<SavedJournal[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const router = useRouter();

    useEffect(() => {
        checkAuthAndFetch();
    }, []);

    const checkAuthAndFetch = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            router.push('/login?redirect=/history');
            return;
        }
        setIsLoggedIn(true);
        fetchData(session.access_token);
    };

    const fetchData = async (token: string) => {
        setIsLoading(true);
        try {
            const [historyRes, savedRes] = await Promise.all([
                fetch('/api/history', {
                    headers: { 'Authorization': `Bearer ${token}` }
                }),
                fetch('/api/saved-journals', {
                    headers: { 'Authorization': `Bearer ${token}` }
                })
            ]);

            if (historyRes.ok) {
                const data = await historyRes.json();
                setHistory(data.history || []);
            }

            if (savedRes.ok) {
                const data = await savedRes.json();
                setSavedJournals(data.journals || []);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteHistory = async (historyId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/history?id=${historyId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                setHistory(prev => prev.filter(h => h.id !== historyId));
            }
        } catch (error) {
            console.error('Failed to delete history:', error);
        }
    };

    const handleClearAllHistory = async () => {
        if (!confirm('Hapus semua histori pencarian?')) return;

        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/history?all=true', {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                setHistory([]);
            }
        } catch (error) {
            console.error('Failed to clear history:', error);
        }
    };

    const handleRemoveSavedJournal = async (journalId: string) => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/saved-journals?id=${journalId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${session.access_token}` }
            });

            if (response.ok) {
                setSavedJournals(prev => prev.filter(j => j.id !== journalId));
            }
        } catch (error) {
            console.error('Failed to remove journal:', error);
        }
    };

    const handleHistoryClick = (entry: HistoryEntry) => {
        // Navigate to history detail page with cached result
        router.push(`/history/${entry.id}`);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    if (!isLoggedIn) {
        return (
            <DashboardLayout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin w-8 h-8 border-4 border-zinc-200 border-t-blue-600 rounded-full" />
                </div>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <DashboardNavbar />
            <div className="flex-1 overflow-y-auto h-full custom-scrollbar">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-zinc-900 mb-2 tracking-tight">Histori & Koleksi</h1>
                        <p className="text-zinc-500">Kelola histori pencarian dan jurnal yang tersimpan</p>
                    </div>

                    {/* Tabs */}
                    <div className="flex gap-2 mb-8 border-b border-zinc-100 pb-4">
                        <button
                            onClick={() => setActiveTab('history')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                                activeTab === 'history'
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            <History size={18} />
                            Histori Pencarian
                            <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full">{history.length}</span>
                        </button>
                        <button
                            onClick={() => setActiveTab('saved')}
                            className={cn(
                                "flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all",
                                activeTab === 'saved'
                                    ? "bg-blue-50 text-blue-700"
                                    : "text-zinc-600 hover:bg-zinc-50"
                            )}
                        >
                            <Bookmark size={18} />
                            Jurnal Tersimpan
                            <span className="text-xs bg-zinc-100 px-2 py-0.5 rounded-full">{savedJournals.length}</span>
                        </button>
                    </div>

                    {/* Content */}
                    <AnimatePresence mode="wait">
                        {isLoading ? (
                            <motion.div
                                key="loading"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="flex items-center justify-center py-16"
                            >
                                <div className="animate-spin w-8 h-8 border-4 border-zinc-200 border-t-blue-600 rounded-full" />
                            </motion.div>
                        ) : activeTab === 'history' ? (
                            <motion.div
                                key="history"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {history.length === 0 ? (
                                    <div className="text-center py-16 text-zinc-400">
                                        <History size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-medium">Belum ada histori pencarian</p>
                                        <p className="text-sm mt-1">Mulai pencarian untuk melihat histori di sini</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex justify-end mb-4">
                                            <button
                                                onClick={handleClearAllHistory}
                                                className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1"
                                            >
                                                <Trash2 size={14} />
                                                Hapus Semua
                                            </button>
                                        </div>
                                        <div className="space-y-2">
                                            {history.map((entry, index) => (
                                                <motion.div
                                                    key={entry.id}
                                                    initial={{ opacity: 0, y: 10 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    onClick={() => handleHistoryClick(entry)}
                                                    className="group flex items-center gap-4 p-4 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm cursor-pointer transition-all"
                                                >
                                                    <div className="w-10 h-10 rounded-lg bg-zinc-50 flex items-center justify-center shrink-0">
                                                        <Search size={18} className="text-zinc-400" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="font-medium text-zinc-900 truncate">{entry.query}</p>
                                                        <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                                                            <Clock size={12} />
                                                            {formatDate(entry.created_at)}
                                                            {entry.payload && entry.payload[0]?.filters && (
                                                                <>
                                                                    <span>•</span>
                                                                    <span>{entry.payload[0].filters.minYear}-{entry.payload[0].filters.maxYear}</span>
                                                                </>
                                                            )}
                                                        </div>
                                                    </div>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteHistory(entry.id);
                                                        }}
                                                        className="opacity-0 group-hover:opacity-100 p-2 hover:bg-red-50 rounded-lg transition-all"
                                                        title="Hapus"
                                                    >
                                                        <Trash2 size={16} className="text-red-400" />
                                                    </button>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="saved"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                            >
                                {savedJournals.length === 0 ? (
                                    <div className="text-center py-16 text-zinc-400">
                                        <Bookmark size={48} className="mx-auto mb-4 opacity-30" />
                                        <p className="text-lg font-medium">Belum ada jurnal tersimpan</p>
                                        <p className="text-sm mt-1">Klik ikon bookmark pada jurnal untuk menyimpannya</p>
                                    </div>
                                ) : (
                                    <div className="grid gap-4 md:grid-cols-2">
                                        {savedJournals.map((journal, index) => (
                                            <motion.div
                                                key={journal.id}
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.05 }}
                                                className="group relative flex flex-col p-5 bg-white rounded-xl border border-zinc-100 hover:border-zinc-200 hover:shadow-sm transition-all"
                                            >
                                                <h3 className="text-[15px] font-bold text-zinc-900 mb-2 line-clamp-2 pr-8">
                                                    {journal.title}
                                                </h3>
                                                <p className="text-[13px] text-zinc-500 line-clamp-2 mb-4">
                                                    {journal.abstract}
                                                </p>
                                                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-auto">
                                                    <span className="font-bold text-zinc-700">{journal.year}</span>
                                                    <span>•</span>
                                                    <span>{journal.citationCount || 0} citations</span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-50">
                                                    <BookOpen size={14} className="text-zinc-400" />
                                                    <span className="text-[11px] text-zinc-500 italic truncate">
                                                        {journal.publisher || journal.source || 'Journal'}
                                                    </span>
                                                </div>

                                                {/* Actions */}
                                                <div className="absolute top-4 right-4 flex items-center gap-1">
                                                    {journal.journalLink && (
                                                        <a
                                                            href={journal.journalLink}
                                                            target="_blank"
                                                            rel="noopener noreferrer"
                                                            onClick={(e) => e.stopPropagation()}
                                                            className="p-1.5 hover:bg-zinc-50 rounded-full transition-colors"
                                                            title="Buka jurnal"
                                                        >
                                                            <ExternalLink size={14} className="text-zinc-400" />
                                                        </a>
                                                    )}
                                                    <button
                                                        onClick={() => handleRemoveSavedJournal(journal.id)}
                                                        className="p-1.5 hover:bg-red-50 rounded-full transition-colors"
                                                        title="Hapus dari tersimpan"
                                                    >
                                                        <Trash2 size={14} className="text-red-400" />
                                                    </button>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </DashboardLayout>
    );
}
