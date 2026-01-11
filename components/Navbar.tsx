"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { Search, Crown, User, Menu, X, LogOut, LayoutDashboard, Zap } from "lucide-react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { User as SupabaseUser } from "@supabase/supabase-js";
import SearchHistoryDropdown from "@/components/SearchHistoryDropdown";

export default function Navbar({ isSticky, externalScrolled }: { isSticky?: boolean, externalScrolled?: boolean }) {
    const [isOpen, setIsOpen] = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [premiumDays, setPremiumDays] = useState<number | null>(null);
    const [showUserMenu, setShowUserMenu] = useState(false);

    const pathname = usePathname();
    const router = useRouter();

    const isNavbarScrolled = externalScrolled !== undefined ? externalScrolled : scrolled;

    useEffect(() => {
        // Handle scroll
        const handleScroll = () => {
            setScrolled(window.scrollY > 10);
        };
        window.addEventListener("scroll", handleScroll);

        const fetchUserProfile = async (userId: string) => {
            const { data, error } = await supabase
                .from('profiles')
                .select('role, sisa_waktu_premium')
                .eq('id', userId)
                .single();

            if (data) {
                setIsPremium(data.role === 'premium');
                setPremiumDays(data.sisa_waktu_premium);
            } else {
                setIsPremium(false);
                setPremiumDays(null);
                if (error) console.error('Error fetching profile:', error);
            }
        };

        // Check current session
        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
            } else {
                setIsPremium(false);
                setPremiumDays(null);
            }
        });

        return () => {
            window.removeEventListener("scroll", handleScroll);
            subscription.unsubscribe();
        };
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        setShowUserMenu(false);
        router.push("/");
        router.refresh();
    };

    const navLinks = [
        { name: "Search", href: "/search", icon: Search },
        { name: "Harga", href: "/pricing", icon: Crown },
        { name: "Hubungi kami", href: "/contact", icon: Menu },
    ];

    // Hide navbar on Login and Register pages
    const hideOnRoutes = ["/login", "/register"];
    if (hideOnRoutes.includes(pathname)) {
        return null;
    }

    return (
        <nav
            className={cn(
                "z-50 transition-all duration-300 border-b border-transparent",
                isSticky ? "sticky top-0 w-full" : "fixed top-0 w-full",
                isNavbarScrolled
                    ? "bg-white/80 backdrop-blur-md border-zinc-200"
                    : "bg-transparent"
            )}
        >
            <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-8">
                    {/* Logo and Brand */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="relative h-15 w-15">
                            <Image
                                src="/64.png"
                                alt="JurnalGPT Logo"
                                fill
                                className="object-contain"
                            />
                        </div>
                        <span className="text-xl font-bold tracking-tight text-gray-900">
                            JurnalGPT
                        </span>
                    </Link>

                    {/* Desktop Links */}
                    <div className="hidden items-center gap-6 md:flex">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className={cn(
                                        "text-sm font-medium transition-colors hover:text-black",
                                        isActive ? "text-black font-semibold" : "text-zinc-500"
                                    )}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right Content - Auth States */}
                <div className="hidden md:flex items-center gap-4">
                    {!user ? (
                        <>
                            <Link
                                href="/register"
                                className="text-sm font-medium text-zinc-600 hover:text-black transition-colors"
                            >
                                Buat akun
                            </Link>
                            <Link
                                href="/login"
                                className="rounded-full bg-black px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-zinc-800 shadow-sm"
                            >
                                Masuk
                            </Link>
                        </>
                    ) : (
                        <div className="flex items-center gap-4">
                            {isPremium ? (
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-2 text-sm font-bold text-blue-600 border-2 border-blue-600 px-4 py-1.5 rounded-full bg-white">
                                        <Crown className="h-4 w-4 fill-blue-600" />
                                        <span>Premium</span>
                                    </div>
                                    {premiumDays !== null && (
                                        <div className="flex items-center gap-1.5 text-sm font-black text-white bg-blue-600 px-3 py-1.5 rounded-full shadow-sm">
                                            <span>{premiumDays}</span>
                                            <Zap className="h-4 w-4 fill-white" />
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <Link
                                    href="/pricing"
                                    className="rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-2 text-sm font-medium text-white transition-all hover:shadow-md hover:scale-105"
                                >
                                    Upgrade Premium
                                </Link>
                            )}

                            {/* History Dropdown */}
                            <SearchHistoryDropdown />

                            {/* User Profile Dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="relative h-9 w-9 overflow-hidden rounded-full border border-zinc-200 transition-transform hover:scale-105 outline-none focus:ring-2 focus:ring-zinc-200"
                                >
                                    <Image
                                        src={user.user_metadata?.avatar_url || "/dog_thinking.png"}
                                        alt="User Profile"
                                        fill
                                        className="object-cover"
                                    />
                                </button>

                                <AnimatePresence>
                                    {showUserMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-[40]"
                                                onClick={() => setShowUserMenu(false)}
                                            />
                                            <motion.div
                                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                                className="absolute right-0 mt-3 w-56 origin-top-right rounded-2xl border border-zinc-200 bg-white p-2 shadow-xl z-[50]"
                                            >
                                                <div className="px-3 py-2 border-b border-zinc-100 mb-1">
                                                    <p className="text-sm font-bold text-zinc-900 truncate">
                                                        {user.user_metadata?.full_name || user.email}
                                                    </p>
                                                    <p className="text-xs text-zinc-500 truncate">
                                                        {user.email}
                                                    </p>
                                                </div>

                                                <Link
                                                    href="/profile"
                                                    onClick={() => setShowUserMenu(false)}
                                                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900"
                                                >
                                                    <LayoutDashboard className="h-4 w-4" />
                                                    Dashboard Saya
                                                </Link>

                                                <button
                                                    onClick={handleSignOut}
                                                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                                >
                                                    <LogOut className="h-4 w-4" />
                                                    Keluar
                                                </button>
                                            </motion.div>
                                        </>
                                    )}
                                </AnimatePresence>
                            </div>
                        </div>
                    )}
                </div>

                {/* Mobile Menu Toggle */}
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="rounded-md p-2 text-zinc-600 transition-colors hover:bg-zinc-100 md:hidden"
                >
                    {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                </button>
            </div>

            {/* Mobile Menu */}
            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="border-t border-zinc-200 bg-white shadow-lg md:hidden"
                    >
                        <div className="flex flex-col gap-2 p-4">
                            {user && (
                                <div className="flex items-center gap-3 p-2 mb-4 bg-zinc-50 rounded-2xl">
                                    <div className="relative h-10 w-10 overflow-hidden rounded-full border border-zinc-200">
                                        <Image
                                            src={user.user_metadata?.avatar_url || "/dog_thinking.png"}
                                            alt="User Profile"
                                            fill
                                            className="object-cover"
                                        />
                                    </div>
                                    <div>
                                        <p className="text-sm font-bold text-zinc-900">
                                            {user.user_metadata?.full_name || user.email}
                                        </p>
                                        <p className="text-xs text-zinc-500">
                                            {user.email}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-black"
                                >
                                    <link.icon className="h-4 w-4" />
                                    {link.name}
                                </Link>
                            ))}
                            <div className="h-px bg-zinc-100 my-2" />
                            {!user ? (
                                <>
                                    <Link
                                        href="/register"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-black"
                                    >
                                        Buat akun
                                    </Link>
                                    <Link
                                        href="/login"
                                        onClick={() => setIsOpen(false)}
                                        className="mt-2 flex w-full items-center justify-center rounded-lg bg-black p-2.5 text-sm font-medium text-white hover:bg-zinc-800"
                                    >
                                        Masuk
                                    </Link>
                                </>
                            ) : (
                                <>
                                    {isPremium && (
                                        <div className="flex flex-wrap items-center gap-2 p-1">
                                            <div className="flex items-center gap-2 text-xs font-bold text-blue-600 border-2 border-blue-600 px-3 py-1 rounded-full bg-white">
                                                <Crown className="h-3.5 w-3.5 fill-blue-600" />
                                                <span>Premium</span>
                                            </div>
                                            {premiumDays !== null && (
                                                <div className="flex items-center gap-1 text-xs font-black text-white bg-blue-600 px-3 py-1 rounded-full border-2 border-blue-600">
                                                    <span>{premiumDays}</span>
                                                    <Zap className="h-3.5 w-3.5 fill-white" />
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {!isPremium && (
                                        <Link
                                            href="/pricing"
                                            onClick={() => setIsOpen(false)}
                                            className="flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 p-2.5 text-sm font-medium text-white shadow-sm"
                                        >
                                            Upgrade Premium
                                        </Link>
                                    )}
                                    <Link
                                        href="/profile"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-zinc-600 hover:bg-zinc-50 hover:text-black"
                                    >
                                        <User className="h-4 w-4" />
                                        Profile Saya
                                    </Link>
                                    <button
                                        onClick={handleSignOut}
                                        className="flex items-center gap-3 rounded-lg p-2 text-sm font-medium text-red-600 hover:bg-red-50"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        Keluar
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </nav>
    );
}
