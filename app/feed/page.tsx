"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import { useAuth } from "@/hooks/useAuth";
import {
    Camera,
    Globe,
    Search,
    MapPin,
    ShieldCheck,
    Database,
    Link2,
    Clock,
    ArrowUpRight,
    ChevronDown,
    ChevronUp,
    Dna,
    BookOpen,
    X,
    Palette,
    Rocket,
    HeartHandshake,
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
function PostCard({
    post,
    currentUserId,
}: {
    post: Post;
    currentUserId: string | null;
}) {
    const [showProof, setShowProof] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [vouchCount, setVouchCount] = useState(post.vouch_count);
    const [hasVouched, setHasVouched] = useState(Boolean(post.has_vouched));
    const [isVouching, setIsVouching] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [fullPostOpen, setFullPostOpen] = useState(false);
    const author = post.users;
    const mediaUrls = useMemo(
        () =>
            post.image_urls?.length && post.image_urls.length > 0
                ? post.image_urls
                : post.image_url
                  ? [post.image_url]
                  : [],
        [post.image_urls, post.image_url],
    );
    const proofUrls = useMemo(
        () =>
            post.proof_urls?.length && post.proof_urls.length > 0
                ? post.proof_urls
                : post.proof_url
                  ? [post.proof_url]
                  : [],
        [post.proof_urls, post.proof_url],
    );
    const pillarColor =
        PILLAR_COLORS[post.pillar] ??
        "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400";
    const isLongTitle = post.title.length > 90;
    const isLongCaption = (post.caption?.length ?? 0) > 180;
    const canExpandText = isLongTitle || isLongCaption;
    const isOwnPost = currentUserId === post.user_id;

    // Debug: log image URL on mount and when it changes
    useEffect(() => {
        if (!mediaUrls.length) {
            console.warn(`[Feed] Post ${post.id} has no image_urls`);
        } else {
            console.log(`[Feed] Post ${post.id} image_urls:`, mediaUrls);
        }
    }, [post.id, mediaUrls]);

    const handleVouch = async () => {
        if (isVouching || hasVouched) return;
        setIsVouching(true);

        // Optimistic update
        setVouchCount((prev) => prev + 1);
        setHasVouched(true);

        try {
            const res = await fetch(`/api/posts/${post.id}/vouch`, {
                method: "POST",
            });
            const data = await res.json();

            if (!res.ok) {
                // Revert on error
                setVouchCount((prev) => prev - 1);
                setHasVouched(false);
                alert(data.error ?? "Failed to vouch");
            }
        } catch {
            // Revert on network error
            setVouchCount((prev) => prev - 1);
            setHasVouched(false);
            alert("Network error — please try again");
        } finally {
            setIsVouching(false);
        }
    };

    return (
        <article className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
            {/* Post Header */}
            <div className="p-4 pb-0 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 text-[13px] font-bold text-white flex-shrink-0">
                        {(author?.handle ?? "?").slice(0, 1).toUpperCase()}
                    </span>
                    <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                            @{author?.handle ?? "anonymous"}
                        </h3>
                        <div className="max-sm:flex-col text-xs text-slate-500 dark:text-slate-400 flex gap-1">
                            {post.location_name && (
                                <div className="flex flex-row gap-1 items-center">
                                    <MapPin className="w-3 h-3" />
                                    {post.location_name}
                                    <span className="mx-1 hidden md:flex">
                                        •
                                    </span>
                                </div>
                            )}
                            <div className="flex flex-row gap-1 items-center">
                                <Clock className="w-3 h-3" />
                                {timeAgo(post.created_at)}
                            </div>
                        </div>
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
                <h4
                    className={cn(
                        "text-sm font-semibold text-slate-900 dark:text-slate-100",
                        "truncate",
                    )}
                    title={post.title}
                >
                    {post.title}
                </h4>
                {post.caption && (
                    <p
                        className="mt-1 text-sm text-slate-600 dark:text-slate-300 wrap-anywhere"
                        style={{
                            display: "-webkit-box",
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                        }}
                    >
                        {post.caption}
                    </p>
                )}
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

            {/* Image from IPFS */}
            <div className="relative aspect-4/3 w-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                {!imageError && mediaUrls[activeImageIndex] ? (
                    <button
                        type="button"
                        onClick={() => setLightboxOpen(true)}
                        className="absolute inset-0 block w-full h-full cursor-zoom-in"
                        aria-label="Open image"
                    >
                        <Image
                            src={mediaUrls[activeImageIndex]}
                            alt={`${post.title} ${activeImageIndex + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                            onError={() => {
                                console.error(
                                    `[Feed] Image load failed for post ${post.id}:`,
                                    mediaUrls[activeImageIndex],
                                );
                                setImageError(true);
                            }}
                        />
                    </button>
                ) : (
                    <div className="text-center text-slate-400 dark:text-slate-500 text-xs px-4 py-8">
                        {imageError ? (
                            <>
                                <p className="font-medium mb-2">
                                    Image failed to load
                                </p>
                                <p className="text-[11px] font-mono text-slate-500 dark:text-slate-600 break-all">
                                    {mediaUrls[activeImageIndex] || "No URL"}
                                </p>
                            </>
                        ) : (
                            <p>No image available</p>
                        )}
                    </div>
                )}
                {mediaUrls.length > 1 && (
                    <div className="absolute bottom-3 left-3 flex flex-wrap gap-2 max-w-[calc(100%-1.5rem)]">
                        {mediaUrls.map((src, index) => (
                            <button
                                key={`${post.id}-${src}`}
                                type="button"
                                onClick={() => {
                                    setActiveImageIndex(index);
                                    setImageError(false);
                                }}
                                className={cn(
                                    "relative h-10 w-10 overflow-hidden rounded-lg border transition-all",
                                    index === activeImageIndex
                                        ? "border-emerald-400 ring-2 ring-emerald-400/30"
                                        : "border-white/20 opacity-80 hover:opacity-100",
                                )}
                            >
                                <Image
                                    src={src}
                                    alt={`Thumbnail ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                />
                            </button>
                        ))}
                    </div>
                )}
                {/* Liveness Badge */}
                {!imageError && (
                    <div className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-black/60 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm">
                        <ShieldCheck className="h-3 w-3 text-emerald-400" />
                        {(post.liveness_score ?? 0) > 5
                            ? "Verified Live"
                            : "Captured"}
                    </div>
                )}
                {/* SBT Badge */}
                {post.tx_hash && (
                    <a
                        href={`https://testnet.snowtrace.io/tx/${post.tx_hash}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-indigo-600/90 px-2.5 py-1 text-[10px] font-medium text-white backdrop-blur-sm hover:bg-indigo-500 transition-colors"
                    >
                        <ShieldCheck className="h-3 w-3" />
                        Archived On-Chain
                    </a>
                )}
            </div>

            {lightboxOpen && (
                <Lightbox
                    images={mediaUrls}
                    initialIndex={activeImageIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}

            {fullPostOpen && (
                <div className="fixed inset-0 z-50 bg-black/65 ">
                    <div className="mx-auto h-full w-full max-w-3xl overflow-y-auto border border-slate-200 bg-white shadow-2xl dark:border-slate-700 dark:bg-slate-900">
                        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-slate-200 bg-white/95 px-4 py-3 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
                            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                                Posted by @{author?.handle ?? "anonymous"}
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
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="h-10 w-10 rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 shrink-0" />
                                    <span className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                        @{author?.handle ?? "anonymous"}
                                    </span>
                                    <span className="text-xs text-slate-500 dark:text-slate-400">
                                        {timeAgo(post.created_at)}
                                    </span>
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

                            <h3 className="text-lg font-bold leading-snug text-slate-900 dark:text-slate-100 wrap-anywhere">
                                {post.title}
                            </h3>

                            {post.caption && (
                                <p className="text-sm leading-relaxed whitespace-pre-wrap wrap-anywhere text-slate-700 dark:text-slate-300">
                                    {post.caption}
                                </p>
                            )}

                            {mediaUrls[activeImageIndex] && (
                                <button
                                    type="button"
                                    onClick={() => setLightboxOpen(true)}
                                    className="relative block aspect-4/3 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800"
                                >
                                    <Image
                                        src={mediaUrls[activeImageIndex]}
                                        alt={`${post.title} preview`}
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
                                href={mediaUrls[activeImageIndex]}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline truncate max-w-35"
                            >
                                {post.image_cids?.[activeImageIndex]?.slice(
                                    0,
                                    12,
                                ) || "No CID"}
                                ...
                            </a>
                        </div>
                        <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                            <Link2 className="h-3.5 w-3.5" />{" "}
                            <a
                                href={proofUrls[activeImageIndex]}
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
                                <a
                                    href={`https://testnet.snowtrace.io/tx/${post.tx_hash}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-mono text-cyan-600 dark:text-cyan-400 hover:underline"
                                >
                                    {post.tx_hash.slice(0, 10)}...
                                </a>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-800 px-4 py-3">
                {isOwnPost ? (
                    <span className="flex items-center gap-2 text-sm font-medium text-slate-500 dark:text-slate-400">
                        <ArrowUpRight className="h-4 w-4 text-slate-400 dark:text-slate-600" />
                        <span>Vouch ({vouchCount})</span>
                    </span>
                ) : (
                    <button
                        onClick={handleVouch}
                        disabled={isVouching || hasVouched}
                        className={cn(
                            "flex items-center gap-2 text-sm font-medium transition-colors",
                            hasVouched
                                ? "text-indigo-600 dark:text-indigo-400 cursor-not-allowed"
                                : "text-slate-500 hover:text-indigo-600 dark:text-slate-400 dark:hover:text-indigo-400",
                            isVouching && "opacity-50 cursor-wait",
                        )}
                    >
                        <ArrowUpRight
                            className={cn(
                                "h-4 w-4",
                                hasVouched &&
                                    "text-indigo-600 dark:text-indigo-400",
                            )}
                        />
                        <span>
                            {hasVouched ? "Vouched" : "Vouch"} ({vouchCount})
                        </span>
                    </button>
                )}
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

function NoSearchResults({ query }: { query: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-6">
                <Search className="w-10 h-10 text-slate-400 dark:text-slate-500" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                No matching posts found
            </h3>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400 max-w-md">
                Nothing matched &quot;{query}&quot;. Try title, handle, IPFS
                CID, location, or transaction hash.
            </p>
        </div>
    );
}

// ─────────────────────────────────────────────────────
// Feed Page
// ─────────────────────────────────────────────────────
export default function FeedPage() {
    const { user } = useAuth();
    const [activeFilter, setActiveFilter] = useState("all");
    const [searchInput, setSearchInput] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setDebouncedSearch(searchInput.trim());
        }, 250);
        return () => window.clearTimeout(timer);
    }, [searchInput]);

    const { data, isLoading } = useQuery({
        queryKey: ["feed", activeFilter, debouncedSearch],
        queryFn: async () => {
            const params = new URLSearchParams();
            if (activeFilter !== "all") params.set("pillar", activeFilter);
            if (debouncedSearch) params.set("q", debouncedSearch);
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
            <div className="mx-auto w-full max-w-7xl px-4 md:px-6 py-6">
                {isLoading ? (
                    <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                        <PostSkeleton />
                    </div>
                ) : posts.length === 0 ? (
                    debouncedSearch ? (
                        <NoSearchResults query={debouncedSearch} />
                    ) : (
                        <EmptyState />
                    )
                ) : (
                    <div className="space-y-8">
                        {/* Featured Post */}
                        {posts[0] && (
                            <div className="rounded-3xl border border-slate-200 bg-linear-to-br from-white to-slate-50 shadow-md dark:border-slate-800 dark:from-slate-900 dark:to-slate-950 overflow-hidden hover:shadow-lg transition-shadow">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6">
                                    {/* Featured Image */}
                                    <div className="flex flex-col gap-2 order-2 md:order-1">
                                        <div className="relative aspect-square rounded-2xl overflow-hidden bg-slate-100 dark:bg-slate-800 group">
                                            {posts[0].image_urls?.[0] && (
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        // This would need state management, simplified for now
                                                    }}
                                                    className="absolute inset-0 block w-full h-full cursor-zoom-in"
                                                >
                                                    <Image
                                                        src={
                                                            posts[0]
                                                                .image_urls[0]
                                                        }
                                                        alt={posts[0].title}
                                                        fill
                                                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                                                        unoptimized
                                                    />
                                                </button>
                                            )}
                                        </div>
                                        <div className="flex gap-1 flex-wrap">
                                            {posts[0].image_urls
                                                ?.slice(0, 3)
                                                .map((url, idx) => (
                                                    <div
                                                        key={`featured-thumb-${idx}`}
                                                        className="relative h-16 w-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 flex-shrink-0"
                                                    >
                                                        <Image
                                                            src={url}
                                                            alt={`${posts[0].title} ${idx + 1}`}
                                                            fill
                                                            className="object-cover"
                                                            unoptimized
                                                        />
                                                    </div>
                                                ))}
                                            {posts[0].image_urls &&
                                                posts[0].image_urls.length >
                                                    3 && (
                                                    <div className="h-16 w-16 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-sm font-semibold text-slate-600 dark:text-slate-400 flex-shrink-0 border border-slate-200 dark:border-slate-700">
                                                        +
                                                        {posts[0].image_urls
                                                            .length - 3}
                                                    </div>
                                                )}
                                        </div>
                                    </div>

                                    {/* Featured Content */}
                                    <div className="flex flex-col justify-between order-1 md:order-2">
                                        <div className="space-y-4">
                                            <div className="flex items-start justify-between gap-4">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 text-[11px] font-bold text-white">
                                                            {(
                                                                posts[0].users
                                                                    ?.handle ??
                                                                "?"
                                                            )
                                                                .slice(0, 1)
                                                                .toUpperCase()}
                                                        </span>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900 dark:text-slate-100">
                                                                @
                                                                {posts[0].users
                                                                    .handle ??
                                                                    "anonymous"}
                                                            </p>
                                                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                                                {timeAgo(
                                                                    posts[0]
                                                                        .created_at,
                                                                )}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <span
                                                    className={cn(
                                                        "rounded-full px-3 py-1 text-xs font-semibold capitalize whitespace-nowrap",
                                                        PILLAR_COLORS[
                                                            posts[0].pillar
                                                        ] ??
                                                            "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-400",
                                                    )}
                                                >
                                                    {posts[0].pillar}
                                                </span>
                                            </div>

                                            <div>
                                                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-slate-100 leading-tight mb-3 wrap-anywhere">
                                                    {posts[0].title}
                                                </h2>
                                                {posts[0].caption && (
                                                    <p className="text-sm text-slate-600 dark:text-slate-300 line-clamp-3 wrap-anywhere">
                                                        {posts[0].caption}
                                                    </p>
                                                )}
                                            </div>

                                            {posts[0].location_name && (
                                                <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
                                                    <MapPin className="h-4 w-4 flex-shrink-0" />
                                                    {posts[0].location_name}
                                                </div>
                                            )}
                                        </div>

                                        <div className="flex items-center justify-between pt-4 border-t border-slate-200 dark:border-slate-800">
                                            <div className="flex items-center gap-3 text-sm">
                                                {posts[0].tx_hash && (
                                                    <a
                                                        href={`https://testnet.snowtrace.io/tx/${posts[0].tx_hash}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="flex items-center gap-1.5 text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300 font-semibold"
                                                    >
                                                        <ShieldCheck className="h-4 w-4" />
                                                        On-Chain
                                                    </a>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <span className="text-sm font-semibold text-slate-600 dark:text-slate-400">
                                                    <ArrowUpRight className="h-4 w-4 inline-block mr-1 text-indigo-600 dark:text-indigo-400" />
                                                    {posts[0].vouch_count}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Grid of Remaining Posts */}
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100 mb-4">
                                Recent
                            </h3>
                            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                                {posts.map((post) => (
                                    <PostCard
                                        key={`${post.id}:${post.image_cid}:${post.proof_cid}:${post.has_vouched ? 1 : 0}`}
                                        post={post}
                                        currentUserId={user?.id ?? null}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
}
