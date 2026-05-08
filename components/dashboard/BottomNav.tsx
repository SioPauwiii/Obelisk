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
    { label: "Camera", href: "/capture", icon: Camera },
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
        if (href === "/dashboard") {
            return pathname === "/dashboard";
        }
        return pathname.startsWith(href);
    };

    const centerIndex = Math.floor(items.length / 2);

    return (
        <nav className="fixed bottom-0 left-0 right-0 z-40 h-20 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 font-sans">
            <div className="flex items-center justify-center h-full px-4">
                <div className="flex items-center justify-between w-full max-w-md gap-2">
                    {/* Left items */}
                    <div className="flex gap-2">
                        {items.slice(0, centerIndex).map((item) => (
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

                    {/* Center Camera */}
                    <NavItem
                        href={items[centerIndex].href}
                        label={items[centerIndex].label}
                        icon={items[centerIndex].icon}
                        isActive={getIsActive(items[centerIndex].href)}
                        onClick={() => onNavigate?.(items[centerIndex].href)}
                        isCentered
                    />

                    {/* Right items */}
                    <div className="flex gap-2">
                        {items.slice(centerIndex + 1).map((item) => (
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
                </div>
            </div>
        </nav>
    );
}
