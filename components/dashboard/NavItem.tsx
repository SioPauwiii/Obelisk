"use client";

import Link from "next/link";
import { LucideIcon } from "lucide-react";

interface NavItemProps {
    href: string;
    label: string;
    icon: LucideIcon;
    isActive?: boolean;
    onClick?: () => void;
}

export function NavItem({
    href,
    label,
    icon: Icon,
    isActive = false,
    onClick,
}: NavItemProps) {
    return (
        <Link
            href={href}
            onClick={onClick}
            className="flex flex-col items-center justify-center gap-1.5 flex-1 py-3 transition-all duration-200 active:scale-95"
        >
            <Icon
                size={22}
                strokeWidth={isActive ? 2.2 : 1.8}
                className={`transition-colors duration-200 ${
                    isActive ? "text-blue-500" : "text-slate-400"
                }`}
            />
            <span
                className={`text-[10px] font-medium tracking-wide transition-colors duration-200 ${
                    isActive ? "text-blue-500" : "text-slate-400"
                }`}
            >
                {label}
            </span>
        </Link>
    );
}
