"use client";

import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/hooks/useAuth";

export default function DashboardLayoutWrapper({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { logout } = useAuth();

    const handleLogout = async () => {
        await logout();
        queryClient.clear();
        router.replace("/signin");
    };

    return <DashboardLayout onLogout={handleLogout}>{children}</DashboardLayout>;
}
