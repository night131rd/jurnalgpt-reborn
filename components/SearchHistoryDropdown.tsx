"use client";

import { useState, useEffect, useRef } from "react";
import { History, Clock, X, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

interface HistoryEntry {
    id: string;
    query: string;
    filters: {
        minYear: string;
        maxYear: string;
        scope: string;
    };
    created_at: string;
}

export default function SearchHistoryDropdown() {
    const [isOpen, setIsOpen] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const router = useRouter();

    // Check auth status
    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setIsLoggedIn(!!session);
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
            setIsLoggedIn(!!session);
        });

        return () => subscription.unsubscribe();
    }, []);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Fetch history when dropdown opens
    useEffect(() => {
        if (isOpen && isLoggedIn) {
            fetchHistory();
        }
    }, [isOpen, isLoggedIn]);

    const fetchHistory = async () => {
        setIsLoading(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch('/api/history?limit=5', {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                const data = await response.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleHistoryClick = (entry: HistoryEntry) => {
        // Navigate to history detail page with cached result
        router.push(`/history/${entry.id}`);
        setIsOpen(false);
    };

    const handleDeleteHistory = async (e: React.MouseEvent, historyId: string) => {
        e.stopPropagation();
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const response = await fetch(`/api/history?id=${historyId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            if (response.ok) {
                setHistory(prev => prev.filter(h => h.id !== historyId));
            }
        } catch (error) {
            console.error('Failed to delete history:', error);
        }
    };

    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Baru saja';
        if (diffMins < 60) return `${diffMins} menit lalu`;
        if (diffHours < 24) return `${diffHours} jam lalu`;
        if (diffDays < 7) return `${diffDays} hari lalu`;
        return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    };

    if (!isLoggedIn) {
        return null;
    }

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200",
                    isOpen
                        ? "bg-blue-50 text-blue-700"
                        : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-50"
                )}
            >
                <History size={18} />
                <span className="hidden sm:inline">Histori</span>
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 8, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.96 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full mt-2 w-80 bg-white rounded-xl shadow-xl border border-zinc-100 overflow-hidden z-50"
                    >
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-zinc-100 flex items-center justify-between">
                            <h3 className="font-semibold text-zinc-900">Histori Pencarian</h3>
                            <button
                                onClick={() => router.push('/history')}
                                className="text-xs text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                Lihat Semua <ChevronRight size={14} />
                            </button>
                        </div>

                        {/* Content */}
                        <div className="max-h-80 overflow-y-auto">
                            {isLoading ? (
                                <div className="px-4 py-8 text-center text-zinc-400">
                                    <div className="animate-spin w-5 h-5 border-2 border-zinc-300 border-t-blue-600 rounded-full mx-auto mb-2" />
                                    Memuat...
                                </div>
                            ) : history.length === 0 ? (
                                <div className="px-4 py-8 text-center text-zinc-400">
                                    <History size={24} className="mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Belum ada histori pencarian</p>
                                </div>
                            ) : (
                                <div className="py-1">
                                    {history.map((entry) => (
                                        <div
                                            key={entry.id}
                                            onClick={() => handleHistoryClick(entry)}
                                            className="group px-4 py-3 hover:bg-zinc-50 cursor-pointer transition-colors flex items-center gap-3"
                                        >
                                            <Clock size={16} className="text-zinc-400 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-zinc-900 truncate">
                                                    {entry.query}
                                                </p>
                                                <p className="text-xs text-zinc-400">
                                                    {formatTime(entry.created_at)}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => handleDeleteHistory(e, entry.id)}
                                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-200 rounded transition-all"
                                                title="Hapus"
                                            >
                                                <X size={14} className="text-zinc-500" />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
