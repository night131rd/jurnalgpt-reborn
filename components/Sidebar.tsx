"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
    Home,
    History,
    Bookmark,
    Settings,
    LogOut,
    Plus,
    ChevronRight,
    Zap,
    Crown,
    LayoutDashboard,
    Menu,
    X,
    Search,
    PanelLeftClose,
    PanelLeft,
    SquarePen
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";

interface HistoryEntry {
    id: string;
    query: string;
    created_at: string;
}

interface SavedJournal {
    id: string;
    title: string;
    journalLink: string;
    pdfLink?: string;
    saved_at: string;
}

interface SidebarProps {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
}

export default function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
    const pathname = usePathname();
    const router = useRouter();
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [history, setHistory] = useState<HistoryEntry[]>([]);
    const [savedJournals, setSavedJournals] = useState<SavedJournal[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [historySearch, setHistorySearch] = useState("");
    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(true);
    const [isJournalsOpen, setIsJournalsOpen] = useState(true);

    useEffect(() => {
        // Auth check
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser && session) {
                fetchUserProfile(currentUser.id);
                fetchRecentHistory(session.access_token);
                fetchSavedJournals(session.access_token);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
                fetchRecentHistory(session?.access_token || "");
                fetchSavedJournals(session?.access_token || "");
            } else {
                setHistory([]);
                setSavedJournals([]);
                setIsPremium(false);
            }
        });

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setIsSearchOpen(false);
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsSearchOpen(true);
            }
        };
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            subscription.unsubscribe();
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, []);

    const fetchUserProfile = async (userId: string) => {
        const { data } = await supabase
            .from('profiles')
            .select('role')
            .eq('id', userId)
            .single();
        if (data) setIsPremium(data.role === 'premium');
    };

    const fetchRecentHistory = async (token: string) => {
        try {
            const response = await fetch('/api/history?limit=20', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setHistory(data.history || []);
            }
        } catch (error) {
            console.error('Failed to fetch history:', error);
        }
    };

    const fetchSavedJournals = async (token: string) => {
        try {
            const response = await fetch('/api/saved-journals', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (response.ok) {
                const data = await response.json();
                setSavedJournals(data.journals || []);
            }
        } catch (error) {
            console.error('Failed to fetch saved journals:', error);
        }
    };

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        router.push("/");
    };

    const filteredHistory = history.filter(entry =>
        entry.query.toLowerCase().includes(historySearch.toLowerCase())
    );

    const filteredJournals = savedJournals.filter(journal =>
        journal.title.toLowerCase().includes(historySearch.toLowerCase())
    );

    const sidebarContent = (
        <div className={cn(
            "flex flex-col h-full bg-white text-zinc-600 relative font-sans transition-all duration-300 group",
            isOpen ? "w-64" : "w-[60px]"
        )}>
            {/* Branding & Toggle */}
            <div className={cn("p-4 flex flex-col gap-4 relative z-10", !isOpen && "items-center px-0")}>
                <div className={cn("flex items-center justify-between", isOpen ? "px-2" : "justify-center w-full min-h-[32px]")}>
                    {isOpen ? (
                        <>
                            <Link href="/" className="flex items-center gap-3 shrink-0">
                                <div className="relative h-16 w-14">
                                    <Image src="/64.png" alt="Logo" fill className="object-contain" />
                                </div>
                            </Link>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="p-1.5 text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 rounded-lg transition-all hidden md:block"
                                title="Close Sidebar"
                            >
                                <PanelLeftClose className="h-5 w-5" />
                            </button>
                        </>
                    ) : (
                        <div className="relative w-12 h-12 flex items-center justify-center">
                            {/* Logo - Hidden on hover */}
                            <div className="transition-all duration-200 group-hover:opacity-0 group-hover:scale-75">
                                <Image src="/64.png" alt="Logo" width={48} height={48} className="object-contain" />
                            </div>
                            {/* Toggle Button - Shown on hover */}
                            <button
                                onClick={() => setIsOpen(true)}
                                className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 text-zinc-400 hover:text-zinc-900"
                                title="Open Sidebar"
                            >
                                <PanelLeft className="h-5 w-5" />
                            </button>
                        </div>
                    )}
                </div>
                <Link
                    href="/search"
                    className={cn(
                        "flex items-center gap-2 w-full rounded-lg text-[15px] transition-colors hover:bg-zinc-100 group/item",
                        isOpen ? "px-3.5 py-2 mt-0.5" : "p-2.5 justify-center mt-0.5"
                    )}
                    title="Pencarian Baru"
                >
                    <SquarePen className="h-4 w-4 text-zinc-600 group-hover/item:text-zinc-900 transition-colors shrink-0" />
                    {isOpen && (
                        <span className="font-medium text-zinc-600 group-hover/item:text-zinc-900 transition-colors">
                            Pencarian Baru
                        </span>
                    )}
                </Link>

                {isOpen && (
                    <div className=" px-1">
                        {isSearchOpen ? (
                            <div className="relative flex items-center gap-2 h-9 px-2 bg-zinc-50 rounded-lg border border-zinc-200">
                                <Search className="h-5 w-5 text-zinc-400 shrink-0" />
                                <input
                                    autoFocus
                                    type="text"
                                    placeholder="Cari Riwayat"
                                    value={historySearch}
                                    onChange={(e) => setHistorySearch(e.target.value)}
                                    className="w-full bg-transparent text-[15px] outline-none placeholder:text-zinc-400 text-zinc-900"
                                />
                                <button
                                    onClick={() => {
                                        setIsSearchOpen(false);
                                        setHistorySearch("");
                                    }}
                                    className="p-1 rounded-md hover:bg-zinc-200 transition-colors"
                                >
                                    <X className="h-3 w-3 text-zinc-600" />
                                </button>
                            </div>
                        ) : (
                            <button
                                onClick={() => setIsSearchOpen(true)}
                                className="flex items-center gap-2 w-full h-9 px-3 rounded-lg text-[15px] text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors text-left"
                            >
                                <Search className="h-4 w-4 shrink-0" />
                                <span className="font-medium">Cari Riwayat</span>
                            </button>
                        )}
                    </div>
                )}

                {!isOpen && (
                    <Link
                        href="/history"
                        className="flex items-center justify-center p-2.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
                        title="Riwayat & Koleksi"
                    >
                        <History className="h-5 w-5" />
                    </Link>
                )}

            </div>

            {/* Content Lists - Scrollable */}
            <div className={cn(
                "flex-1 overflow-y-auto px-3 py-4 flex flex-col gap-0.5 custom-scrollbar relative z-10",
                !isOpen && "hidden items-center"
            )}>
                {/* Your Journals Section */}
                <div className="mt-4">
                    <button
                        onClick={() => setIsJournalsOpen(!isJournalsOpen)}
                        className="w-full px-3 mb-2 flex items-center gap-2 group hover:text-zinc-900 transition-colors"
                    >
                        <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-600 transition-colors tracking-tight">Your Journals</span>
                        <ChevronRight className={cn(
                            "h-3 w-3 text-zinc-400 transition-transform duration-200",
                            isJournalsOpen && "rotate-90"
                        )} />
                    </button>

                    <AnimatePresence initial={false}>
                        {isJournalsOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-col gap-0.5">
                                    {filteredJournals.map((journal) => (
                                        <a
                                            key={journal.id}
                                            href={journal.pdfLink || journal.journalLink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:text-zinc-900 hover:bg-zinc-100/80 transition-all truncate group"
                                        >
                                            <span className="truncate text-zinc-600 font-semibold group-hover:text-zinc-900 transition-colors leading-tight capitalize">
                                                {journal.title}
                                            </span>
                                        </a>
                                    ))}

                                    {filteredJournals.length === 0 && (
                                        <div className="px-3 py-2 text-[10px] text-zinc-400 italic">
                                            {historySearch ? "Tidak ada hasil ditemukan" : "No saved journals"}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* History Section - Flat & Collapsible */}
                <div className="mt-6">
                    <button
                        onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                        className="w-full px-3 mb-2 flex items-center gap-2 group hover:text-zinc-900 transition-colors"
                    >
                        <span className="text-[11px] font-semibold text-zinc-400 group-hover:text-zinc-600 transition-colors tracking-tight">Your chats</span>
                        <ChevronRight className={cn(
                            "h-3 w-3 text-zinc-400 transition-transform duration-200",
                            isHistoryOpen && "rotate-90"
                        )} />
                    </button>

                    <AnimatePresence initial={false}>
                        {isHistoryOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.2, ease: "easeInOut" }}
                                className="overflow-hidden"
                            >
                                <div className="flex flex-col gap-0.5">
                                    {filteredHistory.map((entry) => (
                                        <Link
                                            key={entry.id}
                                            href={`/history/${entry.id}`}
                                            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm hover:text-zinc-900 hover:bg-zinc-100/80 transition-all truncate group"
                                        >
                                            <span className="truncate text-zinc-600 font-semibold group-hover:text-zinc-900 transition-colors leading-tight capitalize">
                                                {entry.query}
                                            </span>
                                        </Link>
                                    ))}

                                    {filteredHistory.length === 0 && (
                                        <div className="px-3 py-2 text-[10px] text-zinc-400 italic">
                                            {historySearch ? "Tidak ada hasil ditemukan" : "No recent history"}
                                        </div>
                                    )}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Bottom Section */}
            <div className={cn(
                "flex flex-col gap-4 mt-auto relative z-10",
                isOpen ? "p-4" : "items-center pb-4 pt-0 px-0"
            )}>
                {/* Upgrade Card - Only shown when open */}
                {!isPremium && isOpen && (
                    <Link
                        href="/pricing"
                        className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl relative overflow-hidden group hover:bg-zinc-800 transition-all shadow-lg"
                    >
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <Crown className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs font-bold text-white">Upgrade Premium</span>
                            </div>
                            <p className="text-[11px] text-zinc-400 mb-3 leading-relaxed">
                                Nikmati pencarian tak terbatas dan fitur eksklusif lainnya.
                            </p>
                            <div className="flex items-center gap-1.5 text-xs font-bold text-white bg-blue-600 px-3 py-1.5 rounded-full w-fit group-hover:bg-blue-500 transition-colors">
                                <Zap className="h-3.5 w-3.5 fill-white" />
                                <span>Upgrade Sekarang</span>
                            </div>
                        </div>
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/20 blur-3xl rounded-full" />
                    </Link>
                )}

                {/* User Profile */}
                {user ? (
                    <div className={cn(
                        "flex items-center border border-zinc-200 bg-white group/profile transition-all",
                        isOpen ? "justify-between p-2 rounded-xl shadow-sm" : "justify-center p-1.5 rounded-full border-none bg-transparent"
                    )}>
                        <Link href="/profile" className="flex items-center gap-3 min-w-0">
                            <div className={cn(
                                "relative shrink-0 rounded-full overflow-hidden border border-zinc-200 group-hover/profile:border-zinc-300 transition-all",
                                isOpen ? "h-8 w-8" : "h-10 w-10 border-2 border-emerald-500"
                            )}>
                                <div className="absolute inset-0 bg-emerald-500 flex items-center justify-center text-white text-xs font-bold">
                                    {user.email?.[0].toUpperCase() || 'U'}
                                    {user.email?.[1].toUpperCase() || ''}
                                </div>
                            </div>
                            {isOpen && (
                                <div className="min-w-0">
                                    <p className="text-sm font-bold text-zinc-900 truncate uppercase">{user.user_metadata?.full_name || 'User'}</p>
                                    <p className="text-[10px] text-zinc-500 truncate">{user.email}</p>
                                </div>
                            )}
                        </Link>
                        {isOpen && (
                            <button
                                onClick={handleSignOut}
                                className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                title="Sign Out"
                            >
                                <LogOut className="h-4 w-4" />
                            </button>
                        )}
                    </div>
                ) : (
                    <Link
                        href="/login"
                        className={cn(
                            "flex items-center justify-center bg-zinc-900 text-white font-bold transition-all shadow-md",
                            isOpen ? "w-full py-2.5 rounded-xl text-sm" : "p-3 rounded-full"
                        )}
                    >
                        {isOpen ? "Get Started" : <Plus className="h-5 w-5" />}
                    </Link>
                )}
            </div>
        </div>
    );

    return (
        <>
            {/* Desktop Sidebar */}
            <div className="hidden md:flex flex-col h-full">
                {sidebarContent}
            </div>

            {/* Mobile Sidebar Overlay */}
            <AnimatePresence>
                {isOpen && isMobileOpen && (
                    <div className="fixed inset-0 z-[60] md:hidden">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsMobileOpen(false)}
                            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        />
                        <motion.div
                            initial={{ x: -264 }}
                            animate={{ x: 0 }}
                            exit={{ x: -264 }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="absolute left-0 top-0 bottom-0 w-64 shadow-2xl overflow-hidden"
                        >
                            {sidebarContent}
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Mobile Header (Hidden on Desktop) */}
            <div className="md:hidden fixed top-0 left-0 right-0 h-14 border-b border-zinc-200 bg-white flex items-center justify-between px-4 z-[50]">
                <Link href="/" className="flex items-center gap-2">
                    <div className="relative h-6 w-6">
                        <Image src="/64.png" alt="Logo" fill className="object-contain" />
                    </div>
                    <span className="text-lg font-bold text-black tracking-tight">JurnalGPT</span>
                </Link>
                <button
                    onClick={() => setIsMobileOpen(true)}
                    className="p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
                >
                    <Menu className="h-6 w-6" />
                </button>
            </div>
        </>
    );
}

// Dummy loading state for the empty history check if you want to add it
const isLoading = false;
