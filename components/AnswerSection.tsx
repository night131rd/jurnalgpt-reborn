"use client";

import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import ReactMarkdown from "react-markdown";

interface AnswerSectionProps {
    answer: string;
}

export default function AnswerSection({ answer }: AnswerSectionProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mb-8"
        >
            {/* Header */}
            <div className="mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-blue-600" />
                <h2 className="text-lg font-semibold text-zinc-900">Jawaban</h2>
            </div>

            {/* Answer Card */}
            <div className="relative min-h-[200px] overflow-hidden rounded-2xl bg-gradient-to-br from-blue-50 to-white p-6 ring-1 ring-blue-100">
                {/* Decorative gradient */}
                <div className="absolute right-0 top-0 h-32 w-32 -translate-y-8 translate-x-8 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-400/20 blur-2xl" />

                <div className="relative text-base leading-relaxed text-zinc-700 prose prose-blue max-w-none">
                    {answer ? (
                        <ReactMarkdown>{answer}</ReactMarkdown>
                    ) : (
                        <div className="flex flex-col gap-3 animate-pulse">
                            <div className="flex items-center gap-2 text-blue-600 font-medium">
                                <span className="animate-spin text-xl">✨</span>
                                <span>Sedang menganalisis {`(Menulis jawaban...)`}</span>
                            </div>
                            <div className="h-4 w-3/4 rounded bg-blue-100/50"></div>
                            <div className="h-4 w-full rounded bg-blue-100/50"></div>
                            <div className="h-4 w-5/6 rounded bg-blue-100/50"></div>
                        </div>
                    )}
                </div>
            </div>


        </motion.div>
    );
}
