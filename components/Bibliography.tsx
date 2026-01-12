"use client";

import { motion } from "framer-motion";
import { BookOpen, Copy } from "lucide-react";
import { useState } from "react";
import type { Journal } from "@/lib/dummyData";

interface BibliographyProps {
    journals: Journal[];
}

export default function Bibliography({ journals }: BibliographyProps) {
    const [copied, setCopied] = useState(false);

    const generateAPACitation = (journal: Journal, index: number) => {
        return `[${index + 1}] ${journal.title}. (${journal.year}). ${journal.publisher}. ${journal.pdfLink || journal.journalLink}`;
    };

    const handleCopyAll = () => {
        const allCitations = journals
            .map((journal, index) => generateAPACitation(journal, index))
            .join("\n\n");
        navigator.clipboard.writeText(allCitations);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-8"
        >
            {/* Header */}
            <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <h2 className="text-lg font-semibold text-zinc-900">Daftar Pustaka</h2>
                </div>
                <button
                    onClick={handleCopyAll}
                    className="flex items-center gap-2 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                    <Copy className="h-4 w-4" />
                    {copied ? "Tersalin!" : "Salin Semua"}
                </button>
            </div>

            {/* Bibliography List */}
            <div className="space-y-3 rounded-xl border border-zinc-200 bg-zinc-50/50 p-6">
                {journals.map((journal, index) => (
                    <div
                        key={index}
                        className="text-sm leading-relaxed text-zinc-700"
                    >
                        {generateAPACitation(journal, index)}
                    </div>
                ))}
            </div>

            {/* Format Note */}
            <p className="mt-3 text-xs text-zinc-500">
                Format: APA Style (American Psychological Association)
            </p>
        </motion.div>
    );
}
