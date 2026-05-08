"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface DashboardLayoutProps {
    children: React.ReactNode;
    onLogout?: () => void;
    username?: string;
}

export function DashboardLayout({
    children,
    onLogout,
    username,
}: DashboardLayoutProps) {
    return (
        <div className="flex flex-col min-h-svh bg-slate-50 dark:bg-slate-950 font-sans">
            <Header onLogout={onLogout} username={username} />
            {children}
            <BottomNav />
        </div>
    );
}
