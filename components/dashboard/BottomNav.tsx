"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import {
    Home,
    Compass,
    Camera,
    Award,
    User,
    LucideIcon,
    Plus,
} from "lucide-react";

export interface NavItemConfig {
    label: string;
    href: string;
    icon: LucideIcon;
    isCapture?: boolean;
}

const navItems: NavItemConfig[] = [
    { label: "Feed", href: "/feed", icon: Home },
    { label: "Explore", href: "/explore", icon: Compass },
    { label: "Capture", href: "/capture", icon: Camera, isCapture: true },
    { label: "Badges", href: "/badges", icon: Award },
    { label: "Profile", href: "/profile", icon: User },
];

export function BottomNav() {
    const pathname = usePathname();

    const getIsActive = (href: string) => {
        if (href === "/feed") return pathname === "/feed";
        return pathname.startsWith(href);
    };

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 font-sans bg-white dark:bg-slate-950">
            {/* Subtle top border */}
            <div className="h-px w-full bg-slate-200 dark:bg-slate-800" />

            <div className="flex items-center justify-around h-[64px] px-2">
                {navItems.map((item) => {
                    const isActive = getIsActive(item.href);

                    // Elevated Capture FAB
                    if (item.isCapture) {
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className="flex flex-col items-center justify-center flex-1"
                            >
                                <div className="relative -top-3 flex items-center justify-center w-14 h-14 rounded-full bg-linear-to-r from-indigo-600 to-indigo-500 shadow-lg shadow-cyan-500/30 text-white transition-transform active:scale-95 hover:shadow-xl hover:shadow-cyan-500/40">
                                    <Plus size={28} strokeWidth={2} />
                                </div>
                            </Link>
                        );
                    }

                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className="flex flex-col items-center justify-center gap-1.5 flex-1 py-3 transition-all duration-200 active:scale-95"
                        >
                            <item.icon
                                size={22}
                                strokeWidth={isActive ? 2.2 : 1.8}
                                className={`transition-colors duration-200 ${
                                    isActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-slate-500"
                                }`}
                            />
                            <span
                                className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                                    isActive
                                        ? "text-indigo-600 dark:text-indigo-400"
                                        : "text-slate-400 dark:text-slate-500"
                                }`}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </div>

            {/* Safe-area spacer for iOS home indicator */}
            <div className="h-safe-bottom bg-transparent" />
        </nav>
    );
}
