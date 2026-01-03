"use client";

import { Check, Crown, HelpCircle } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabase";

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<"monthly" | "weekly">("monthly");
    const router = useRouter();

    const handleSubscribe = async (plan: string) => {
        const amount = plan === 'weekly' ? 3000 : 10000;

        // Check if user is logged in
        const { data: { user }, error: authError } = await supabase.auth.getUser();

        if (authError || !user) {
            router.push('/login?redirect=/pricing');
            return;
        }

        const { data, error } = await supabase
            .from('payment_intents')
            .insert([
                {
                    user_id: user.id,
                    plan_type: plan,
                    expected_amount: amount,
                    status: 'waiting_payment'
                }
            ])
            .select()
            .single();

        if (error) {
            console.error('Error creating payment intent:', error);
            return;
        }

        // Redirect to payment page
        router.push(`/payment/${data.id}?plan=${plan}`);
    };

    return (
        <div className="min-h-screen bg-white pb-20 pt-10">
            {/* Header Section */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 text-center mb-16">
                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-4xl md:text-5xl font-bold text-zinc-900 mb-6"
                >
                    Dukung JurnalGPT!
                </motion.h1>
                <p className="text-xl text-zinc-500 max-w-2xl mx-auto">
                    Setiap rupiah Anda bukan hanya untuk fitur tambahan, tapi juga membantu kami menjaga keberlangsungan platform riset ini agar tetap gratis bagi mahasiswa lain.
                </p>
            </div>

            {/* Pricing Cards */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 mb-24">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">

                    {/* FREE PLAN */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm hover:shadow-md transition-shadow relative"
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-zinc-900">Free</h3>
                            <p className="text-sm text-zinc-500 mt-2"> Mulai tanpa biaya, nikmati fitur dasar untuk menelusuri dan membaca jurnal.</p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-zinc-900">Rp 0</span>
                        </div>

                        <Link
                            href="/register"
                            className="block w-full text-center py-4 px-4 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-colors mb-8"
                        >
                            Gunakan Sekarang
                        </Link>

                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">FITUR TERMASUK</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-zinc-600">
                                    <Check className="h-5 w-5 text-zinc-400 shrink-0" />
                                    <span>Pencarian Terbatas</span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-600">
                                    <Check className="h-5 w-5 text-zinc-400 shrink-0" />
                                    <span>Akses 4 Referensi</span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-600">
                                    <Check className="h-5 w-5 text-zinc-400 shrink-0" />
                                    <span>Tanpa Pembayaran</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* MONTHLY PLAN (Prominent - Black) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="rounded-3xl bg-zinc-900 p-8 shadow-2xl relative transform md:-translate-y-6 z-10 border border-zinc-800"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-white">Monthly</h3>
                            <div className="bg-blue-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter">
                                POPULAR
                            </div>
                        </div>
                        <p className="text-sm text-zinc-400 mt-2 mb-4"> Kurang dari 500 Rupiah per hari, kamu bukan cuma dapat semua fitur premium, tapi juga ikut mendukung keberlanjutan JurnalGPT agar tetap bisa diakses gratis oleh teman-teman mahasiswa lainnya.</p>

                        <div className="mb-6">
                            <span className="text-4xl font-bold text-white">Rp 10.000</span>
                            <span className="text-zinc-400"> / 30 hari</span>
                            <div className="mt-1 text-sm font-medium text-blue-400">Hanya Rp 333 / hari</div>
                        </div>

                        <button
                            onClick={() => handleSubscribe('monthly')}
                            className="block w-full text-center py-4 px-4 rounded-xl bg-white text-zinc-900 font-black hover:bg-zinc-100 transition-colors mb-8 shadow-lg"
                        >
                            Pilih Monthly
                        </button>

                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">SEGALA FITUR, PLUS</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-zinc-300">
                                    <Check className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span> Dukungan kepada kami </span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-300">
                                    <Check className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span>Pencarian <strong>tak terbatas</strong></span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-300">
                                    <Check className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span>Akses <strong>8 jurnal</strong></span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-300">
                                    <Check className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span>Fitur <strong>Simpan Jurnal</strong></span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-300">
                                    <Check className="h-5 w-5 text-blue-500 shrink-0" />
                                    <span>Prioritas Customer Service</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                    {/* WEEKLY PLAN (Light Gray) */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 }}
                        className="rounded-3xl border border-zinc-200 bg-zinc-50 p-8 shadow-sm hover:shadow-md transition-shadow relative"
                    >
                        <div className="mb-4">
                            <h3 className="text-xl font-bold text-zinc-900">Weekly</h3>
                            <p className="text-sm text-zinc-500 mt-2"> Bayar semurah, lebih murah  dari segelas kopi, tapi dampaknya besar, kamu bantu menjaga agar JurnalGPT terus berkembang untuk komunitas akademik Indonesia. </p>
                        </div>
                        <div className="mb-6">
                            <span className="text-4xl font-bold text-zinc-900">Rp 3.000</span>
                            <span className="text-zinc-500"> / 7 hari</span>
                        </div>

                        <button
                            onClick={() => handleSubscribe('weekly')}
                            className="block w-full text-center py-4 px-4 rounded-xl bg-black text-white font-bold hover:bg-zinc-800 transition-colors mb-8"
                        >
                            Pilih Weekly
                        </button>

                        <div className="space-y-4">
                            <p className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">SEGALA FITUR, PLUS</p>
                            <ul className="space-y-3">
                                <li className="flex items-start gap-3 text-zinc-700">
                                    <Check className="h-5 w-5 text-zinc-900 shrink-0" />
                                    <span> Dukungan kepada kami </span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-700">
                                    <Check className="h-5 w-5 text-zinc-900 shrink-0" />
                                    <span>Pencarian tak terbatas</span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-700">
                                    <Check className="h-5 w-5 text-zinc-900 shrink-0" />
                                    <span>Akses 8 jurnal</span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-700">
                                    <Check className="h-5 w-5 text-zinc-900 shrink-0" />
                                    <span>Fitur Simpan Jurnal</span>
                                </li>
                                <li className="flex items-start gap-3 text-zinc-700">
                                    <Check className="h-5 w-5 text-zinc-900 shrink-0" />
                                    <span>Prioritas CS</span>
                                </li>
                            </ul>
                        </div>
                    </motion.div>

                </div>
            </div>

            {/* FAQ Section */}
            <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
                <h2 className="text-2xl font-bold text-center text-zinc-900 mb-8">Pertanyaan yang Sering Diajukan</h2>
                <div className="space-y-4">
                    {[
                        { q: "Bagaimana cara upgrade ke paket Monthly?", a: "Cukup klik tombol “Pilih Monthly” di atas dan ikuti langkah pembayarannya. Dalam hitungan menit, akunmu langsung aktif dan siap bantu kamu meneliti tanpa batas! 🚀" },
                        { q: "Apakah saya bisa membatalkan langganan kapan saja?", a: "Tenang, JurnalGPT tidak mengikat kamu dengan kontrak apa pun. Setiap paket (Weekly atau Monthly) bersifat sekali bayar — kamu bebas berhenti atau lanjut kapan pun tanpa beban." },
                        { q: "Apa metode pembayaran yang diterima?", a: "Kamu bisa membayar dengan QRIS. Kami buat semudah mungkin agar kamu tinggal scan tanpa ribet 💳✨" },
                        { q: "Apa bedanya Free dan Premium?", a: "Paket Premium (Weekly/Monthly) membuka akses pencarian tak terbatas, jumlah jurnal lebih banyak, dan fitur Simpan Jurnal. Selain itu, kamu juga berkontribusi menjaga agar fitur gratis tetap bisa dinikmati mahasiswa lain. 💛" },
                        { q: "Apakah uang langganan saya benar-benar membantu JurnalGPT?", a: "Ya! Setiap langganan membantu kami menutupi biaya server, memperbarui data jurnal, dan menjaga agar JurnalGPT tetap bebas iklan & gratis bagi pengguna baru. Dengan kata lain — kamu bukan cuma pengguna, tapi juga bagian dari komunitas yang membangun masa depan riset mahasiswa Indonesia." }
                    ].map((faq, i) => (
                        <div key={i} className="rounded-lg border border-zinc-200 bg-zinc-50 p-6">
                            <h3 className="flex items-center gap-2 font-semibold text-zinc-900">
                                <HelpCircle className="h-5 w-5 text-zinc-400" />
                                {faq.q}
                            </h3>
                            <p className="mt-2 text-zinc-600 pl-7">{faq.a}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
