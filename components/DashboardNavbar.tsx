"use client";

import { usePathname } from "next/navigation";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import {
    Search,
    Bell,
    Settings,
    User,
    LogOut,
    ChevronRight,
    Home,
    Zap
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface DashboardNavbarProps {
    className?: string;
}

export default function DashboardNavbar({ className }: DashboardNavbarProps) {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [isPremium, setIsPremium] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const pathname = usePathname();

    useEffect(() => {
        const fetchUserProfile = async (userId: string) => {
            const { data, error } = await supabase
                .from('profiles')
                .select('role')
                .eq('id', userId)
                .single();

            if (data) {
                setIsPremium(data.role === 'premium');
            } else {
                setIsPremium(false);
                if (error) console.error('Error fetching profile:', error);
            }
        };

        supabase.auth.getSession().then(({ data: { session } }) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const currentUser = session?.user ?? null;
            setUser(currentUser);
            if (currentUser) {
                fetchUserProfile(currentUser.id);
            } else {
                setIsPremium(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        window.location.href = "/";
    };

    // Breadcrumb logic
    const getBreadcrumbs = () => {
        const parts = pathname.split("/").filter(p => p);
        return parts.map((part, i) => {
            const href = "/" + parts.slice(0, i + 1).join("/");
            return {
                label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
                href,
                isLast: i === parts.length - 1
            };
        });
    };

    const breadcrumbs = getBreadcrumbs();

    return (
        <nav className={cn(
            "h-14 border-b border-zinc-100 bg-white/80 backdrop-blur-md flex items-center justify-between px-6 sticky top-0 z-[40] transition-all",
            className
        )}>
            {/* Left - Branding */}
            <div className="flex items-center gap-2">
                <Link href="/" className="text-xl font-bold tracking-tight text-zinc-900 hover:opacity-80 transition-opacity">
                    JurnalGPT
                </Link>
            </div>

            {/* Center - Upgrade */}
            {!isPremium && (
                <div className="absolute left-1/2 -translate-x-1/2 flex items-center">
                    <Link
                        href="/pricing"
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                    >
                        <Zap size={14} fill="currentColor" />
                        UPGRADE
                    </Link>
                </div>
            )}

            {/* Right side - Routes */}
            <div className="flex items-center gap-6">
                <Link
                    href="/pricing"
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    Harga
                </Link>
                <Link
                    href="/contact"
                    className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors"
                >
                    Hubungi Kami
                </Link>
            </div>


        </nav>
    );
}
