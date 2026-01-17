"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import SearchCard from "@/components/SearchCard";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Testimonials from "@/components/Testimonials";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import {
  CheckCircle2,
  Sparkles,
  Search,
  FileText,
  Zap,
  ShieldCheck,
  ArrowRight,
  BookOpen,
  GraduationCap,
  Quote
} from "lucide-react";

export default function Home() {
  const router = useRouter();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string, minYear: string, maxYear: string, scope: 'all' | 'national' | 'international') => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      router.push('/register');
      return;
    }

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
    <div className="relative min-h-screen bg-white selection:bg-blue-100 selection:text-blue-900">
      <Navbar />

      {/* Background Decor */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] rounded-full bg-blue-50/50 blur-[120px]" />
        <div className="absolute top-[20%] -right-[5%] w-[30%] h-[30%] rounded-full bg-indigo-50/40 blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }}
        />
      </div>

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col items-center text-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="mb-8 flex items-center gap-2 rounded-full bg-blue-50 px-4 py-1.5 text-sm font-semibold text-blue-700 ring-1 ring-blue-700/10"
              >
                <Sparkles className="h-4 w-4 fill-blue-700" />
                <span>AI Pencari Jurnal Pertama di Indonesia</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="max-w-112xl text-5xl font-extrabold tracking-tight text-zinc-900 sm:text-6xl lg:text-7xl"
              >
                Rangkuman, Kutipan, Dafpus  <br className="hidden sm:block" />
                <span className="relative">
                  <span className="relative z-10 bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    Jadi Satu.
                  </span>
                  <svg className="absolute -bottom-2 left-0 z-0 h-3 w-full text-blue-100/80" viewBox="0 0 100 10" preserveAspectRatio="none">
                    <path d="M0 5 Q 25 0, 50 5 T 100 5 L 100 10 L 0 10 Z" fill="currentColor" />
                  </svg>
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-8 max-w-2xl text-xl text-zinc-800 sm:text-xl mb-12"
              >
                Nggak perlu bolak-balik banyak website.
                Semua kebutuhan jurnal untuk laprak dan skripsi ada di sini.
              </motion.p>

              <div className="w-full flex justify-center px-4">
                <SearchCard onSearch={handleSearch} isLoading={isSearching} />
              </div>

              {/* Stats/Badges */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="mt-16 flex flex-wrap justify-center gap-x-12 gap-y-6 grayscale opacity-60 transition-all hover:grayscale-0 hover:opacity-100"
              >
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-zinc-600 underline decoration-zinc-200 underline-offset-4 decoration-2">200K+ Paper Terindeks</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-zinc-600 underline decoration-zinc-200 underline-offset-4 decoration-2">Jurnas & Jurinter</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  <span className="text-sm font-semibold text-zinc-600 underline decoration-zinc-200 underline-offset-4 decoration-2">Format APA/MLA Siap</span>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-24 bg-zinc-50/50 relative overflow-hidden">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="mb-16 text-center">
              <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
                Alat Tempur Mahasiswa <span className="text-blue-600">Modern</span>
              </h2>
              <p className="mt-4 text-lg text-zinc-600">
                Lupakan cara lama mencari jurnal. Kami menyediakan semua yang kamu butuhkan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 md:grid-rows-2 gap-4 h-auto md:h-[600px]">
              {/* Feature 1: Large */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-2 md:row-span-1 bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm flex flex-col justify-between overflow-hidden group"
              >
                <div>
                  <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-zinc-900 mb-2">Pencarian Akurat & Cepat</h3>
                  <p className="text-zinc-600 max-w-md">
                    Algoritma AI kami memindai ribuan database jurnal nasional dan internasional (Scopus, SINTA, WoS) untuk menemukan referensi yang paling relevan dengan topikmu.
                  </p>
                </div>
                <div className="mt-8 flex items-center gap-2 text-blue-600 font-semibold cursor-pointer group-hover:gap-3 transition-all">
                  <span>Coba sekarang</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </motion.div>

              {/* Feature 2: Small */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl p-8 text-white shadow-lg overflow-hidden relative"
              >
                <div className="relative z-10">
                  <div className="h-12 w-12 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center mb-6">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">Akses PDF Langsung</h3>
                  <p className="text-blue-50/80">
                    Nggak perlu muter-muter. Jika paper publik, kamu bisa baca dan download PDF-nya langsung dari dashboard.
                  </p>
                </div>
                <div className="absolute -bottom-4 -right-4 opacity-10">
                  <FileText className="h-32 w-32" />
                </div>
              </motion.div>

              {/* Feature 3: Small */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-1 md:row-span-1 bg-zinc-900 rounded-3xl p-8 text-white shadow-xl overflow-hidden group"
              >
                <div className="h-12 w-12 rounded-2xl bg-zinc-800 flex items-center justify-center mb-6">
                  <Quote className="h-6 w-6 text-blue-400" />
                </div>
                <h3 className="text-xl font-bold mb-2 text-white">Sitasi Instan</h3>
                <p className="text-zinc-400">
                  Salin sitasi dalam format APA, MLA, atau Chicago dengan satu klik. Nggak ada lagi drama daftar pustaka salah format.
                </p>
                <div className="mt-8 pt-8 border-t border-zinc-800 flex gap-4">
                  <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] uppercase tracking-wider font-bold text-zinc-500">APA</div>
                  <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] uppercase tracking-wider font-bold text-zinc-500">MLA</div>
                  <div className="px-3 py-1 bg-zinc-800 rounded-full text-[10px] uppercase tracking-wider font-bold text-zinc-500">Harvard</div>
                </div>
              </motion.div>

              {/* Feature 4: Medium */}
              <motion.div
                whileHover={{ y: -5 }}
                className="md:col-span-2 md:row-span-1 bg-white rounded-3xl p-8 border border-zinc-200 shadow-sm flex items-center gap-8 group"
              >
                <div className="flex-1">
                  <div className="h-12 w-12 rounded-2xl bg-orange-50 flex items-center justify-center mb-6">
                    <Zap className="h-6 w-6 text-orange-600" />
                  </div>
                  <h3 className="text-xl font-bold text-zinc-900 mb-2">Ringkasan AI Pintar</h3>
                  <p className="text-zinc-600">
                    Hemat waktu berjam-jam. AI kami merangkum poin-poin penting dari setiap jurnal sehingga kamu bisa paham isinya dengan cepat tanpa baca 30 halaman.
                  </p>
                </div>
                <div className="hidden lg:block w-48 h-32 bg-zinc-100 rounded-2xl border border-dashed border-zinc-300 relative overflow-hidden">
                  <motion.div
                    animate={{ x: [0, 10, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute top-4 left-4 right-4 h-2 bg-zinc-300 rounded-full"
                  />
                  <motion.div
                    animate={{ x: [0, -10, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 4, repeat: Infinity }}
                    className="absolute top-8 left-4 right-12 h-2 bg-zinc-300 rounded-full"
                  />
                  <motion.div
                    animate={{ x: [0, 5, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="absolute top-12 left-4 right-8 h-2 bg-blue-300 rounded-full"
                  />
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 bg-white">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <div className="lg:w-1/2">
                <h2 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl mb-6">
                  Cara Kerja JurnalGPT <br />
                  <span className="text-blue-600">Sesederhana 1-2-3</span>
                </h2>
                <div className="space-y-8 mt-12">
                  {[
                    {
                      step: "01",
                      title: "Tanya Pertanyaanmu",
                      desc: "Tuliskan topik riset atau pertanyaan yang sedang kamu kerjakan di kolom pencarian.",
                      icon: <Sparkles className="h-5 w-5" />
                    },
                    {
                      step: "02",
                      title: "AI Bekerja",
                      desc: "JurnalGPT akan memindai database dan mengekstrak jawaban langsung dari jurnal-jurnal ilmiah.",
                      icon: <ShieldCheck className="h-5 w-5" />
                    },
                    {
                      step: "03",
                      title: "Salin & Selesai",
                      desc: "Baca jawaban, cek jurnal aslinya, dan salin daftar pustakanya ke dokumen skripsimu.",
                      icon: <GraduationCap className="h-5 w-5" />
                    }
                  ].map((item, idx) => (
                    <div key={idx} className="flex gap-6">
                      <div className="flex-shrink-0 w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg">
                        {item.step}
                      </div>
                      <div>
                        <h4 className="text-lg font-bold text-zinc-900 mb-1 flex items-center gap-2">
                          {item.title}
                        </h4>
                        <p className="text-zinc-600">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="lg:w-1/2 relative">
                <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-zinc-200 aspect-square sm:aspect-video lg:aspect-[4/3] bg-zinc-100">
                  {/* Mock Screenshot Placeholder */}
                  <div className="absolute inset-0 flex items-center justify-center text-zinc-400 font-medium">
                    <div className="p-8 text-center">
                      <div className="mx-auto w-16 h-16 rounded-full bg-white shadow-md flex items-center justify-center mb-4">
                        <Zap className="h-8 w-8 text-blue-600 animate-pulse" />
                      </div>
                      <p>Visualisasi Dashboard JurnalGPT</p>
                    </div>
                  </div>
                </div>
                {/* Decorative Elements */}
                <div className="absolute -top-6 -right-6 w-24 h-24 bg-blue-600 rounded-full blur-3xl opacity-20" />
                <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-indigo-600 rounded-full blur-3xl opacity-20" />
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <Testimonials />

        {/* CTA Bottom */}
        <section className="py-24">
          <div className="container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="relative rounded-[40px] bg-zinc-900 px-8 py-16 text-center overflow-hidden">
              {/* Background gradient for CTA */}
              <div className="absolute inset-0 bg-gradient-to-tr from-blue-600/20 via-transparent to-indigo-600/20" />

              <div className="relative z-10">
                <h2 className="text-3xl font-bold text-white sm:text-4xl md:text-5xl mb-8">
                  Siap Selesaikan <br className="sm:hidden" />
                  Skripsi Lebih Cepat?
                </h2>
                <p className="mx-auto max-w-xl text-lg text-zinc-400 mb-12">
                  Bergabunglah dengan ribuan mahasiswa lainnya yang sudah merasa terbantu.
                  Mulai cari jurnal pertamamu hari ini.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="w-full sm:w-auto px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-900/40 flex items-center justify-center gap-2"
                  >
                    Mulai Sekarang Gratis
                    <ArrowRight className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => router.push('/pricing')}
                    className="w-full sm:w-auto px-8 py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all"
                  >
                    Lihat Paket Premium
                  </button>
                </div>
                <p className="mt-8 text-sm text-zinc-500">
                  Tidak perlu kartu kredit untuk mencoba
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
