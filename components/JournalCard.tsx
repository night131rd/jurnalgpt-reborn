"use client";

import { motion } from "framer-motion";
import { ExternalLink, Bookmark, BookOpen } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import type { Journal } from "@/lib/types/journal";
import { supabase } from "@/lib/supabase";

interface JournalCardProps extends Journal {
    index: number;
    isActive?: boolean;
    onOpenJournalDetail?: (journal: Journal) => void;
    initialSaved?: boolean;
}

export default function JournalCard(props: JournalCardProps) {
    const {
        title,
        year,
        publisher,
        abstract,
        authors,
        citationCount,
        index,
        isActive,
        onOpenJournalDetail,
        initialSaved = false,
    } = props;

    const [isSaved, setIsSaved] = useState(initialSaved);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoggedIn, setIsLoggedIn] = useState(false);

    // Check login status on mount
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

    // Truncate abstract for compact multi-column view
    const truncatedAbstract = abstract.length > 110
        ? abstract.slice(0, 110) + "..."
        : abstract;

    // Format authors according to rules
    const formatAuthors = (auths?: string[]) => {
        if (!auths || auths.length === 0) return "Unknown Author";
        if (auths.length === 1) return auths[0];
        if (auths.length === 2) return `${auths[0]} and ${auths[1]}`;
        return `${auths[0]} et al.`;
    };

    const handleSaveClick = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card click

        if (!isLoggedIn) {
            // Redirect to login
            window.location.href = '/login?redirect=' + encodeURIComponent(window.location.pathname);
            return;
        }

        setIsSaving(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            if (isSaved) {
                // Remove from saved
                const response = await fetch(`/api/saved-journals?title=${encodeURIComponent(title)}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${session.access_token}`
                    }
                });
                if (response.ok) {
                    setIsSaved(false);
                }
            } else {
                // Save journal
                const response = await fetch('/api/saved-journals', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify(props as Journal)
                });
                if (response.ok) {
                    setIsSaved(true);
                } else if (response.status === 409) {
                    // Already saved
                    setIsSaved(true);
                }
            }
        } catch (error) {
            console.error('Failed to toggle save:', error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.05 }}
            whileHover={{ y: -2 }}
            onClick={() => onOpenJournalDetail?.(props as Journal)}
            className={cn(
                "group relative flex flex-col h-full rounded-2xl border p-5 transition-all duration-300 cursor-pointer",
                isActive
                    ? "bg-blue-50/40 border-blue-200 shadow-sm ring-1 ring-blue-100/50"
                    : "bg-white border-zinc-100 hover:border-zinc-200 hover:shadow-md shadow-sm"
            )}
        >
            {/* Title */}
            <h3 className={cn(
                "text-[15px] font-bold leading-snug mb-2 tracking-tight transition-colors line-clamp-2",
                isActive ? "text-blue-900" : "text-zinc-900 group-hover:text-blue-700"
            )}>
                {title}
            </h3>

            {/* Abstract */}
            <p className="text-[13px] text-zinc-500 leading-relaxed mb-6 line-clamp-3 h-[58px]">
                {truncatedAbstract}
            </p>

            {/* Metadata Row (matches image) */}
            <div className="flex items-center gap-2 text-[12px] text-zinc-500 font-medium whitespace-nowrap overflow-hidden">
                <span className="text-zinc-900 font-bold shrink-0">{year}</span>
                <span className="text-zinc-300">•</span>
                <span className="shrink-0">{citationCount || 0} citations</span>
                <span className="text-zinc-300">•</span>
                <span className="truncate">{formatAuthors(authors)}</span>
            </div>

            <div className="mt-4 pt-4 border-t border-zinc-50 flex items-center justify-between gap-3">
                {/* Publisher Section */}
                <div className="flex items-center gap-2 min-w-0 pr-4">
                    <BookOpen size={14} className="text-zinc-400 shrink-0" />
                    <span className="text-[11.5px] text-zinc-500 italic truncate tracking-tight">
                        {publisher || props.source || "Journal"}
                    </span>
                </div>

                {/* Buka Button */}
                <div className="flex items-center gap-1.5 bg-zinc-900 group-hover:bg-blue-600 transition-colors text-white text-[11px] font-bold px-3 py-1.5 rounded-lg shrink-0 shadow-sm">
                    <span>Buka</span>
                    <ExternalLink size={12} />
                </div>
            </div>

            {/* Bookmark action - always visible when saved, hover when not */}
            <button
                onClick={handleSaveClick}
                disabled={isSaving}
                className={cn(
                    "absolute top-4 right-4 p-1.5 rounded-full transition-all duration-200",
                    isSaved
                        ? "opacity-100 bg-blue-50"
                        : "opacity-0 group-hover:opacity-100 hover:bg-zinc-50",
                    isSaving && "cursor-wait opacity-50"
                )}
                title={isSaved ? "Hapus dari tersimpan" : "Simpan jurnal"}
            >
                <Bookmark
                    size={16}
                    className={cn(
                        "transition-colors",
                        isSaved
                            ? "text-blue-600 fill-blue-600"
                            : "text-zinc-400 hover:text-blue-600"
                    )}
                />
            </button>
        </motion.div>
    );
}

