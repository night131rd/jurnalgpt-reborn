"use client";

import Link from "next/link";
import Image from "next/image";
import { Twitter, Linkedin, Instagram, Mail } from "lucide-react";
import { usePathname } from "next/navigation";

export default function Footer() {
    const pathname = usePathname();
    const currentYear = 2026;

    if (pathname === "/search") return null;

    return (
        <footer className="bg-zinc-50 border-t border-zinc-200 pt-16 pb-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    {/* Column 1: Identity */}
                    <div className="flex flex-col gap-4">
                        <Link href="/" className="flex items-center gap-2">
                            <div className="relative h-8 w-8">
                                <Image
                                    src="/64.png"
                                    alt="JurnalGPT Logo"
                                    fill
                                    className="object-contain"
                                />
                            </div>
                            <span className="text-xl font-bold tracking-tight text-zinc-900">
                                JurnalGPT
                            </span>
                        </Link>
                        <p className="text-sm text-zinc-500 leading-relaxed max-w-xs">
                            Platform AI yang menjawab berdasarkan jurnal ilmiah untuk membantu mahasiswa dalam mengerjakan laprak & skripsi.
                        </p>
                    </div>

                    {/* Column 2: Product */}
                    <div>
                        <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-5">
                            Produk
                        </h4>
                        <ul className="flex flex-col gap-3">
                            <li>
                                <Link href="/search" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium">
                                    Cari Jurnal
                                </Link>
                            </li>
                            <li>
                                <Link href="/pricing" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium">
                                    Harga & Paket
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Column 3: Use Cases */}
                    <div>
                        <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-5">
                            Pengguna
                        </h4>
                        <ul className="flex flex-col gap-3">
                            <li>
                                <span className="text-sm text-zinc-400 font-medium">Mahasiswa</span>
                            </li>
                            <li>
                                <span className="text-sm text-zinc-400 font-medium">Peneliti</span>
                            </li>
                            <li>
                                <span className="text-sm text-zinc-400 font-medium">Akademisi</span>
                            </li>
                        </ul>
                    </div>

                    {/* Column 4: Contact & About */}
                    <div>
                        <h4 className="text-xs font-semibold text-zinc-900 uppercase tracking-wider mb-5">
                            Bantuan
                        </h4>
                        <ul className="flex flex-col gap-3">
                            <li>
                                <Link href="/contact" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium">
                                    Hubungi Kami
                                </Link>
                            </li>
                            <li>
                                <a href="mailto:jurnalgpt.student@gmail.com" className="text-sm text-zinc-500 hover:text-zinc-900 transition-colors font-medium inline-flex items-center gap-2">
                                    <Mail className="h-3 w-3" />
                                    jurnalgpt.student@gmail.com
                                </a>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="pt-8 border-t border-zinc-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                    <div className="flex flex-col gap-1">
                        <p className="text-sm text-zinc-500 font-medium">
                            &copy; {currentYear} JurnalGPT
                        </p>
                        <p className="text-xs text-zinc-400 uppercase tracking-tight font-semibold">
                            Dikelola secara individu oleh mahasiswa
                        </p>
                        <p className="text-xs text-zinc-400">
                            Solo, Jawa Tengah, Indonesia
                        </p>
                    </div>

                    <div className="flex items-center gap-5 outline-none">
                        <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                            <Twitter className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                            <Linkedin className="h-5 w-5" />
                        </a>
                        <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">
                            <Instagram className="h-5 w-5" />
                        </a>
                    </div>
                </div>
            </div>
        </footer>
    );
}
