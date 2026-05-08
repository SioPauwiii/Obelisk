"use client";

import { usePathname } from "next/navigation";
import {
    Home,
    Compass,
    Camera,
    Users,
    User,
    LucideIcon,
} from "lucide-react";
import { NavItem } from "./NavItem";

export interface NavItemConfig {
    label: string;
    href: string;
    icon: LucideIcon;
}

const defaultNavItems: NavItemConfig[] = [
    { label: "Home", href: "/dashboard", icon: Home },
    { label: "Discover", href: "/discover", icon: Compass },
    { label: "Capture", href: "/capture", icon: Camera },
    { label: "Community", href: "/community", icon: Users },
    { label: "Profile", href: "/profile", icon: User },
];

interface BottomNavProps {
    items?: NavItemConfig[];
    onNavigate?: (href: string) => void;
}

export function BottomNav({
    items = defaultNavItems,
    onNavigate,
}: BottomNavProps) {
    const pathname = usePathname();

    const getIsActive = (href: string) => {
        if (href === "/dashboard") return pathname === "/dashboard";
        return pathname.startsWith(href);
    };

    return (
        <nav
            className="fixed bottom-0 left-0 right-0 z-40 font-sans"
            style={{ backgroundColor: "#ffffff" }}
        >
            {/* Subtle top border */}
            <div className="h-px w-full bg-slate-200" />

            <div className="flex items-center justify-around h-[64px] px-2">
                {items.map((item) => (
                    <NavItem
                        key={item.href}
                        href={item.href}
                        label={item.label}
                        icon={item.icon}
                        isActive={getIsActive(item.href)}
                        onClick={() => onNavigate?.(item.href)}
                    />
                ))}
            </div>

            {/* Safe-area spacer for iOS home indicator */}
            <div className="h-safe-bottom bg-transparent" />
        </nav>
    );
}
