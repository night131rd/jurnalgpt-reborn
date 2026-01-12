"use client";

import { useState, useEffect } from "react";
import {
    ExternalLink,
    BookOpen,
    FileDown,
    Bookmark,
    Quote,
    Link2,
    X,
    Layout,
    FileText,
    Zap,
    Info,
    Copy,
    Check
} from "lucide-react";
import type { Journal } from "@/lib/types/journal";

interface PaperDetailPanelProps {
    journal: Journal;
    onClose: () => void;
    initialTab?: 'abstract' | 'pdf';
}

export default function PaperDetailPanel({ journal, onClose, initialTab = 'abstract' }: PaperDetailPanelProps) {
    const [activeTab, setActiveTab] = useState<'abstract' | 'pdf'>(initialTab);
    const [width, setWidth] = useState(740);
    const [copied, setCopied] = useState(false);

    const handleCopyCitation = () => {
        const authorText = journal.authors && journal.authors.length > 0
            ? journal.authors.join(", ")
            : "Unknown Author";

        const citation = `${authorText}. (${journal.year}). ${journal.title}. ${journal.publisher || journal.source}. ${journal.pdfLink || journal.journalLink || ""}`;
        navigator.clipboard.writeText(citation);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    useEffect(() => {
        // Update active tab if initialTab changes while panel is open
        setActiveTab(initialTab);
    }, [initialTab, journal.title]); // Added journal.title to ensure it resets when switching papers

    useEffect(() => {
        const initialWidth = Math.min(window.innerWidth * 0.45, 800);
        setWidth(initialWidth);
    }, []);

    return (
        <div
            className="h-full sticky top-0 flex flex-col bg-white border-l border-zinc-200 shadow-2xl overflow-hidden z-[100] text-zinc-900 font-sans"
            style={{ width: width }}
        >
            {/* Split Resize Handle */}
            <div
                className="absolute left-0 top-0 bottom-0 w-3 cursor-col-resize group z-[210] flex items-center justify-center -ml-1.5"
                onMouseDown={(e) => {
                    e.preventDefault();
                    const overlay = document.createElement('div');
                    overlay.style.position = 'fixed';
                    overlay.style.inset = '0';
                    overlay.style.zIndex = '9999';
                    overlay.style.cursor = 'col-resize';
                    document.body.appendChild(overlay);

                    const handleMouseMove = (moveEvent: MouseEvent) => {
                        const newWidth = Math.max(300, Math.min(window.innerWidth - 300, window.innerWidth - moveEvent.clientX));
                        setWidth(newWidth);
                    };

                    const handleMouseUp = () => {
                        document.removeEventListener('mousemove', handleMouseMove);
                        document.removeEventListener('mouseup', handleMouseUp);
                        document.body.removeChild(overlay);
                    };

                    document.addEventListener('mousemove', handleMouseMove);
                    document.addEventListener('mouseup', handleMouseUp);
                }}
            >
                <div className="w-[1px] h-full bg-border group-hover:bg-blue-500 transition-colors" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="text-[17px] font-bold text-zinc-900 tracking-tight">Paper</h3>
                <button
                    onClick={onClose}
                    className="p-1 hover:bg-zinc-100 rounded-md text-zinc-400 hover:text-zinc-600 transition-colors"
                >
                    <X size={22} />
                </button>
            </div>

            {/* Tabs Layout */}
            <div className="flex items-center gap-6 px-6 border-b border-zinc-100 bg-zinc-50/50">
                <TabButton
                    active={activeTab === 'abstract'}
                    icon={<Layout size={18} />}
                    label="Abstract"
                    onClick={() => setActiveTab('abstract')}
                />
                <TabButton
                    active={activeTab === 'pdf'}
                    icon={<FileText size={18} />}
                    label="PDF"
                    onClick={() => setActiveTab('pdf')}
                />
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto custom-scrollbar bg-white relative">
                {activeTab === 'abstract' && (
                    <div className="p-8 space-y-6">
                        {/* Paper Title */}
                        <h1 className="text-[22px] font-bold text-zinc-900 leading-tight">
                            {journal.title}
                        </h1>

                        {/* Metadata Row */}
                        <div className="flex items-center gap-2 text-sm font-medium text-zinc-500">
                            <span className="text-zinc-600">{journal.year}</span>
                            <span>•</span>
                            <span>{journal.citationCount || 0} citations</span>
                            <span>•</span>
                            <span className="truncate">{journal.authors?.[0] || 'Unknown Author'}</span>
                        </div>

                        {/* Source Row */}
                        <div className="flex items-center gap-3 text-xs text-zinc-400">
                            <div className="flex items-center gap-1.5">
                                <BookOpen size={14} className="text-zinc-400" />
                                <span className="italic">{journal.publisher || journal.source}</span>
                            </div>
                            {journal.doi && (
                                <>
                                    <span>•</span>
                                    <a href={`https://doi.org/${journal.doi}`} target="_blank" className="flex items-center gap-1 hover:text-blue-600 transition-colors">
                                        <span>DOI</span>
                                        <ExternalLink size={10} />
                                    </a>
                                </>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="h-px bg-zinc-100 w-full" />

                        {/* Abstract Body */}
                        <div className="space-y-6 text-zinc-700 leading-[1.75] text-[15.5px] font-sans antialiased">
                            <p>{journal.abstract}</p>

                            {/* Daftar Pustaka Section */}
                            <div className="mt-10 p-5 rounded-2xl bg-zinc-50 border border-zinc-100 flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <h4 className="text-[13px] font-bold text-zinc-900 uppercase tracking-wider">Daftar Pustaka</h4>
                                    <button
                                        onClick={handleCopyCitation}
                                        className="p-2 hover:bg-white rounded-lg transition-all border border-transparent hover:border-zinc-200 text-zinc-400 hover:text-blue-600 shadow-sm hover:shadow-md"
                                        title="Salin Sitasi"
                                    >
                                        {copied ? <Check size={16} className="text-green-600" /> : <Copy size={16} />}
                                    </button>
                                </div>
                                <p className="text-[13px] text-zinc-600 leading-relaxed italic pr-4">
                                    {journal.authors && journal.authors.length > 0 ? journal.authors.join(", ") : "Unknown Author"}. ({journal.year}). {journal.title}. {journal.publisher || journal.source}. {journal.pdfLink || journal.journalLink || ""}
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'pdf' && (
                    <div className="h-full w-full bg-zinc-50">
                        {(journal.pdfLink || (journal.journalLink && journal.journalLink !== "#")) ? (
                            <iframe
                                src={`https://docs.google.com/viewer?url=${encodeURIComponent(journal.pdfLink || journal.journalLink)}&embedded=true`}
                                className="w-full h-full bg-white border-0"
                                title="Journal PDF"
                                allowFullScreen
                            />
                        ) : (
                            <div className="flex flex-col items-center justify-center p-10 text-center gap-6 h-full">
                                <div className="w-16 h-16 rounded-2xl bg-white border border-zinc-200 shadow-sm flex items-center justify-center text-zinc-300">
                                    <FileDown size={32} />
                                </div>
                                <div className="space-y-2">
                                    <p className="text-zinc-900 text-md font-bold">Dokumen Tidak Ditemukan</p>
                                    <p className="text-zinc-500 text-sm max-w-[240px]">Pratinjau PDF tidak tersedia secara otomatis untuk sumber ini.</p>
                                </div>
                                <a
                                    href={journal.pdfLink || journal.journalLink}
                                    target="_blank"
                                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors shadow-md"
                                >
                                    Buka di Tab Baru
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-4 px-6 border-t border-zinc-100 bg-zinc-50/80">
                <div className="flex items-center justify-between">

                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-4 mr-4 text-zinc-400">
                            <Bookmark size={19} className="hover:text-zinc-600 cursor-pointer transition-colors" />
                        </div>

                        {(journal.pdfLink || (journal.journalLink && journal.journalLink !== "#")) && (
                            <a
                                href={journal.pdfLink || journal.journalLink}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 transition-colors text-white text-[13px] font-bold px-4 py-2.5 rounded-xl border border-zinc-700/50"
                            >
                                <FileText size={16} strokeWidth={2.5} />
                                <span>PDF</span>
                                <ExternalLink size={12} />
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

function TabButton({ active, icon, label, onClick }: { active: boolean, icon: React.ReactNode, label: string, onClick: () => void }) {
    return (
        <button
            onClick={onClick}
            className={`
                flex items-center gap-2 pb-4 pt-4 transition-none relative text-sm font-bold
                ${active ? 'text-zinc-900 border-b-2 border-zinc-900' : 'text-zinc-400 hover:text-zinc-600'}
            `}
        >
            {icon}
            <span>{label}</span>
        </button>
    );
}
