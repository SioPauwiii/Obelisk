"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItemProps {
    href: string;
    label: string;
    icon: LucideIcon;
    isActive?: boolean;
    onClick?: () => void;
    isCentered?: boolean;
}

export function NavItem({
    href,
    label,
    icon: Icon,
    isActive = false,
    onClick,
    isCentered = false,
}: NavItemProps) {
    const baseStyles =
        "flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-colors";
    const activeStyles = isActive
        ? "text-indigo-600 dark:text-cyan-500"
        : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200";
    const centeredStyles = isCentered
        ? "gap-1.5 px-4 py-3 shadow-lg shadow-indigo-500/20 dark:shadow-cyan-500/10 bg-white dark:bg-slate-800 rounded-full"
        : "";

    return (
        <Link href={href} onClick={onClick}>
            <div className={cn(baseStyles, activeStyles, centeredStyles)}>
                <Icon
                    size={isCentered ? 28 : 24}
                    className="transition-transform"
                />
                <span
                    className={cn(
                        "text-xs font-medium",
                        isCentered ? "text-sm" : ""
                    )}
                >
                    {label}
                </span>
            </div>
        </Link>
    );
}
