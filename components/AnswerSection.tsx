"use client";

import { motion, AnimatePresence } from "framer-motion";
import {
    Sparkles,
    ExternalLink,
    BookOpen,
    FileDown,
    Bookmark,
    Quote,
    Link2,
    CheckSquare,
    Info,
    ChevronRight,
    CircleHelp,
    X,
    Layout,
    FileText,
    Zap
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import type { Journal } from "@/lib/types/journal";
import { useState, useEffect } from "react";

interface AnswerSectionProps {
    answer: string;
    journals: Journal[];
    onOpenJournalDetail: (journal: Journal, tab?: 'abstract' | 'pdf') => void;
}

export default function AnswerSection({ answer, journals, onOpenJournalDetail }: AnswerSectionProps) {
    // Force numeric citations to look like links so we can match them in components
    const processedAnswer = answer.replace(/\[(\d+)\]/g, "[$1](#cite-$1)");

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-bold text-zinc-900 font-sans tracking-tight">Jawaban</h2>
                </div>
                <button className="flex items-center gap-1.5 text-zinc-400 hover:text-zinc-600 transition-colors">
                    <CircleHelp size={16} />
                    <span className="text-xs font-medium">How it works</span>
                </button>
            </div>

            {/* Answer Card */}
            <div className="relative min-h-[200px] rounded-3xl bg-white p-6 md:p-8 shadow-sm border border-zinc-100 ring-1 ring-black/5">
                {/* Decorative background container */}
                <div className="absolute inset-0 overflow-hidden rounded-3xl pointer-events-none">
                    <div className="absolute right-0 top-0 h-80 w-80 -translate-y-24 translate-x-24 rounded-full bg-gradient-to-br from-blue-400/5 via-purple-400/5 to-transparent blur-3xl opacity-60" />
                </div>

                <div className="relative text-[16px] leading-[1.8] text-zinc-800 prose prose-zinc max-w-none font-sans subpixel-antialiased">
                    {answer ? (
                        <>
                            <ReactMarkdown
                                components={{
                                    a: ({ href, children }) => {
                                        if (href?.startsWith("#cite-")) {
                                            const id = href.replace("#cite-", "");
                                            const journalIndex = parseInt(id) - 1;
                                            const journal = journals[journalIndex];

                                            if (!journal) return <span className="text-blue-600 font-bold mx-0.5 pointer-events-none">[{id}]</span>;

                                            return <CitationBadge id={id} journal={journal} onOpenDetail={(tab) => onOpenJournalDetail(journal, tab)} />;
                                        }
                                        return <a href={href} target="_blank" className="text-blue-600 no-underline hover:underline font-medium">{children}</a>;
                                    }
                                }}
                            >
                                {processedAnswer}
                            </ReactMarkdown>
                            <motion.span
                                animate={{ opacity: [0, 1, 0] }}
                                transition={{ duration: 1, repeat: Infinity }}
                                className="inline-block w-1.5 h-5 bg-blue-600 ml-1 translate-y-1 rounded-full shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                            >
                                ▍
                            </motion.span>
                        </>
                    ) : (
                        <div className="flex flex-col gap-5 animate-pulse">
                            <div className="flex items-center gap-2 text-blue-600 font-medium tracking-tight">
                                <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                                >
                                    <Sparkles className="h-4 w-4" />
                                </motion.div>
                                <span className="text-sm font-semibold">Menghimpun referensi dan menyusun jawaban...</span>
                            </div>
                            <div className="space-y-3">
                                <div className="h-4 w-3/4 rounded-full bg-zinc-100"></div>
                                <div className="h-4 w-full rounded-full bg-zinc-100"></div>
                                <div className="h-4 w-5/6 rounded-full bg-zinc-100"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    );
}

function CitationBadge({ id, journal, onOpenDetail }: { id: string; journal: Journal; onOpenDetail: (tab?: 'abstract' | 'pdf') => void }) {
    const [isHovered, setIsHovered] = useState(false);

    return (
        <span
            className="relative inline-block mx-1 leading-none align-baseline group"
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            <button className="inline-flex items-center justify-center w-5 h-5 text-[11px] font-bold text-blue-600 bg-blue-50/80 rounded-md transition-all group-hover:bg-blue-600 group-hover:text-white border border-blue-100 group-hover:border-blue-600 shadow-sm align-middle mb-1">
                {id}
            </button>

            <AnimatePresence>
                {isHovered && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: -5 }}
                        animate={{ opacity: 1, scale: 1, y: -10 }}
                        exit={{ opacity: 0, scale: 0.96, y: -5 }}
                        transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
                        className="absolute z-[100] bottom-1.5 left-1/2 -translate-x-1/2 mb-2 w-[340px] bg-white rounded-2xl shadow-2xl border border-zinc-200 p-4 pointer-events-auto cursor-default overflow-hidden"
                    >
                        <div className="flex flex-col">
                            {/* Header Section */}
                            <div className="flex items-start gap-3">
                                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-zinc-100 flex items-center justify-center text-[11px] font-bold text-zinc-600 mt-0.5">
                                    {id}
                                </div>
                                <h4 className="text-[14px] font-bold text-zinc-900 leading-snug tracking-tight">
                                    {journal.title}
                                </h4>
                            </div>

                            {/* Meta Info */}
                            <div className="flex items-center gap-2 mt-4 text-[11px] text-zinc-500 font-medium">
                                <span className="text-zinc-900 font-bold">{journal.year}</span>
                                <span className="text-zinc-200">•</span>
                                <span>{journal.citationCount || 0} citations</span>
                                <span className="text-zinc-200">•</span>
                                <span className="truncate">{journal.authors?.[0] || 'Unknown Author'}</span>
                            </div>

                            <div className="flex items-center gap-3 mt-1.5 text-[11px] text-zinc-500">
                                <div className="flex items-center gap-1.5 truncate">
                                    <BookOpen size={12} className="text-zinc-500" />
                                    <span className="italic truncate">{journal.publisher || journal.source}</span>
                                </div>
                            </div>

                            {/* Divider */}
                            <div className="h-px bg-zinc-100 w-full mt-4 mb-4" />

                            {/* Actions Row */}
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        onOpenDetail();
                                    }}
                                    className="flex items-center gap-1.5 bg-blue-600 hover:bg-blue-500 transition-colors text-white text-[11px] font-bold px-3.5 py-2.5 rounded-xl shadow-lg shadow-blue-900/20"
                                >
                                    <Info size={14} strokeWidth={2.5} />
                                    <span>Details</span>
                                </button>

                                {journal.journalLink && journal.journalLink !== "#" && (
                                    <button
                                        onClick={(e) => {
                                            e.preventDefault();
                                            onOpenDetail('pdf');
                                        }}
                                        className="flex items-center gap-2 border border-zinc-200 hover:bg-zinc-50 transition-colors text-zinc-700 text-[11px] font-bold px-3.5 py-2.5 rounded-xl"
                                    >
                                        <FileDown size={14} strokeWidth={2.5} />
                                        <span>PDF</span>
                                        <ChevronRight size={10} />
                                    </button>
                                )}

                                <div className="flex items-center gap-4 ml-auto text-zinc-400 pr-1">
                                    <Bookmark size={16} className="hover:text-zinc-900 transition-colors cursor-pointer" />                               </div>
                            </div>
                        </div>

                        {/* Arrow */}
                        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-0.5 border-[6px] border-transparent border-t-white shadow-sm" />
                    </motion.div>
                )}
            </AnimatePresence>
        </span>
    );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 pb-3 pt-5 transition-none relative
                ${active ? 'text-zinc-900 border-b-2 border-blue-600' : 'text-zinc-500 hover:text-zinc-800'}
            `}
        >
            {icon}
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </button>
    );
}
