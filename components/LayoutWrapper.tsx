"use client";

import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
    const pathname = usePathname();
    const hidePaddingOnRoutes = ["/login", "/register"];
    const shouldHidePadding = hidePaddingOnRoutes.includes(pathname);

    return (
        <main className={cn(
            "min-h-screen",
            !shouldHidePadding && "pt-24"
        )}>
            {children}
        </main>
    );
}
