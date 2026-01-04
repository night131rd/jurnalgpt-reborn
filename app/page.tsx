"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SearchCard from "@/components/SearchCard";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import { cn } from "@/lib/utils";

export default function Home() {
  const router = useRouter();

  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = (query: string, minYear: string, maxYear: string, scope: 'all' | 'national' | 'international') => {
    setIsSearching(true);
    const params = new URLSearchParams({
      q: query,
      minYear,
      maxYear,
      scope
    });
    router.push(`/search?${params.toString()}`);
  };

  return (
    <>
      {/* Hero Section with Search */}
      <section className="relative min-h-screen bg-white pt-32 pb-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="flex justify-center"
          >

          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="mt-8 text-center text-4xl font-bold leading-tight tracking-tight text-zinc-900 sm:text-5xl lg:text-6xl"
          >
            Jawaban, Kutipan, dan Daftar Pustaka,{" "}
            <span className="bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
              semua dalam satu tempat.
            </span>
          </motion.h1>

          {/* Mascot and Speech Bubble */}
          <div className="relative mt-12 flex justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="relative"
            >
              {/* Speech Bubble */}
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-16 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-2xl bg-white px-4 py-2 text-sm font-medium text-zinc-700 shadow-lg ring-1 ring-black/5"
              >
                Ada yang aku bisa bantu cari? 🔍
                <div className="absolute -bottom-2 left-1/2 h-4 w-4 -translate-x-1/2 rotate-45 bg-white ring-1 ring-black/5"></div>
              </motion.div>

              {/* Mascot */}
              <div className="relative h-32 w-32">
                <Image
                  src="/dog_thinking.png"
                  alt="JurnalGPT Assistant"
                  fill
                  className="object-contain"
                />
              </div>
            </motion.div>
          </div>

          <div className="mt-12 flex justify-center">
            <SearchCard onSearch={handleSearch} isLoading={isSearching} />
          </div>
        </div>
      </section>

      {/* Features Section - Simplified */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h2 className="text-3xl font-bold text-zinc-900">
              Kenapa Banyak Mahasiswa Pakai JurnalGPT?
            </h2>
            <p className="mt-4 text-lg text-zinc-600">
              AI buat mahasiswa yang pengen skripsi & laporan praktikum kelar lebih cepat.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                title: "Cari Jurnal Tanpa Drama",
                description:
                  "Nggak perlu scroll ratusan paper. JurnalGPT langsung nemuin jurnal yang nyambung sama topik kamu.",
                icon: "🔍",
              },
              {
                title: "Pilih Jurnas atau Jurinter? Tinggal Klik",
                description:
                  "Mau Jurnal Nasional (SINTA) atau Jurnal Internasional (Scopus/WoS)? JurnalGPT bantu nyesuaiin rekomendasi jurnal sama kebutuhan dan level riset kamu.",
                icon: "📝",
              },
              {
                title: "Sitasi Beres, Nggak Salah Format",
                description:
                  "Daftar pustaka rapi dan siap dikumpulin",
                icon: "📚",
              },
            ].map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className="rounded-xl border border-zinc-200 bg-white p-6 transition-shadow hover:shadow-lg"
              >
                <div className="mb-3 text-4xl">{feature.icon}</div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">
                  {feature.title}
                </h3>
                <p className="text-sm text-zinc-600">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}

