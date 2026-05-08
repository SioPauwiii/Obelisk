"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Image from "next/image";
import Link from "next/link";
import Lightbox from "@/components/UI/Lightbox";
import {
    ArrowUpRight,
    Compass,
    Filter,
    Globe,
    Search,
    Clock,
    ShieldCheck,
    Camera,
    Dna,
    BookOpen,
    Palette,
    Rocket,
    HeartHandshake,
    MapPin,
    X,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ExplorePostUser {
    handle: string | null;
    avatar_url: string | null;
    humanity_score: number;
    is_verified_human: boolean;
}

interface ExplorePost {
    id: string;
    user_id: string;
    title: string;
    caption: string | null;
    pillar: string;
    location_name: string | null;
    image_cid: string;
    proof_cid: string;
    image_url: string;
    proof_url: string;
    image_urls?: string[] | null;
    proof_urls?: string[] | null;
    tx_hash: string | null;
    vouch_count: number;
    created_at: string;
    users: ExplorePostUser;
}

const PILLARS = [
    { id: "all", label: "All", icon: Globe },
    { id: "identity", label: "Identity", icon: Dna },
    { id: "knowledge", label: "Knowledge", icon: BookOpen },
    { id: "culture", label: "Culture", icon: Palette },
    { id: "environment", label: "Environment", icon: Globe },
    { id: "innovation", label: "Innovation", icon: Rocket },
    { id: "community", label: "Community", icon: HeartHandshake },
] as const;

const PILLAR_STYLES: Record<string, string> = {
    identity:
        "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-300",
    knowledge:
        "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-300",
    culture: "bg-pink-50 text-pink-700 dark:bg-pink-500/10 dark:text-pink-300",
    environment:
        "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-300",
    innovation:
        "bg-orange-50 text-orange-700 dark:bg-orange-500/10 dark:text-orange-300",
    community:
        "bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-300",
};

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

function getMediaUrls(post: ExplorePost): string[] {
    return post.image_urls?.length
        ? post.image_urls
        : post.image_url
          ? [post.image_url]
          : [];
}

function getSafeTitle(post: ExplorePost): string {
    return post.title?.trim() || "Untitled moment";
}

export default function ExplorePage() {
    const [activePillar, setActivePillar] =
        useState<(typeof PILLARS)[number]["id"]>("all");
    const [search, setSearch] = useState("");
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const [lightboxImages, setLightboxImages] = useState<string[]>([]);
    const [lightboxIndex, setLightboxIndex] = useState(0);

    const { data, isLoading, isError, error } = useQuery({
        queryKey: ["explore-posts"],
        queryFn: async () => {
            const res = await fetch("/api/posts?limit=50");
            if (!res.ok) {
                const payload = await res.json().catch(() => null);
                const message = payload?.error ?? "Failed to load explore feed";
                throw new Error(message);
            }
            return res.json() as Promise<{ posts: ExplorePost[] }>;
        },
    });

    const posts = data?.posts ?? [];

    const normalizedSearch = search.trim().toLowerCase();

    const filteredPosts = useMemo(() => {
        return posts.filter((post) => {
            const matchesPillar =
                activePillar === "all" || post.pillar === activePillar;
            const haystack = [
                post.title,
                post.caption ?? "",
                post.location_name ?? "",
                post.users?.handle ?? "",
                post.image_cid,
                post.proof_cid,
                post.tx_hash ?? "",
            ]
                .join(" ")
                .toLowerCase();
            const matchesSearch =
                !normalizedSearch || haystack.includes(normalizedSearch);
            return matchesPillar && matchesSearch;
        });
    }, [posts, activePillar, normalizedSearch]);

    const pillarCounts = useMemo(() => {
        return PILLARS.reduce<Record<string, number>>((acc, pillar) => {
            if (pillar.id === "all") {
                acc[pillar.id] = posts.length;
            } else {
                acc[pillar.id] = posts.filter(
                    (post) => post.pillar === pillar.id,
                ).length;
            }
            return acc;
        }, {});
    }, [posts]);

    const trendingPosts = useMemo(
        () =>
            [...filteredPosts]
                .sort((a, b) => b.vouch_count - a.vouch_count)
                .slice(0, 8),
        [filteredPosts],
    );

    const recentPosts = useMemo(
        () =>
            [...filteredPosts].sort(
                (a, b) =>
                    new Date(b.created_at).getTime() -
                    new Date(a.created_at).getTime(),
            ),
        [filteredPosts],
    );

    const openLightbox = (images: string[], index = 0) => {
        if (!images.length) return;
        setLightboxImages(images);
        setLightboxIndex(index);
        setLightboxOpen(true);
    };

    const headline =
        activePillar === "all"
            ? "Discover what people are capturing"
            : `${PILLARS.find((pill) => pill.id === activePillar)?.label ?? "Explore"} moments`;

    const renderCard = (post: ExplorePost, featured = false) => {
        const mediaUrls = getMediaUrls(post);
        const primary = mediaUrls[0];
        return (
            <article
                key={post.id}
                className={cn(
                    "overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg dark:border-slate-800 dark:bg-slate-900",
                    featured && "md:col-span-2",
                )}
            >
                <div className="flex items-center justify-between gap-3 px-4 pt-4">
                    <div className="min-w-0">
                        <div className="flex items-center gap-2">
                            <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-cyan-500 text-[11px] font-bold text-white">
                                {(post.users?.handle ?? "?")
                                    .slice(0, 1)
                                    .toUpperCase()}
                            </span>
                            <div className="min-w-0">
                                <div className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                                    @{post.users?.handle ?? "anonymous"}
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                    <Clock className="h-3.5 w-3.5" />
                                    {timeAgo(post.created_at)}
                                </div>
                            </div>
                        </div>
                    </div>
                    <span
                        className={cn(
                            "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold capitalize",
                            PILLAR_STYLES[post.pillar] ??
                                "bg-slate-50 text-slate-600 dark:bg-slate-800 dark:text-slate-300",
                        )}
                    >
                        {post.pillar}
                    </span>
                </div>

                <button
                    type="button"
                    onClick={() => openLightbox(mediaUrls)}
                    className={cn(
                        "relative mt-4 block w-full overflow-hidden bg-slate-100 dark:bg-slate-800",
                        featured ? "aspect-16/10" : "aspect-square",
                    )}
                    aria-label={`Open ${getSafeTitle(post)} image`}
                >
                    {primary ? (
                        <Image
                            src={primary}
                            alt={getSafeTitle(post)}
                            fill
                            className="object-cover transition-transform duration-300 hover:scale-[1.02]"
                            unoptimized
                        />
                    ) : (
                        <div className="flex h-full items-center justify-center text-sm text-slate-500">
                            No image available
                        </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/65 via-black/10 to-transparent p-4 text-left text-white">
                        <h3 className="line-clamp-2 text-base font-semibold leading-tight">
                            {getSafeTitle(post)}
                        </h3>
                        {post.location_name && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-white/80">
                                <MapPin className="h-3.5 w-3.5" />
                                {post.location_name}
                            </div>
                        )}
                    </div>
                </button>

                <div className="space-y-3 px-4 py-4">
                    {post.caption && (
                        <p className="line-clamp-2 text-sm text-slate-600 dark:text-slate-300">
                            {post.caption}
                        </p>
                    )}

                    <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-4 w-4 text-emerald-500" />
                            {post.vouch_count} vouches
                        </div>
                        {post.tx_hash ? (
                            <a
                                href={`https://testnet.snowtrace.io/tx/${post.tx_hash}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 font-medium text-cyan-600 hover:text-cyan-500 dark:text-cyan-400"
                            >
                                On chain
                                <ArrowUpRight className="h-3.5 w-3.5" />
                            </a>
                        ) : (
                            <span>Archived</span>
                        )}
                    </div>
                </div>
            </article>
        );
    };

    if (isError) {
        const message =
            error instanceof Error ? error.message : "Unable to load explore";
        const isAuthError = message.toLowerCase().includes("not authenticated");

        return (
            <main className="flex-1 overflow-y-auto pb-20 pt-16">
                <section className="mx-auto flex min-h-[70vh] max-w-3xl items-center px-4 md:px-6">
                    <div className="w-full rounded-3xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-300">
                            <Compass className="h-7 w-7" />
                        </div>
                        <h1 className="mt-5 text-center text-2xl font-bold text-slate-900 dark:text-slate-100">
                            {isAuthError
                                ? "Sign in to explore"
                                : "Explore is unavailable"}
                        </h1>
                        <p className="mt-2 text-center text-sm text-slate-500 dark:text-slate-400">
                            {isAuthError
                                ? "You need an authenticated session to browse the discover feed."
                                : message}
                        </p>
                        <div className="mt-6 flex justify-center gap-3">
                            {isAuthError ? (
                                <Link
                                    href="/signin"
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    Go to sign in
                                </Link>
                            ) : (
                                <button
                                    type="button"
                                    onClick={() => window.location.reload()}
                                    className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-3 text-sm font-semibold text-white hover:bg-slate-800 dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white"
                                >
                                    Retry
                                </button>
                            )}
                        </div>
                    </div>
                </section>
            </main>
        );
    }

    return (
        <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <section className="border-b border-slate-200 bg-white px-4 py-4 dark:border-slate-800 dark:bg-slate-950 md:px-6">
                <div className="mx-auto max-w-6xl space-y-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
                                <Compass className="h-5 w-5" />
                            </div>
                            <div>
                                <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Explore
                                </h1>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Browse posts by pillar, handle, location, or
                                    IPFS.
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium dark:bg-slate-900">
                                {posts.length} total
                            </span>
                            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium dark:bg-slate-900">
                                {trendingPosts[0]?.vouch_count ?? 0} top vouches
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                        <label className="relative block w-full max-w-2xl">
                            <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search title, handle, location, IPFS, or tx hash..."
                                className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-10 text-sm text-slate-900 outline-none transition focus:border-cyan-500 focus:bg-white dark:border-slate-800 dark:bg-slate-900 dark:text-slate-100 dark:focus:bg-slate-950"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
                                    aria-label="Clear search"
                                >
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </label>

                        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                            <Filter className="h-4 w-4 shrink-0 text-slate-400" />
                            {PILLARS.map((pillar) => {
                                const Icon = pillar.icon;
                                const active = pillar.id === activePillar;
                                return (
                                    <button
                                        key={pillar.id}
                                        type="button"
                                        onClick={() =>
                                            setActivePillar(pillar.id)
                                        }
                                        className={cn(
                                            "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-xs font-semibold transition-colors whitespace-nowrap",
                                            active
                                                ? "border-cyan-500 bg-cyan-50 text-cyan-700 dark:border-cyan-400 dark:bg-cyan-500/10 dark:text-cyan-300"
                                                : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800",
                                        )}
                                    >
                                        <Icon className="h-3.5 w-3.5" />
                                        {pillar.label}
                                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-white/10 dark:text-slate-300">
                                            {pillarCounts[pillar.id] ?? 0}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </section>

            <section className="mx-auto max-w-6xl px-4 py-8 md:px-6 md:py-10">
                {isLoading ? (
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                        {Array.from({ length: 6 }).map((_, index) => (
                            <div
                                key={index}
                                className="h-96 animate-pulse rounded-3xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                            />
                        ))}
                    </div>
                ) : filteredPosts.length === 0 ? (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-slate-700 dark:bg-slate-900">
                        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                            <Filter className="h-7 w-7" />
                        </div>
                        <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-slate-100">
                            Nothing matches your filters
                        </h2>
                        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                            Try another pillar or clear the search box to see
                            more moments.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-10">
                        <div>
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <div>
                                    <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                        Trending now
                                    </h2>
                                    <p className="text-sm text-slate-500 dark:text-slate-400">
                                        Most vouched posts in your current view.
                                    </p>
                                </div>
                                <div className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                                    {filteredPosts.length} visible
                                </div>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {trendingPosts
                                    .slice(0, 3)
                                    .map((post) => renderCard(post, true))}
                            </div>
                        </div>

                        <div>
                            <div className="mb-4">
                                <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                                    Recent moments
                                </h2>
                                <p className="text-sm text-slate-500 dark:text-slate-400">
                                    Fresh posts from the archive.
                                </p>
                            </div>
                            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                                {recentPosts.map((post) => renderCard(post))}
                            </div>
                        </div>
                    </div>
                )}
            </section>

            {lightboxOpen && (
                <Lightbox
                    images={lightboxImages}
                    initialIndex={lightboxIndex}
                    onClose={() => setLightboxOpen(false)}
                />
            )}
        </main>
    );
}
