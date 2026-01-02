"use client";

import { motion } from "framer-motion";

export default function LoadingAnimation() {
    return (
        <div className="flex flex-col items-center justify-center py-16">
            {/* Pulsing Dots */}
            <div className="flex gap-2">
                {[0, 1, 2].map((index) => (
                    <motion.div
                        key={index}
                        className="h-3 w-3 rounded-full bg-blue-600"
                        animate={{
                            scale: [1, 1.2, 1],
                            opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                            duration: 1,
                            repeat: Infinity,
                            delay: index * 0.2,
                        }}
                    />
                ))}
            </div>

            {/* Loading Text */}
            <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="mt-4 text-sm text-zinc-600"
            >
                Mencari jurnal terbaik untuk Anda...
            </motion.p>
        </div>
    );
}
