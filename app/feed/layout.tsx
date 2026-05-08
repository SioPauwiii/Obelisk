"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";
import { toastSuccess } from "@/utils/Toast";

export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { logout, user } = useAuth();

    const handleLogout = async () => {
        await logout();
        queryClient.clear();
        toastSuccess("Logged out", "You have been successfully signed out.");
        router.replace("/signin");
    };

    const username = user?.full_name ?? user?.email ?? "User";

    return (
        <DashboardLayout onLogout={handleLogout} username={username}>
            {children}
        </DashboardLayout>
    );
}
