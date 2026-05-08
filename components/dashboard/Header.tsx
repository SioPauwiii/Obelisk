"use client";

import { Bell, LogOut } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
    onNotificationClick?: () => void;
    onLogout?: () => void;
}

export function Header({
    onNotificationClick,
    onLogout,
}: HeaderProps) {
    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 font-sans">
            <div className="flex items-center justify-between h-full px-4 md:px-6">
                {/* Left: Notification Icon */}
                <button
                    onClick={onNotificationClick}
                    className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                    aria-label="Notifications"
                >
                    <Bell size={24} />
                </button>

                {/* Center: Branding */}
                <div className="flex items-center gap-2">
                    <Image
                        src="/obelisk_logo.png"
                        alt="Obelisk Logo"
                        className="h-8 w-8 object-contain"
                        width={32}
                        height={32}
                    />
                    <span className="text-sm font-bold text-indigo-950 dark:text-indigo-100 tracking-wide hidden sm:inline">
                        Obelisk
                    </span>
                </div>

                {/* Right: Logout Button */}
                <button
                    onClick={onLogout}
                    className="p-2 rounded-lg text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    aria-label="Logout"
                >
                    <LogOut size={24} />
                </button>
            </div>
        </header>
    );
}
