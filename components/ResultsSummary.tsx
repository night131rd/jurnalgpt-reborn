"use client";

import { motion } from "framer-motion";
import { ChevronRight, Binoculars, Zap, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

interface ResultsSummaryProps {
    role: "premium" | "free" | "guest";
    stepCount: number;
    sourceCount: number;
    className?: string;
}

export default function ResultsSummary({ role, stepCount, sourceCount, className }: ResultsSummaryProps) {
    const isPro = role === "premium";

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "flex items-center gap-3 py-3 px-4 rounded-2xl bg-zinc-50/50 border border-zinc-100 group cursor-default transition-all hover:bg-zinc-50",
                className
            )}
        >
            <div className="flex items-center gap-2">
                <div className={cn(
                    "flex h-7 w-7 items-center justify-center rounded-lg shadow-sm",
                    isPro ? "bg-blue-600 text-white" : "bg-zinc-200 text-zinc-500"
                )}>
                    {isPro ? <ShieldCheck className="h-4 w-4" /> : <Binoculars className="h-4 w-4" />}
                </div>

                <span className={cn(
                    "text-sm font-bold tracking-tight",
                    isPro ? "text-zinc-900" : "text-zinc-600"
                )}>
                    {isPro ? "Pro" : "Free"}
                </span>
            </div>

            <div className="h-3 w-[1px] bg-zinc-300" />

            <div className="flex items-center gap-1.5 text-zinc-500">
                <span className="text-sm font-bold text-zinc-900">{stepCount}</span>
                <span className="text-[13px] font-medium">steps</span>
            </div>

            <div className="h-3 w-[1px] bg-zinc-300" />

            <div className="flex items-center gap-1.5 text-zinc-500">
                <span className="text-sm font-bold text-zinc-900">{sourceCount}</span>
                <span className="text-[13px] font-medium">sources</span>
            </div>

            <ChevronRight className="h-4 w-4 text-zinc-300 ml-auto transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500" />
        </motion.div>
    );
}
