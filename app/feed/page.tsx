"use client";

import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import {
    Camera,
    Globe,
    MapPin,
    ShieldCheck,
    Database,
    Link2,
    Share2,
    Clock,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    Dna,
    BookOpen,
    Palette,
    Rocket,
    HeartHandshake,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────
interface PostUser {
    handle: string | null;
    avatar_url: string | null;
    humanity_score: number;
    is_verified_human: boolean;
}

interface Post {
    id: string;
    user_id: string;
    title: string;
    caption: string | null;
    pillar: string;
    location_name: string | null;
    latitude: number | null;
    longitude: number | null;
    image_cid: string;
    proof_cid: string;
    image_url: string;
    proof_url: string;
    tx_hash: string | null;
    liveness_score: number | null;
    is_verified: boolean;
    vouch_count: number;
    captured_at: string;
    created_at: string;
    users: PostUser;
}

// ─────────────────────────────────────────────────────
// Pillar filter config
// ─────────────────────────────────────────────────────
const PILLAR_FILTERS = [
    { id: "all", label: "All", icon: Globe },
    { id: "identity", label: "Identity", icon: Dna },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "culture", label: "Culture", icon: Palette },
    { id: "environment", label: "Environment", icon: Globe },
    { id: "innovation", label: "Innovation", icon: Rocket },
    { id: "community", label: "Community", icon: HeartHandshake },
] as const;

const PILLAR_COLORS: Record<string, string> = {
    identity:
        "bg-purple-50 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400",
    knowledge:
        "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
    culture: "bg-pink-50 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400",
    environment:
        "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
    innovation:
        "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
    community:
        "bg-rose-50 text-rose-600 dark:bg-rose-900/30 dark:text-rose-400",
};

// ─────────────────────────────────────────────────────
// Helper: relative time
// ─────────────────────────────────────────────────────
function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
}

// ─────────────────────────────────────────────────────
// Post Card
// ─────────────────────────────────────────────────────
function PostCard({ post }: { post: Post }) {
    const [showProof, setShowProof] = useState(false);
    const [imageError, setImageError] = useState(false);
    const author = post.users;
    const pillarColor =
        PILLAR_COLORS[post.pillar] ??
        "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

    // Debug: log image URL on mount and when it changes
    useEffect(() => {
        if (!post.image_url) {
            console.warn(`[Feed] Post ${post.id} has no image_url`);
        } else {
            console.log(`[Feed] Post ${post.id} image_url: ${post.image_url}`);
        }
    }, [post.id, post.image_url]);

    return (
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Post Header */}
            <div className="p-4 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 shrink-0" />
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            @{author?.handle ?? "anonymous"}
                        </h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            {post.location_name && (
                                <>
                                    <MapPin className="w-3 h-3" />
                                    {post.location_name}
                                    <span className="mx-1">•</span>
                                </>
                            )}
                            <Clock className="w-3 h-3" />
                            {timeAgo(post.created_at)}
                        </p>
                    </div>
                </div>
                <span
                    className={cn(
                        "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                        pillarColor,
                    )}
                >
                    {post.pillar}
                </span>
            </div>

            {/* Title + Caption */}
            <div className="px-4 pt-3 pb-3">
                <h4 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    {post.title}
                </h4>
                {post.caption && (
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {post.caption}
                    </p>
                )}
            </div>

            {/* Image from IPFS */}
            <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {!imageError && post.image_url ? (
                    <Image
                        src={post.image_url}
                        alt={post.title}
                        fill
                        className="object-cover"
                        unoptimized
                        onError={() => {
                            console.error(
                                `[Feed] Image load failed for post ${post.id}:`,
                                post.image_url,
                            );
                            setImageError(true);
                        }}
                    />
                ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500 text-xs px-4 py-8">
                        {imageError ? (
                            <>
                                <p className="font-medium mb-2">
                                    Image failed to load
                                </p>
                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-600 break-all">
                                    {post.image_url || "No URL"}
                                </p>
                            </>
                        ) : (
                            <p>No image available</p>
                        )}
                    </div>
                )}
                {/* Liveness Badge */}
                {!imageError && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        {(post.liveness_score ?? 0) > 5
                            ? "Verified Live"
                            : "Captured"}
                    </div>
                )}
            </div>

            {/* Crypto Proof Toggle */}
            <button
                onClick={() => setShowProof(!showProof)}
                className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
            >
                <span className="flex items-center gap-1.5">
                    <Database className="h-3.5 w-3.5" />
                    Verification Proof
                </span>
                {showProof ? (
                    <ChevronUp className="h-3.5 w-3.5" />
                ) : (
                    <ChevronDown className="h-3.5 w-3.5" />
                )}
            </button>

            {showProof && (
                <div className="px-4 pb-3 space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
                    <div className="flex flex-wrap gap-2 rounded-lg bg-slate-50 p-3 dark:bg-slate-950/50">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Database className="h-3.5 w-3.5" /> IPFS:{" "}
                            <a
                                href={post.image_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline truncate max-w-35"
                            >
                                {post.image_cid.slice(0, 12)}...
                            </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Link2 className="h-3.5 w-3.5" />{" "}
                            <a
                                href={post.proof_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                            >
                                Proof
                                <ArrowUpRight className="w-3 h-3" />
                            </a>
                        </div>
                        {post.tx_hash && (
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                                <Link2 className="h-3.5 w-3.5" /> Tx:{" "}
                                <span className="font-mono">
                                    {post.tx_hash.slice(0, 10)}...
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3">
                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400 transition-colors">
                    <ArrowUpRight className="h-4 w-4" />
                    <span>Vouch ({post.vouch_count})</span>
                </button>
                <button className="flex items-center gap-2 text-sm font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors">
                    <Share2 className="h-4 w-4" /> Share
                </button>
            </div>
        </article>
    );
}

// ─────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────
function PostSkeleton() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-pulse">
            <div className="p-4 flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-slate-200 dark:bg-slate-700" />
                <div className="space-y-2 flex-1">
                    <div className="h-3 w-24 bg-slate-200 dark:bg-slate-700 rounded" />
                    <div className="h-2 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
                </div>
            </div>
            <div className="px-4 pb-3 space-y-2">
                <div className="h-4 w-48 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-full bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="aspect-4/3 w-full bg-slate-200 dark:bg-slate-700" />
            <div className="p-4">
                <div className="h-3 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Empty State
// ─────────────────────────────────────────────────────
function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Camera className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                No moments archived yet
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-xs">
                Be the first to capture a real human moment and add it to the
                permanent archive.
            </p>
            <Link
                href="/capture"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-linear-to-r from-indigo-600 to-cyan-500 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all"
            >
                <Camera className="w-4 h-4" />
                Open Camera
            </Link>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Feed Page
// ─────────────────────────────────────────────────────
export default function FeedPage() {
    const [activeFilter, setActiveFilter] = useState("all");

    const { data, isLoading } = useQuery({
        queryKey: ["feed", activeFilter],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeFilter !== "all") params.set("pillar", activeFilter);
            const res = await fetch(`/api/posts?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch feed");
            return res.json() as Promise<{ posts: Post[]; hasMore: boolean }>;
        },
    });

    const posts = data?.posts ?? [];

    return (
        <main className="flex-1 overflow-y-auto pb-20 mt-16">
            {/* Pillar Filter Tabs */}
            <div className="sticky top-0 z-30 w-full bg-white/95 dark:bg-slate-950/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800">
                <div className="flex overflow-x-auto no-scrollbar">
                    {PILLAR_FILTERS.map((f) => {
                        const Icon = f.icon;
                        const isActive = activeFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-4 py-3 text-xs font-semibold whitespace-nowrap transition-colors border-b-2",
                                    isActive
                                        ? "border-cyan-500 text-cyan-600 dark:text-cyan-400"
                                        : "border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300",
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {f.label}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-2xl flex flex-col gap-5 p-4 md:p-6">
                {isLoading ? (
                    <>
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </>
                ) : posts.length === 0 ? (
                    <EmptyState />
                ) : (
                    posts.map((post) => <PostCard key={post.id} post={post} />)
                )}
            </div>
        </main>
    );
}
