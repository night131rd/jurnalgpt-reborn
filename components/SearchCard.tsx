"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Calendar, ArrowRight, Globe, ListFilter, Zap } from "lucide-react";
import { getGoogleSuggestions } from "@/lib/services/googleSuggestions";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface SearchCardProps {
    onSearch: (query: string, minYear: string, maxYear: string, scope: 'all' | 'national' | 'international') => void;
    initialQuery?: string;
    initialMinYear?: string;
    initialMaxYear?: string;
    initialScope?: 'all' | 'national' | 'international';
    refreshTrigger?: number;
}

export default function SearchCard({
    onSearch,
    initialQuery = "",
    initialMinYear = "2020",
    initialMaxYear = "2025",
    initialScope = 'all',
    refreshTrigger = 0
}: SearchCardProps) {
    const [query, setQuery] = useState(initialQuery);
    const [minYear, setMinYear] = useState(initialMinYear);
    const [maxYear, setMaxYear] = useState(initialMaxYear);
    const [scope, setScope] = useState<'all' | 'national' | 'international'>(initialScope);

    // Update internal state if props change (important for back/forward navigation)
    useEffect(() => {
        if (initialQuery !== undefined) setQuery(initialQuery);
        if (initialMinYear !== undefined) setMinYear(initialMinYear);
        if (initialMaxYear !== undefined) setMaxYear(initialMaxYear);
        if (initialScope !== undefined) setScope(initialScope);
    }, [initialQuery, initialMinYear, initialMaxYear, initialScope]);

    const [isFocused, setIsFocused] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [quota, setQuota] = useState<number | null>(null);
    const [isGuest, setIsGuest] = useState(false);

    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const fetchQuota = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
            const { data } = await supabase
                .from('profiles')
                .select('role, sisa_quota')
                .eq('id', currentUser.id)
                .single();

            if (data) {
                setIsPremium(data.role === 'premium');
                setQuota(data.sisa_quota);
                setIsGuest(false);
            }
        } else {
            const cookies = document.cookie.split('; ');
            const guestQuotaCookie = cookies.find(row => row.startsWith('guest_quota='));
            setIsPremium(false);
            setQuota(guestQuotaCookie ? parseInt(guestQuotaCookie.split('=')[1]) : 3);
            setIsGuest(true);
        }
    };

    useEffect(() => {
        fetchQuota();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
            fetchQuota();
        });

        return () => subscription.unsubscribe();
    }, []);

    // Refresh when trigger changes
    useEffect(() => {
        if (refreshTrigger > 0) {
            fetchQuota();
        }
    }, [refreshTrigger]);

    // Fetch dynamic suggestions with debounce
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim()) {
                const fetchedSuggestions = await getGoogleSuggestions(query);
                setSuggestions(fetchedSuggestions);
            } else {
                setSuggestions([]);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [query]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
        }
    }, [query]);

    const handleSearch = (e?: React.FormEvent) => {
        e?.preventDefault();
        if (query.trim()) {
            onSearch(query, minYear, maxYear, scope);
            setShowSuggestions(false);
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setQuery(suggestion);
        onSearch(suggestion, minYear, maxYear, scope);
        setShowSuggestions(false);
    };

    return (
        <div className="w-full max-w-4xl relative">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className={cn(
                    "relative overflow-hidden rounded-3xl bg-white shadow-xl transition-all duration-300 ring-1",
                    isFocused ? "ring-blue-500/30 shadow-2xl" : "ring-black/5 shadow-lg"
                )}
            >
                <form onSubmit={handleSearch} className="p-2">
                    {/* Input Area */}
                    <div className="px-4 pt-4 pb-2">
                        <textarea
                            ref={textareaRef}
                            value={query}
                            onChange={(e) => {
                                setQuery(e.target.value);
                                setShowSuggestions(true);
                            }}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => {
                                // Delay to allow suggestion click
                                setTimeout(() => setIsFocused(false), 200);
                            }}
                            placeholder="Apa yang ingin kamu cari hari ini?"
                            className="w-full resize-none border-0 bg-transparent p-0 text-lg text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-0 min-h-[44px]"
                            rows={1}
                        />
                    </div>

                    {/* Internal Toolbar */}
                    <div className="mt-2 flex items-center justify-between border-t border-zinc-100 px-2 py-2">
                        <div className="flex items-center gap-2">
                            {/* Scope Selector Pill */}
                            <div className="flex items-center gap-1 rounded-full bg-zinc-100 p-1">
                                <button
                                    type="button"
                                    onClick={() => setScope('all')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                                        scope === 'all' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                                    )}
                                >
                                    <Search className="h-3 w-3" />
                                    <span>Semua</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScope('national')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                                        scope === 'national' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                                    )}
                                >
                                    <ListFilter className="h-3 w-3" />
                                    <span>Nasional</span>
                                </button>
                                <button
                                    type="button"
                                    onClick={() => setScope('international')}
                                    className={cn(
                                        "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-all",
                                        scope === 'international' ? "bg-white text-blue-600 shadow-sm" : "text-zinc-500 hover:text-zinc-800"
                                    )}
                                >
                                    <Globe className="h-3 w-3" />
                                    <span>Internasional</span>
                                </button>
                            </div>

                            {/* Year Filter integrated directly into toolbar */}
                            <div className="flex items-center gap-1.5 rounded-full bg-zinc-100 px-4 py-2.5 text-xs font-medium text-zinc-500">
                                <Calendar className="h-3.5 w-3.5" />
                                <div className="flex items-center gap-1">
                                    <input
                                        type="number"
                                        value={minYear}
                                        onChange={(e) => setMinYear(e.target.value)}
                                        className="w-12 bg-transparent text-center focus:outline-none focus:text-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <span className="text-zinc-300">-</span>
                                    <input
                                        type="number"
                                        value={maxYear}
                                        onChange={(e) => setMaxYear(e.target.value)}
                                        className="w-12 bg-transparent text-center focus:outline-none focus:text-blue-600 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Search Button */}
                        <div className="flex items-center">
                            <button
                                type="submit"
                                className={cn(
                                    "flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-95",
                                    query.trim() && (quota === null || quota > 0) ? "bg-blue-600 text-white shadow-md hover:bg-blue-700" : "bg-zinc-100 text-zinc-400 cursor-not-allowed"
                                )}
                                disabled={!query.trim() || (quota !== null && quota <= 0)}
                            >
                                <ArrowRight className="h-5 w-5" />
                            </button>
                        </div>
                    </div>

                    {/* Autocompletion Suggestions inside the card */}
                    <AnimatePresence>
                        {showSuggestions && suggestions.length > 0 && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden border-t border-zinc-100"
                            >
                                <div className="p-2 space-y-0.5">
                                    {suggestions.map((s, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => handleSuggestionClick(s)}
                                            className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm text-zinc-600 transition-colors hover:bg-zinc-50 hover:text-black"
                                        >
                                            <Search className="h-3.5 w-3.5 text-zinc-400" />
                                            <span>{s}</span>
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </form>
            </motion.div>

            {/* Quota Info for Free/Guest Users */}
            <AnimatePresence>
                {!isPremium && quota !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="mt-4 flex justify-center"
                    >
                        <div className="flex items-center gap-2 rounded-full bg-zinc-100/50 border border-zinc-200/50 px-4 py-1.5 backdrop-blur-sm">
                            <Zap className={cn(
                                "h-3.5 w-3.5",
                                quota > 0 ? "text-amber-500 fill-amber-500" : "text-red-500 fill-red-500"
                            )} />
                            <span className="text-xs font-medium text-zinc-500">
                                {quota > 0
                                    ? `Sisa kuota pencarian kamu hari ini: ${quota}`
                                    : isGuest
                                        ? "Kuota tamu kamu sudah habis. Silakan masuk untuk lanjut!"
                                        : "Kuota harian kamu sudah habis. Tunggu besok atau upgrade premium!"
                                }
                            </span>
                            {(quota <= 2 || isGuest) && (
                                <Link
                                    href={isGuest ? "/login" : "/pricing"}
                                    className="ml-2 text-xs font-bold text-blue-600 hover:text-blue-700 underline underline-offset-2"
                                >
                                    {isGuest ? "Masuk Sekarang" : "Upgrade Premium"}
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

