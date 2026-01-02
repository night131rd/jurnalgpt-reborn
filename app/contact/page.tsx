"use client";

import Navbar from "@/components/Navbar";
import { motion } from "framer-motion";

export default function ContactPage() {
    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            <main className="flex flex-col items-center justify-center pt-40 pb-20 px-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6 }}
                    className="max-w-4xl w-full text-center"
                >
                    <h1 className="text-6xl md:text-8xl font-extrabold text-zinc-900 tracking-tighter mb-8 antialiased">
                        Hubungi kami
                    </h1>

                    <div className="flex flex-col items-center gap-6">
                        <p className="text-lg md:text-xl text-zinc-500 font-medium max-w-2xl leading-relaxed">
                            <span className="inline-block mr-2">👋</span>
                            Cara terbaik untuk menghubungi kami adalah melalui email di{" "}
                            <a
                                href="mailto:jurnal.gpt@student.gmail.com"
                                className="text-zinc-900 font-bold border-b-2 border-zinc-900 hover:text-blue-600 hover:border-blue-600 transition-all"
                            >
                                jurnalgpt.student@gmail.com
                            </a>
                        </p>
                    </div>
                </motion.div>
            </main>

        </div>
    );
}
