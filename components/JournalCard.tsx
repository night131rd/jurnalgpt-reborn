"use client";

import { motion } from "framer-motion";
import { ExternalLink, Copy, Bookmark } from "lucide-react";
import { useState } from "react";
import type { Journal } from "@/lib/types/journal";

interface JournalCardProps extends Journal {
    index: number;
}

export default function JournalCard({
    title,
    year,
    publisher,
    journalLink,
    abstract,
    authors,
    index,
}: JournalCardProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [copied, setCopied] = useState(false);
    const [isSaved, setIsSaved] = useState(false);

    const handleCopyCitation = () => {
        // Format: Author(s). (Year). Title. Publisher. Link
        const authorText = authors && authors.length > 0
            ? authors.join(", ")
            : "Unknown Author";

        const citation = `${authorText}. (${year}). ${title}. ${publisher}. ${journalLink}`;
        navigator.clipboard.writeText(citation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSave = () => {
        setIsSaved(!isSaved);
        // In a real app, this would persist to a database
    };

    const truncatedAbstract = abstract.length > 200 && !isExpanded
        ? abstract.slice(0, 200) + "..."
        : abstract;

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: index * 0.1 }}
            whileHover={{ y: -4 }}
            className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
        >
            {/* Title */}
            <h3 className="mb-3 text-lg font-semibold leading-tight text-blue-700">
                <a href={journalLink} target="_blank" rel="noopener noreferrer" className="hover:underline">
                    {title}
                </a>
            </h3>

            {/* Authors */}
            {authors && authors.length > 0 && (
                <div className="mb-3 flex flex-wrap gap-2">
                    {authors.map((author, i) => (
                        <div key={i} className="rounded border border-zinc-200 bg-zinc-50 px-2 py-1 text-xs font-medium text-zinc-600">
                            {author}
                        </div>
                    ))}
                </div>
            )}

            {/* Metadata */}
            <div className="mb-3 flex flex-wrap gap-2 text-sm text-zinc-500">
                <span>{publisher}</span>
                <span>•</span>
                <span>{year}</span>
            </div>

            {/* Abstract */}
            <p className="mb-4 text-sm leading-relaxed text-zinc-700">
                {truncatedAbstract}
            </p>

            {abstract.length > 200 && (
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="mb-4 text-sm font-medium text-blue-600 hover:text-blue-700"
                >
                    {isExpanded ? "Tampilkan lebih sedikit" : "Baca selengkapnya"}
                </button>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors ${isSaved
                        ? "border-blue-200 bg-blue-50 text-blue-700"
                        : "border-zinc-300 text-zinc-700 hover:bg-zinc-50"
                        }`}
                >
                    <Bookmark className={`h-3.5 w-3.5 ${isSaved ? "fill-current" : ""}`} />
                    {isSaved ? "Disimpan" : "Simpan"}
                </button>

                <button
                    onClick={handleCopyCitation}
                    className="flex items-center gap-1.5 rounded-lg border border-zinc-300 px-3 py-1.5 text-xs font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
                >
                    <Copy className="h-3.5 w-3.5" />
                    {copied ? "Tersalin!" : "Daftar Pustaka"}
                </button>

                <div className="flex-1"></div>

                <a
                    href={journalLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-blue-700"
                >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Buka Jurnal
                </a>
            </div>
        </motion.div>
    );
}
