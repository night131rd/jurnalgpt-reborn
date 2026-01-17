"use client";

import { motion } from "framer-motion";
import { Smile, Laugh, User } from "lucide-react";

interface Testimonial {
    name: string;
    text: string;
    emoji?: string;
}

const testimonials: Testimonial[] = [
    {
        name: "Ghea",
        text: "Pakai JurnalGPT bikin nyari jurnal jauh lebih cepat, nggak perlu buka satu-satu lagi.",
    },
    {
        name: "Andini",
        text: "Membantu banget pas buntu nulis bab 2. Referensinya langsung dapet yang pas!",
        emoji: "✨"
    },
    {
        name: "Anggi",
        text: "Suka banget sama fitur rangkumannya, jadi cepet paham inti papernya tanpa baca puluhan lembar.",
    },
    {
        name: "Tiara",
        text: "Dafpus otomatisnya juara! Nggak ada lagi drama salah format APA atau MLA.",
        emoji: "🔥"
    },
    {
        name: "Eka",
        text: "Awalnya iseng coba, eh ketagihan karena emang sengefek itu buat kelarin tugas harian.",
    },
    {
        name: "Jheniar",
        text: "JurnalGPT tuh kayak punya asisten pribadi yang pinter nyari jurnal. Recommended buat yang lagi skripsian!",
    },
];

const AvatarIcon = () => (
    <div className="h-10 w-10 rounded-full bg-zinc-100 flex items-center justify-center border border-zinc-200">
        <User className="h-6 w-6 text-zinc-400" />
    </div>
);

export default function Testimonials() {
    return (
        <section className="w-full bg-[#FCFBF8] py-24 overflow-hidden relative">
            {/* Decorative Emojis */}
            <div className="absolute top-20 left-[10%] opacity-20 hidden md:block select-none pointer-events-none">
                <span className="text-4xl">😊</span>
            </div>
            <div className="absolute bottom-20 right-[15%] opacity-20 hidden md:block select-none pointer-events-none">
                <span className="text-4xl">😉</span>
            </div>

            <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-10">
                <div className="text-center mb-16">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-3xl md:text-5xl font-bold text-zinc-900 tracking-tight"
                    >
                        Kesan dan pesan dari teman-teman <span className="text-[#FF7A00]">JurnalGPT</span>
                    </motion.h2>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {testimonials.map((testimonial, idx) => (
                        <motion.div
                            key={testimonial.name}
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            transition={{ delay: idx * 0.1 }}
                            className="bg-white p-8 rounded-[24px] border border-zinc-100 shadow-[0_4px_20px_rgba(0,0,0,0.03)] hover:shadow-[0_10px_30px_rgba(0,0,0,0.06)] transition-all flex flex-col justify-between"
                        >
                            <div className="relative">
                                <span className="absolute -top-4 -left-2 text-4xl text-zinc-100 font-serif overflow-hidden">“</span>
                                <p className="text-zinc-700 leading-relaxed text-lg italic mb-8 relative z-10">
                                    {testimonial.text}
                                </p>
                            </div>

                            <div className="flex items-center gap-4 border-t border-zinc-50 pt-6">
                                <AvatarIcon />
                                <div className="flex flex-col">
                                    <span className="font-bold text-zinc-900 text-base">{testimonial.name}</span>
                                    <span className="text-zinc-400 text-xs font-medium uppercase tracking-wider">Mahasiswa</span>
                                </div>
                                {testimonial.emoji && (
                                    <span className="ml-auto text-xl">{testimonial.emoji}</span>
                                )}
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
