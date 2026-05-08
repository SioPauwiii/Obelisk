"use client";

import { PrivyProvider } from "@privy-io/react-auth";

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <PrivyProvider
            appId={process.env.NEXT_PUBLIC_PRIVY_APP_ID!}
            config={{
                loginMethods: ["google", "apple", "email"],
                appearance: {
                    theme: "dark",
                    accentColor: "#6366f1",
                    logo: "/obelisk_logo.png",
                    showWalletLoginFirst: false,
                },
                embeddedWallets: {
                    ethereum: {
                        createOnLogin: "users-without-wallets",
                    },
                    showWalletUIs: false,
                },
            }}
        >
            {children}
        </PrivyProvider>
    );
}
