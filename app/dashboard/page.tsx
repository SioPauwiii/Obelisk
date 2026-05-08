"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";

export default function DashboardFeed() {
    const [activeTab, setActiveTab] = useState("global");

    // Sample data reflecting the "Humanity Archive" MVP architecture
    const feedPosts = [
        {
            id: 1,
            author: "@swif7ify",
            humanityScore: 450,
            category: "Earth & Environment",
            location: "Olongapo City, Philippines",
            time: "2 hours ago",
            imageUrl: "/api/placeholder/600/400", // Replace with real image
            caption:
                "Coastal cleanup morning. Managed to clear out 12 bags of debris. 🌊♻️",
            cryptoProof: {
                network: "Base",
                storage: "Arweave",
                hash: "0x7F2a...9b4C",
                liveness: "Verified 3D",
            },
            vouches: 12,
        },
        {
            id: 2,
            author: "@elara_v",
            humanityScore: 820,
            category: "Culture & Tradition",
            location: "Kyoto, Japan",
            time: "5 hours ago",
            imageUrl: "/api/placeholder/600/400",
            caption: "Summer festival preparations in full swing.",
            cryptoProof: {
                network: "Base",
                storage: "Arweave",
                hash: "0x1A9c...4f2D",
                liveness: "Verified 3D",
            },
            vouches: 34,
        },
    ];

    return (
        <div className="flex h-svh bg-slate-50 dark:bg-slate-950 font-sans text-slate-900 dark:text-slate-100 overflow-hidden">
            {/* --- DESKTOP SIDEBAR (Hidden on Mobile) --- */}
            <aside className="hidden w-64 flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 md:flex">
                <div className="flex items-center gap-3 p-6">
                    <Image
                        src="/obelisk_logo.png"
                        alt="Logo"
                        width={32}
                        height={32}
                    />
                    <span className="text-xl font-bold tracking-wide text-indigo-950 dark:text-indigo-100">
                        Obelisk
                    </span>
                </div>

                <nav className="flex flex-1 flex-col gap-2 px-4">
                    <button className="flex items-center gap-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 px-3 py-2.5 text-sm font-medium text-indigo-600 dark:text-indigo-400">
                        <GlobeIcon className="h-5 w-5" /> Global Archive
                    </button>
                    <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">
                        <MapIcon className="h-5 w-5" /> Local Map
                    </button>
                    <button className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-900">
                        <AwardIcon className="h-5 w-5" /> My Soulbound Tokens
                    </button>
                </nav>

                <div className="border-t border-slate-200 dark:border-slate-800 p-4">
                    <div className="flex items-center gap-3 rounded-lg px-2 py-2">
                        <div className="h-8 w-8 rounded-full bg-linear-to-r from-indigo-500 to-cyan-500" />
                        <div className="flex flex-col">
                            <span className="text-sm font-bold">@swif7ify</span>
                            <span className="text-xs text-slate-500">
                                Score: 450
                            </span>
                        </div>
                    </div>
                </div>
            </aside>

            {/* --- MAIN FEED CONTENT --- */}
            <main className="flex-1 overflow-y-auto relative">


                {/* Feed Toggle */}
                <div className="flex border-b border-slate-200 dark:border-slate-800">
                    <button
                        onClick={() => setActiveTab("global")}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "global" ? "border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                        Global Feed
                    </button>
                    <button
                        onClick={() => setActiveTab("local")}
                        className={`flex-1 py-4 text-sm font-semibold transition-colors ${activeTab === "local" ? "border-b-2 border-cyan-500 text-cyan-600 dark:text-cyan-400" : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"}`}
                    >
                        Local Map
                    </button>
                </div>

                {/* Posts List */}
                <div className="mx-auto max-w-2xl flex flex-col gap-6 p-4 pb-24 md:p-6 md:pb-6">
                    {feedPosts.map((post) => (
                        <article
                            key={post.id}
                            className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900"
                        >
                            {/* Post Header */}
                            <div className="mb-3 flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-800" />
                                    <div>
                                        <h3 className="text-sm font-bold">
                                            {post.author}
                                        </h3>
                                        <p className="text-xs text-slate-500">
                                            {post.location} • {post.time}
                                        </p>
                                    </div>
                                </div>
                                <span className="rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                                    {post.category}
                                </span>
                            </div>

                            {/* Caption */}
                            <p className="mb-3 text-sm">{post.caption}</p>

                            {/* The Image (Anti-AI Verified) */}
                            <div className="relative mb-4 aspect-4/3 w-full overflow-hidden rounded-xl bg-slate-100 dark:bg-slate-950">
                                <Image
                                    src={post.imageUrl}
                                    alt="Event"
                                    fill
                                    className="object-cover"
                                />
                                {/* Overlay Hardware Sensor Badge */}
                                <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                                    <ShieldCheckIcon className="h-3 w-3 text-emerald-400" />
                                    {post.cryptoProof.liveness}
                                </div>
                            </div>

                            {/* Verification Data (The Web3 Layer) */}
                            <div className="mb-4 flex flex-wrap gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <DatabaseIcon className="h-3.5 w-3.5" />{" "}
                                    Permanent:{" "}
                                    <span className="font-mono text-cyan-600 dark:text-cyan-400">
                                        {post.cryptoProof.storage}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                    <LinkIcon className="h-3.5 w-3.5" /> Tx:{" "}
                                    <span className="font-mono">
                                        {post.cryptoProof.hash}
                                    </span>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-between border-t border-slate-100 pt-3 dark:border-slate-800">
                                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400">
                                    <VouchIcon className="h-5 w-5" />
                                    <span>Vouch ({post.vouches})</span>
                                </button>
                                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200">
                                    <ShareIcon className="h-5 w-5" /> Share
                                </button>
                            </div>
                        </article>
                    ))}
                </div>
            </main>


        </div>
    );
}

// Minimal Icon Components (Replace with lucide-react if installed)
function GlobeIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418"
            />
        </svg>
    );
}
function MapIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 6.75V15m6-6v8.25m.503 3.498 4.875-2.437c.381-.19.622-.58.622-1.006V4.82c0-.836-.88-1.38-1.628-1.006l-3.869 1.934c-.317.159-.69.159-1.006 0L9.503 3.252a1.125 1.125 0 0 0-1.006 0L3.622 5.689C3.24 5.88 3 6.27 3 6.695V19.18c0 .836.88 1.38 1.628 1.006l3.869-1.934c.317-.159.69-.159 1.006 0l4.994 2.497c.317.158.69.158 1.006 0Z"
            />
        </svg>
    );
}
function ShieldCheckIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12.75 11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 0 1-1.043 3.296 3.745 3.745 0 0 1-3.296 1.043A3.745 3.745 0 0 1 12 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 0 1-3.296-1.043 3.745 3.745 0 0 1-1.043-3.296A3.745 3.745 0 0 1 3 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 0 1 1.043-3.296 3.746 3.746 0 0 1 3.296-1.043A3.746 3.746 0 0 1 12 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 0 1 3.296 1.043 3.746 3.746 0 0 1 1.043 3.296A3.745 3.745 0 0 1 21 12Z"
            />
        </svg>
    );
}
function DatabaseIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0v3.75C20.25 19.897 16.556 21.75 12 21.75s-8.25-1.847-8.25-4.125v-3.75"
            />
        </svg>
    );
}
function LinkIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M13.19 8.688a4.5 4.5 0 0 1 1.242 7.244l-4.5 4.5a4.5 4.5 0 0 1-6.364-6.364l1.757-1.757m13.35-.622 1.757-1.757a4.5 4.5 0 0 0-6.364-6.364l-4.5 4.5a4.5 4.5 0 0 0 1.242 7.244"
            />
        </svg>
    );
}
function VouchIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="m12.75 15 3-3m0 0-3-3m3 3h-7.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
            />
        </svg>
    );
}
function ShareIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M7.217 10.907a2.25 2.25 0 1 0 0 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186 9.566-5.314m-9.566 7.5 9.566 5.314m0 0a2.25 2.25 0 1 0 3.935 2.186 2.25 2.25 0 0 0-3.935-2.186Zm0-12.814a2.25 2.25 0 1 0 3.933-2.185 2.25 2.25 0 0 0-3.933 2.185Z"
            />
        </svg>
    );
}
function CameraIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6.827 6.175A2.31 2.31 0 0 1 5.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 0 0 2.25 2.25h15A2.25 2.25 0 0 0 21.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 0 0-1.134-.175 2.31 2.31 0 0 1-1.64-1.055l-.822-1.316a2.192 2.192 0 0 0-1.736-1.039 48.774 48.774 0 0 0-5.232 0 2.192 2.192 0 0 0-1.736 1.039l-.821 1.316Z"
            />
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 12.75a4.5 4.5 0 1 1-9 0 4.5 4.5 0 0 1 9 0Z"
            />
        </svg>
    );
}
function AwardIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 18.75h-9m9 0a3 3 0 0 1 3 3h-15a3 3 0 0 1 3-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 0 1-.982-3.172M9.497 14.25a7.454 7.454 0 0 0 .981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 0 0 7.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.29 0 4.544.16 6.75.47v1.516M7.73 9.728a6.726 6.726 0 0 0 2.748 1.35m8.272-6.842V4.5c0 2.108-.966 3.99-2.48 5.228m2.48-5.492a46.32 46.32 0 0 1 2.916.52 6.003 6.003 0 0 1-5.395 4.972m0 0a6.726 6.726 0 0 1-2.749 1.35m0 0a6.772 6.772 0 0 1-3.044 0"
            />
        </svg>
    );
}
function UserIcon(props: any) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            {...props}
        >
            <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"
            />
        </svg>
    );
}
