"use client";

import { use, useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import PaymentTimer from '@/components/PaymentTimer';
import Image from 'next/image';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { cn } from '@/lib/utils';

function PaymentContent({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const resolvedParams = use(params);
    const intentId = resolvedParams.id;
    const plan = searchParams.get('plan') || 'monthly';
    const [expectedAmount, setExpectedAmount] = useState<number>(plan === 'weekly' ? 3000 : 10000);

    const [paidAmount, setPaidAmount] = useState('');
    const [file, setFile] = useState<File | null>(null);
    const [status, setStatus] = useState('');
    const [loading, setLoading] = useState(false);
    const [isConfirmed, setIsConfirmed] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [userEmail, setUserEmail] = useState<string | null>(null);

    useEffect(() => {
        async function fetchData() {
            // Fetch Intent
            const { data: intentData, error: intentError } = await supabase
                .from('payment_intents')
                .select('*')
                .eq('id', intentId)
                .single();

            if (intentData) {
                setExpectedAmount(intentData.expected_amount);
            } else if (intentError) {
                console.error('Error fetching intent:', intentError);
            }

            // Fetch User Session
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserEmail(user.email ?? null);
            }
        }
        fetchData();
    }, [intentId]);

    const handleUpload = async () => {
        if (!file) {
            setStatus('Silakan pilih bukti pembayaran.');
            return;
        }

        setLoading(true);
        setStatus('Sedang mengunggah...');

        try {
            // 1. Upload file to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${intentId}-${Math.random()}.${fileExt}`;
            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('payment_proofs')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('payment_proofs')
                .getPublicUrl(fileName);

            // 2. Insert into payment_proofs table
            const { error: proofError } = await supabase
                .from('payment_proofs')
                .insert([
                    {
                        payment_intent_id: intentId,
                        image_url: publicUrl,
                        paid_amount: paidAmount ? parseInt(paidAmount) : expectedAmount
                    }
                ]);

            if (proofError) throw proofError;

            // 3. Update payment_intents status
            const { error: updateError } = await supabase
                .from('payment_intents')
                .update({ status: 'waiting_verification' })
                .eq('id', intentId);

            if (updateError) throw updateError;
            setIsSuccess(true);
        } catch (err: any) {
            console.error('Upload error:', err);
            setStatus(`Gagal mengunggah: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    if (isSuccess) {
        return (
            <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-4">
                <div className="w-full max-w-md bg-white rounded-3xl shadow-xl border border-zinc-100 p-8 text-center space-y-8">
                    <div className="mx-auto w-15 h-15 rounded-full bg-emerald-50 flex items-center justify-center">
                        <svg className="w-9 h-9 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Pembayaran Berhasil</h1>
                        <p className="text-zinc-600 text-sm leading-relaxed">
                            Pembayaran kamu telah diterima.<br />
                            Kami akan memproses dalam waktu maksimal 24 jam.<br />
                            Jika ada kendala, akan kami hubungi melalui email.
                        </p>
                    </div>
                    <Link href="/" className="inline-flex items-center justify-center w-full rounded-xl bg-zinc-900 text-white py-4 font-semibold tracking-wide hover:bg-zinc-800 transition-all shadow-lg active:scale-[0.98]">
                        Lanjutkan Pencarian
                    </Link>
                </div>
            </div>
        );
    }

    if (!isConfirmed) {
        return (
            <div className="min-h-screen bg-zinc-10 flex items-center justify-center px-4 py-20">
                <div className="w-full max-w-6xl">
                    <div className="grid md:grid-cols-[1.5fr_1fr] rounded-3xl overflow-hidden border border-zinc-800 bg-zinc-900 shadow-2xl">
                        <section className="p-10 md:p-14 bg-white">
                            <header className="mb-12">
                                <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400">Secure Checkout</p>
                                <h1 className="mt-2 text-3xl font-semibold text-zinc-900 tracking-tight">Konfirmasi Langganan</h1>
                                <p className="mt-3 text-sm text-zinc-500 max-w-md">Invoice dan detail pembayaran akan dikirim ke email berikut.</p>
                            </header>
                            <div className="space-y-12">
                                <div>
                                    <label className="block text-xs font-medium text-zinc-500 mb-2">Email Perusahaan</label>
                                    <input
                                        type="email"
                                        value={userEmail || ""}
                                        onChange={(e) => setUserEmail(e.target.value)}
                                        placeholder="finance@company.com"
                                        className="w-full rounded-lg border border-zinc-300 px-4 py-3 text-sm text-zinc-900 focus:border-zinc-900 focus:ring-2 focus:ring-zinc-900/10 outline-none transition"
                                    />
                                </div>
                                <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-6">
                                    <div className="h-10 w-10 rounded-full bg-zinc-900 text-white flex items-center justify-center shrink-0">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 2l7 4v6c0 5-3.5 9-7 10-3.5-1-7-5-7-10V6l7-4z" />
                                        </svg>
                                    </div>
                                    <p className="text-sm text-zinc-600 leading-relaxed">Pembayaran dilindungi dengan enkripsi tingkat enterprise dan memenuhi standar keamanan industri.</p>
                                </div>
                            </div>
                        </section>
                        <aside className="p-10 md:p-12 bg-zinc-900 text-white flex flex-col">
                            <h3 className="text-sm font-semibold text-zinc-300 mb-8">Order Summary</h3>
                            <div className="space-y-5 text-sm mb-auto">
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Product</span>
                                    <span className="font-medium">JurnalGPT {plan}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-zinc-400">Billing Cycle</span>
                                    <span>-</span>
                                </div>
                                <div className="border-t border-zinc-700 pt-8 mt-8">
                                    <div className="text-4xl font-semibold tracking-tight tabular-nums">Rp {expectedAmount.toLocaleString("id-ID")}</div>
                                    <p className="text-xs text-zinc-400 mt-2">Tanpa Langganan</p>
                                </div>
                            </div>
                            <button onClick={() => setIsConfirmed(true)} className="mt-10 w-full rounded-xl bg-white text-zinc-900 py-4 font-semibold text-sm hover:bg-zinc-100 active:scale-[0.98] transition-all">
                                Proceed to Payment
                            </button>
                        </aside>
                    </div>
                    <div className="mt-10 text-center">
                        <Link href="/pricing" className="text-sm text-zinc-500 hover:text-zinc-300 transition">← Kembali</Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-zinc-0 flex justify-center px-4 py-24">
            <div className="w-full max-w-2xl">
                <div className="text-center mb-14">
                    <p className="text-xs uppercase tracking-[0.25em] text-zinc-400 mb-3">Secure Payment</p>
                    <h1 className="text-3xl md:text-4xl font-semibold text-zinc-900 tracking-tight mb-4">Selesaikan Pembayaran</h1>
                    <p className="text-zinc-400 text-sm leading-relaxed max-w-md mx-auto">Ikuti proses singkat di bawah ini untuk mengaktifkan akun Premium Anda.</p>
                </div>
                <div className="space-y-10">
                    <section className="bg-zinc-70 border border-zinc-800 rounded-3xl p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-xs font-semibold px-5 py-2 rounded-full bg-zinc-900 text-white">Step 1</span>
                            <h2 className="text-lg font-semibold text-zinc-900">Scan QRIS</h2>
                        </div>
                        <p className="text-sm text-zinc-900 mb-8 leading-relaxed">Scan kode QR di bawah menggunakan e-wallet atau mobile banking Anda.</p>
                        <div className="flex flex-col items-center gap-2">
                            <PaymentTimer duration={30 * 60} onExpire={() => router.push('/pricing')} />
                            <div className="relative w-85 h-85 bg-black rounded-0xl p-0">
                                <Image src="/qris_1.jpeg" alt="QRIS Payment" fill className="object-contain" />
                            </div>
                            <div className="text-center">
                                <p className="text-xs text-zinc-400 uppercase tracking-widest mb-1">Total Pembayaran</p>
                                <p className="text-3xl font-semibold text-zinc-900 tabular-nums">Rp {expectedAmount.toLocaleString("id-ID")}</p>
                            </div>
                        </div>
                    </section>
                    <section className="bg-zinc-70 border border-zinc-900 rounded-3xl p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-xs font-semibold px-5 py-2 rounded-full bg-black text-white">Step 2</span>
                            <h2 className="text-lg font-semibold text-zinc-900">Konfirmasi Nominal</h2>
                        </div>
                        <label className="block text-sm text-zinc-800 mb-3">Nominal yang Anda transfer</label>
                        <input
                            type="number"
                            value={paidAmount}
                            onChange={(e) => setPaidAmount(e.target.value)}
                            placeholder={`Rp ${expectedAmount}`}
                            className="w-full bg-zinc-80 border border-zinc-700 rounded-xl px-5 py-4 text-lg font-medium text-black placeholder:text-zinc-900 focus:ring-2 focus:ring-black/20 outline-none transition"
                        />
                        <p className="text-xs text-zinc-500 mt-3">Pastikan sesuai dengan nominal transfer ya.</p>
                    </section>
                    <section className="bg-zinc-70 border border-zinc-900 rounded-3xl p-8">
                        <div className="flex items-center gap-4 mb-6">
                            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-black text-white">Step 3</span>
                            <h2 className="text-lg font-semibold text-zinc-900">Upload Bukti Transfer</h2>
                        </div>
                        <div className="space-y-6">
                            <div className="relative border border-dashed border-zinc-700 rounded-2xl p-8 text-center hover:border-zinc-500 transition">
                                <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="absolute inset-0 opacity-0 cursor-pointer" />
                                <p className="text-sm text-zinc-900 font-medium">{file ? file.name : "Klik untuk upload bukti pembayaran"}</p>
                                <p className="text-xs text-zinc-500 mt-2">JPG atau PNG · Maks 5MB</p>
                            </div>
                            <button onClick={handleUpload} disabled={loading || !file} className={cn("w-full rounded-xl py-4 font-semibold text-sm transition-all", loading || !file ? "bg-zinc-10 border border-zinc-500 text-zinc-900 cursor-not-allowed" : "bg-zinc-900 text-white hover:bg-zinc-700")}>
                                {loading ? "Mengirim..." : "Kirim Bukti Pembayaran"}
                            </button>
                        </div>
                    </section>
                </div>
                <p className="text-center text-xx text-zinc-500 mt-14">Butuh bantuan? <Link href="/contact" className="text-black hover:underline">Hubungi Support</Link></p>
            </div>
        </div>
    );
}

export default function PaymentPage({ params }: { params: Promise<{ id: string }> }) {
    return (
        <Suspense fallback={<div className="min-h-screen bg-zinc-50 flex items-center justify-center">Loading...</div>}>
            <PaymentContent params={params} />
        </Suspense>
    );
}