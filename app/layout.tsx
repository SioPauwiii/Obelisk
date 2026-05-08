import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
    title: "Obelisk - Blockchain Humanity Archive",
    description:
        "Obelisk is a blockchain-powered humanity archive that preserves identities, memories, achievements, moments, and digital legacies on-chain for future generations.",
    keywords: [
        "Blockchain",
        "OneDev",
        "humanity archive",
        "identity preservation",
        "digital legacy",
        "memories",
        "achievements",
        "moments",
        "hackathon",
        "web3",
        "decentralized storage",
        "NFT",
        "ethereum",
        "solana",
        "ipfs",
    ],
    authors: [{ name: "OneDevPH", url: "https://onedevph.online" }],
    publisher: "OneDevPH",
    robots: {
        index: true,
        follow: true,
        nocache: false,
    },
    icons: {
        icon: "/favicon.ico",
    },
    manifest: "/manifest.webmanifest",
    other: {
        "mobile-web-app-capable": "yes",
        "apple-mobile-web-app-capable": "yes",
        "apple-mobile-web-app-status-bar-style": "default",
        "apple-mobile-web-app-title": "Obelisk",
    },
};

export default function RootLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    return (
        <html
            lang="en"
            className="h-full antialiased"
            data-scroll-behavior="smooth"
        >
            <body className="min-h-full flex flex-col">{children}</body>
        </html>
    );
}
