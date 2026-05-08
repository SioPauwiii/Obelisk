"use client";

import { useState, useRef, useEffect } from "react";
import { Bell, LogOut, User } from "lucide-react";
import Image from "next/image";

interface HeaderProps {
    onNotificationClick?: () => void;
    onLogout?: () => void;
    username?: string;
}

export function Header({
    onNotificationClick,
    onLogout,
    username,
}: HeaderProps) {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        function handleClickOutside(e: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <header className="fixed top-0 left-0 right-0 z-40 h-16 bg-white border-b border-slate-200 font-sans">
            <div className="flex items-center justify-between h-full px-4 md:px-6">

                {/* Left: Logo + App Name */}
                <div className="flex items-center gap-2">
                    <Image
                        src="/obelisk_logo.png"
                        alt="Obelisk Logo"
                        className="h-8 w-8 object-contain"
                        width={32}
                        height={32}
                    />
                    <span className="text-base font-bold text-slate-900 tracking-wide">
                        Obelisk
                    </span>
                </div>

                {/* Right: User Avatar → Dropdown */}
                <div className="relative" ref={dropdownRef}>
                    <button
                        onClick={() => setOpen((prev) => !prev)}
                        className="flex items-center justify-center w-9 h-9 rounded-full bg-slate-100 border border-slate-200 text-slate-600 hover:bg-slate-200 transition-all duration-200 active:scale-95"
                        aria-label="User menu"
                        aria-expanded={open}
                    >
                        <User size={18} />
                    </button>

                    {/* Dropdown */}
                    {open && (
                        <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white border border-slate-200 shadow-lg shadow-slate-200/60 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-150">
                            {/* Username header */}
                            <div className="px-4 py-3 border-b border-slate-100">
                                <p className="text-xs text-slate-400 font-medium uppercase tracking-wider">Signed in as</p>
                                <p className="text-sm font-semibold text-slate-800 truncate mt-0.5">{username ?? "User"}</p>
                            </div>

                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onNotificationClick?.();
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-slate-100 text-slate-600">
                                    <Bell size={14} />
                                </span>
                                Notifications
                            </button>

                            <div className="h-px bg-slate-100 mx-3" />

                            <button
                                onClick={() => {
                                    setOpen(false);
                                    onLogout?.();
                                }}
                                className="flex items-center gap-3 w-full px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
                            >
                                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-red-100 text-red-600">
                                    <LogOut size={14} />
                                </span>
                                Log out
                            </button>
                        </div>
                    )}
                </div>

            </div>
        </header>
    );
}
