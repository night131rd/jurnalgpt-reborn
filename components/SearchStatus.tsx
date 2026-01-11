"use client";

import { motion, AnimatePresence } from "framer-motion";
import { SearchStatus as SearchStatusType } from "@/lib/services/searchService";
import {
    LucideIcon,
    Search,
    LayoutGrid,
    Brain,
    PenLine,
    Sparkles,
} from "lucide-react";

interface SearchStatusProps {
    status: SearchStatusType | null;
}

interface StepConfig {
    id: string;
    label: string;
    icon: LucideIcon;
    color: string;
}

const STEPS: StepConfig[] = [
    { id: "init", label: "Inisialisasi", icon: Sparkles, color: "text-blue-500" },
    { id: "expansion", label: "Memahami pencarian", icon: Search, color: "text-indigo-500" },
    { id: "retrieval", label: "Mengumpulkan referensi", icon: LayoutGrid, color: "text-violet-500" },
    { id: "reranking", label: "Menilai relevansi", icon: Brain, color: "text-purple-500" },
    { id: "answer_start", label: "Menyusun jawaban", icon: PenLine, color: "text-fuchsia-500" },
];

export default function SearchStatus({ status }: SearchStatusProps) {
    const getActiveStepIndex = () => {
        if (!status) return 0;
        switch (status.type) {
            case "expansion":
                return 1;
            case "retrieval":
                return 2;
            case "reranking":
            case "reranked":
                return 3;
            case "journals":
            case "answer_start":
                return 4;
            default:
                return 0;
        }
    };

    const activeIndex = getActiveStepIndex();
    const currentStep = STEPS[activeIndex];

    return (
        <div className="flex w-full max-w-4xl mx-auto py-2 justify-center">
            <motion.div
                layout
                className="relative flex w-full items-center justify-between
          rounded-2xl border border-zinc-100
          bg-white/80 backdrop-blur-md
          px-4 py-3
          shadow-sm ring-1 ring-black/5"
            >
                {/* LEFT */}
                <div className="flex items-center">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={currentStep.id}
                            initial={{ opacity: 0, y: 8, filter: "blur(4px)" }}
                            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                            exit={{ opacity: 0, y: -8, filter: "blur(4px)" }}
                            transition={{ duration: 0.35, ease: [0.23, 1, 0.32, 1] }}
                            className="flex items-center gap-3 pr-2"
                        >
                            {/* Icon */}
                            <div className={`p-1.5 rounded-full bg-zinc-50 ${currentStep.color}`}>
                                <currentStep.icon size={16} strokeWidth={2.5} />
                            </div>

                            {/* Label */}
                            <span
                                className="
                  text-sm font-medium
                  text-zinc-800
                  tracking-[-0.015em]
                  whitespace-nowrap
                "
                            >
                                {currentStep.label}
                            </span>

                            {/* Dots */}
                            <div className="flex items-center gap-1 pl-1">
                                {[0, 1, 2].map((i) => (
                                    <motion.div
                                        key={i}
                                        animate={{
                                            scale: [1, 1.25, 1],
                                            opacity: [0.25, 1, 0.25],
                                        }}
                                        transition={{
                                            duration: 1.2,
                                            repeat: Infinity,
                                            delay: i * 0.15,
                                            ease: "easeInOut",
                                        }}
                                        className="h-1 w-1 rounded-full bg-zinc-400"
                                    />
                                ))}
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>

                {/* RIGHT */}
                <div className="hidden sm:block overflow-hidden">
                    <AnimatePresence mode="wait">
                        {status?.type === "expansion" && (
                            <motion.div
                                key="expansion-meta"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                className="flex gap-1.5"
                            >
                                {status.keywords.slice(0, 3).map((kw, i) => (
                                    <span
                                        key={i}
                                        className="
                      text-[10px] font-semibold
                      tracking-widest uppercase
                      text-zinc-400
                      bg-zinc-50
                      px-2 py-1
                      rounded-lg border border-zinc-100
                    "
                                    >
                                        {kw.replace(/\s+/g, "")}
                                    </span>
                                ))}
                            </motion.div>
                        )}

                        {status?.type === "retrieval" && (
                            <motion.div
                                key="retrieval-meta"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                className="
                  flex gap-2
                  text-[10px] font-semibold
                  tracking-widest uppercase
                  text-zinc-400
                "
                            >
                                {status.sources.map((s) => (
                                    <div
                                        key={s.name}
                                        className="flex items-center gap-1
                      bg-zinc-50 px-2 py-1
                      rounded-lg border border-zinc-100"
                                    >
                                        <span className="text-blue-500">{s.count}</span>
                                        <span>{s.name}</span>
                                    </div>
                                ))}
                            </motion.div>
                        )}

                        {status?.type === "reranked" && (
                            <motion.div
                                key="reranked-meta"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                className="
                  text-[10px] font-semibold
                  tracking-widest uppercase
                  text-blue-600
                  bg-blue-50
                  px-2 py-1
                  rounded-lg border border-blue-100
                "
                            >
                                {status.count} Jurnal Relevan
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </div>
    );
}
