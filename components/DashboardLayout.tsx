"use client";

import { useState } from "react";
import Sidebar from "./Sidebar";
import { PanelLeft } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import DashboardNavbar from "./DashboardNavbar";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const [isOpen, setIsOpen] = useState(true);

    return (
        <div className="flex bg-white h-screen relative overflow-hidden font-sans">
            {/* Desktop Sidebar with Animation */}
            <motion.aside
                initial={false}
                animate={{ width: isOpen ? 256 : 60 }}
                transition={{ type: "spring", damping: 25, stiffness: 200 }}
                className="hidden md:flex flex-col h-screen sticky top-0 shrink-0 overflow-hidden border-r border-zinc-200"
            >
                <div className={isOpen ? "w-64" : "w-[60px]"}>
                    <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
                </div>
            </motion.aside>

            {/* Mobile Sidebar */}
            <div className="md:hidden">
                <Sidebar isOpen={isOpen} setIsOpen={setIsOpen} />
            </div>

            <main className="flex-1 min-w-0 bg-white md:rounded-l-[2.5rem] relative z-10 overflow-hidden shadow-[0_0_50px_-12px_rgba(0,0,0,0.08)] h-full flex flex-col">
                <div className="flex-1 overflow-hidden relative">
                    {children}
                </div>
            </main>
        </div>
    );
}
