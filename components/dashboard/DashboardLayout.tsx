"use client";

import { Header } from "./Header";
import { BottomNav } from "./BottomNav";

interface DashboardLayoutProps {
    children: React.ReactNode;
    onLogout?: () => void;
}

export function DashboardLayout({
    children,
    onLogout,
}: DashboardLayoutProps) {
    return (
        <div className="flex flex-col min-h-svh bg-slate-50 dark:bg-slate-950 font-sans">
            <Header onLogout={onLogout} />
            {children}
            <BottomNav />
        </div>
    );
}
