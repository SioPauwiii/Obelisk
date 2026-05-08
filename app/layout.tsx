import type { Metadata } from "next";
import "./globals.css";
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { Providers } from "@/components/Providers";
import { ToastContainer, Slide } from "react-toastify";

const geist = Geist({ subsets: ["latin"], variable: "--font-sans" });

export const metadata: Metadata = {
    title: "Obelisk - Blockchain Humanity Archive",
    description:
        "A blockchain-powered preservation protocol designed to safeguard humanity's identity, knowledge, history, and legacy for future generations. Built as a decentralized proof of personhood system, this system establishes verifiable human authenticity while creating a permanent, tamper-resistant archive of human existence, culture, and contribution.",
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
            className={cn("h-full antialiased", "font-sans", geist.variable)}
            data-scroll-behavior="smooth"
        >
            <body className="min-h-full flex flex-col">
                <Providers>{children}</Providers>
                <ToastContainer
                    position="top-right"
                    autoClose={5000}
                    hideProgressBar={false}
                    newestOnTop={false}
                    closeOnClick
                    rtl={false}
                    pauseOnFocusLoss
                    draggable
                    pauseOnHover
                    theme="colored"
                    transition={Slide}
                />
            </body>
        </html>
    );
}
