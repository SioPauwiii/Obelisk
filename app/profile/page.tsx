"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
    MapPin,
    Clock,
    ShieldCheck,
    Database,
    Link2,
    ChevronDown,
    ChevronUp,
    Globe,
    Dna,
    BookOpen,
    Palette,
    Rocket,
    HeartHandshake,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import Lightbox from "@/components/UI/Lightbox";

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
    image_cids?: string[] | null;
    proof_cids?: string[] | null;
    image_urls?: string[] | null;
    proof_urls?: string[] | null;
    tx_hash: string | null;
    liveness_score: number | null;
    is_verified: boolean;
    vouch_count: number;
    captured_at: string;
    created_at: string;
    users: PostUser;
    has_vouched?: boolean;
}

// ─────────────────────────────────────────────────────
// Pillar config
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
// Profile Card Component
// ─────────────────────────────────────────────────────
function ProfileCard({ user, stats }: { user: any; stats: any }) {
    return (
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-sm dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 overflow-hidden">
            <div className="p-6 md:p-8">
                <div className="flex flex-col md:flex-row gap-6 items-start justify-between">
                    {/* Left: Avatar + Info */}
                    <div className="flex gap-4 flex-1">
                        <div className="h-20 w-20 rounded-2xl bg-linear-to-br from-indigo-500 to-cyan-500 shrink-0 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 truncate">
                                    @{user?.handle ?? "anonymous"}
                                </h1>
                                {user?.is_verified_human && (
                                    <ShieldCheck className="h-5 w-5 text-emerald-500 flex-shrink-0" />
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 flex-wrap">
                                <span className="font-semibold text-slate-700 dark:text-slate-300">
                                    Humanity{" "}
                                    {user?.humanity_score.toFixed(1) ?? 0}%
                                </span>
                                <span>•</span>
                                <span>
                                    {stats.totalPosts}{" "}
                                    {stats.totalPosts === 1 ? "post" : "posts"}
                                </span>
                            </div>
                            {user?.full_name && (
                                <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 truncate">
                                    {user.full_name}
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Right: Stats */}
                    <div className="flex gap-6 w-full md:w-auto md:flex-col">
                        <div className="text-center flex-1 md:flex-none">
                            <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                                {stats.totalVouches}
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                Vouches Received
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Profile Post Card
// ─────────────────────────────────────────────────────
function ProfilePostCard({ post }: { post: Post }) {
    const [showProof, setShowProof] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [fullPostOpen, setFullPostOpen] = useState(false);

    const mediaUrls = useMemo(
        () =>
            post.image_urls?.length && post.image_urls.length > 0
                ? post.image_urls
                : post.image_url
                  ? [post.image_url]
                  : [],
        [post.image_urls, post.image_url],
    );

    const pillarColor =
        PILLAR_COLORS[post.pillar] ??
        "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";

    const isLongTitle = post.title.length > 90;
    const isLongCaption = (post.caption?.length ?? 0) > 180;
    const canExpandText = isLongTitle || isLongCaption;

    return (
        <>
            <article className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
                {/* Post Header */}
                <div className="p-4 pb-0 flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 text-[11px] font-bold text-white flex-shrink-0">
                            {(post.users?.handle ?? "?")
                                .slice(0, 1)
                                .toUpperCase()}
                        </span>
                        <div className="flex-1 min-w-0">
                            <h3
                                className="text-sm font-bold text-slate-900 dark:text-slate-100 truncate"
                                title={post.title}
                            >
                                {post.title}
                            </h3>
                            <div className="text-xs text-slate-500 dark:text-slate-400 flex gap-2 flex-wrap mt-1">
                                {post.location_name && (
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3" />
                                        {post.location_name}
                                    </div>
                                )}
                                <div className="flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {timeAgo(post.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <span
                        className={cn(
                            "rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize flex-shrink-0 ml-2",
                            pillarColor,
                        )}
                    >
                        {post.pillar}
                    </span>
                </div>

                {/* Caption */}
                {post.caption && (
                    <div className="px-4 pt-3 pb-2">
                        <p
                            className="text-sm text-slate-600 dark:text-slate-300 wrap-anywhere"
                            style={{
                                display: "-webkit-box",
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: "vertical",
                                overflow: "hidden",
                            }}
                        >
                            {post.caption}
                        </p>
                        {canExpandText && (
                            <button
                                type="button"
                                onClick={() => setFullPostOpen(true)}
                                className="mt-1 text-xs font-semibold text-cyan-600 hover:text-cyan-500 dark:text-cyan-400 dark:hover:text-cyan-300"
                            >
                                See more
                            </button>
                        )}
                    </div>
                )}

                {/* Image */}
                <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                    {!imageError && mediaUrls[0] ? (
                        <button
                            type="button"
                            onClick={() => setLightboxOpen(true)}
                            className="absolute inset-0 block w-full h-full cursor-zoom-in"
                        >
                            <Image
                                src={mediaUrls[0]}
                                alt={post.title}
                                fill
                                className="object-cover"
                                unoptimized
                                onError={() => setImageError(true)}
                            />
                        </button>
                    ) : (
                        <p className="text-slate-400 text-xs">No image</p>
                    )}
                </div>

                {lightboxOpen && (
                    <Lightbox
                        images={mediaUrls}
                        initialIndex={0}
                        onClose={() => setLightboxOpen(false)}
                    />
                )}

                {/* Footer */}
                <button
                    onClick={() => setShowProof(!showProof)}
                    className="w-full flex items-center justify-between px-4 py-2.5 text-xs text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors border-t border-slate-100 dark:border-slate-800"
                >
                    <span className="flex items-center gap-1.5">
                        <Database className="h-3.5 w-3.5" />
                        {post.vouch_count} Vouches
                    </span>
                    {showProof ? (
                        <ChevronUp className="h-3.5 w-3.5" />
                    ) : (
                        <ChevronDown className="h-3.5 w-3.5" />
                    )}
                </button>

                {showProof && (
                    <div className="px-4 pb-3 space-y-2 bg-slate-50 dark:bg-slate-950/50">
                        <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                            {post.image_cid && (
                                <div className="flex items-center gap-1.5">
                                    <Database className="h-3.5 w-3.5" />
                                    <a
                                        href={mediaUrls[0]}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline truncate max-w-35"
                                    >
                                        {post.image_cid.slice(0, 12)}...
                                    </a>
                                </div>
                            )}
                            {post.tx_hash && (
                                <div className="flex items-center gap-1.5">
                                    <Link2 className="h-3.5 w-3.5" />
                                    <a
                                        href={`https://testnet.snowtrace.io/tx/${post.tx_hash}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1"
                                    >
                                        Tx {post.tx_hash.slice(0, 8)}...
                                    </a>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </article>

            {fullPostOpen && (
                <div className="fixed inset-0 z-50 bg-black/65">
                    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Full Post
                            </p>
                            <button
                                type="button"
                                onClick={() => setFullPostOpen(false)}
                                className="rounded-md p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                aria-label="Close full post"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        </div>

                        <div className="p-4 md:p-6 space-y-4">
                            <div>
                                <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-100 wrap-anywhere">
                                    {post.title}
                                </h3>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                                    {timeAgo(post.created_at)}
                                </p>
                            </div>

                            {post.caption && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-slate-700 dark:text-slate-300">
                                    {post.caption}
                                </p>
                            )}

                            {mediaUrls[0] && (
                                <button
                                    type="button"
                                    onClick={() => setLightboxOpen(true)}
                                    className="relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <Image
                                        src={mediaUrls[0]}
                                        alt={post.title}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                    />
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// ─────────────────────────────────────────────────────
// Loading Skeleton
// ─────────────────────────────────────────────────────
function PostSkeleton() {
    return (
        <div className="rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden animate-pulse">
            <div className="p-4 space-y-2">
                <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
                <div className="h-3 w-40 bg-slate-200 dark:bg-slate-700 rounded" />
            </div>
            <div className="aspect-4/3 w-full bg-slate-200 dark:bg-slate-700" />
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Main Profile Page
// ─────────────────────────────────────────────────────
export default function ProfilePage() {
    const { user, isLoading } = useAuth();
    const [activeFilter, setActiveFilter] = useState("all");

    const { data } = useQuery({
        queryKey: ["userPosts", user?.id, activeFilter],
        queryFn: async () => {
            if (!user?.id) throw new Error("Not authenticated");

            const params = new URLSearchParams();
            params.set("user_id", user.id);
            if (activeFilter !== "all") params.set("pillar", activeFilter);

            const res = await fetch(`/api/posts?${params.toString()}`);
            if (!res.ok) throw new Error("Failed to fetch posts");
            return res.json() as Promise<{ posts: Post[] }>;
        },
        enabled: !!user?.id,
    });

    const posts = data?.posts ?? [];

    // Calculate stats
    const stats = {
        totalPosts: posts.length,
        totalVouches: posts.reduce((sum, p) => sum + p.vouch_count, 0),
    };

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto pb-20 mt-16">
                <div className="mx-auto max-w-4xl px-4 md:px-6 py-6">
                    <div className="animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 h-32" />
                </div>
            </main>
        );
    }

    if (!user) {
        return (
            <main className="flex-1 overflow-y-auto pb-20 mt-16">
                <div className="mx-auto max-w-4xl px-4 md:px-6 py-6">
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                            Please sign in to view your profile
                        </h1>
                        <Link
                            href="/signin"
                            className="mt-4 inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-medium"
                        >
                            Sign In
                        </Link>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto pb-20 mt-16">
            <div className="mx-auto max-w-4xl px-4 md:px-6 py-6 space-y-6">
                {/* Profile Header */}
                <ProfileCard user={user} stats={stats} />

                {/* Pillar Filters */}
                <div className="flex overflow-x-auto no-scrollbar gap-2">
                    {PILLAR_FILTERS.map((f) => {
                        const Icon = f.icon;
                        const isActive = activeFilter === f.id;
                        return (
                            <button
                                key={f.id}
                                onClick={() => setActiveFilter(f.id)}
                                className={cn(
                                    "flex items-center gap-1.5 px-3 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                                    isActive
                                        ? "bg-indigo-600 text-white shadow-md"
                                        : "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700",
                                )}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {f.label}
                            </button>
                        );
                    })}
                </div>

                {/* Posts Grid */}
                {isLoading ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </div>
                ) : posts.length === 0 ? (
                    <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <p className="text-slate-600 dark:text-slate-400">
                            {activeFilter !== "all"
                                ? `No posts in ${activeFilter}`
                                : "No posts yet. Start capturing moments!"}
                        </p>
                        <Link
                            href="/capture"
                            className="mt-4 inline-block px-4 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 font-medium text-sm"
                        >
                            Create First Post
                        </Link>
                    </div>
                ) : (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                        {posts.map((post) => (
                            <ProfilePostCard
                                key={`${post.id}:${post.image_cid}`}
                                post={post}
                            />
                        ))}
                    </div>
                )}
            </div>
        </main>
    );
}
