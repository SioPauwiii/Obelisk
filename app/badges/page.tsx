"use client";

import { useQuery } from "@tanstack/react-query";
import { Award, Lock, ExternalLink, ShieldCheck } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useState } from "react";

export default function BadgesPage() {
    const [activeTab, setActiveTab] = useState<"milestones" | "posts">("milestones");

    const { data, isLoading } = useQuery({
        queryKey: ["user_badges"],
        queryFn: async () => {
            const res = await fetch("/api/user/badges");
            if (!res.ok) throw new Error("Failed to fetch badges");
            return res.json();
        },
    });

    if (isLoading) {
        return (
            <main className="flex-1 overflow-y-auto pb-20 pt-16 flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <div className="h-16 w-16 bg-slate-200 dark:bg-slate-800 rounded-full mb-4"></div>
                    <div className="h-4 w-32 bg-slate-200 dark:bg-slate-800 rounded"></div>
                </div>
            </main>
        );
    }

    const { stats, milestones, post_sbts } = data || {};
    
    // Find the highest unlocked level
    const unlockedMilestones = milestones?.filter((m: any) => m.is_unlocked) || [];
    const highestLevel = unlockedMilestones.length > 0 
        ? unlockedMilestones[unlockedMilestones.length - 1] 
        : null;

    // Next unlock target
    const nextMilestone = milestones?.find((m: any) => !m.is_unlocked);
    const progressPercent = nextMilestone 
        ? Math.min(100, ((stats?.total_vouches || 0) / nextMilestone.required_vouches) * 100)
        : 100;

    return (
        <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <section className="mx-auto max-w-4xl px-4 py-8 md:px-6">
                
                {/* Hero Header */}
                <div className="mb-8 rounded-3xl bg-linear-to-br from-indigo-900 to-slate-900 p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 -mt-10 -mr-10 opacity-10">
                        <Award className="w-64 h-64" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
                        <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shadow-inner">
                            {highestLevel ? (
                                <span className="text-4xl font-black bg-clip-text text-transparent bg-linear-to-r from-cyan-400 to-indigo-400">
                                    L{highestLevel.attributes.find((a:any)=>a.trait_type==="Level")?.value}
                                </span>
                            ) : (
                                <Award className="h-12 w-12 text-cyan-400" />
                            )}
                        </div>
                        <div className="text-center md:text-left flex-1">
                            <h1 className="text-3xl font-bold tracking-tight">
                                {highestLevel ? highestLevel.name : "Novice Explorer"}
                            </h1>
                            <p className="mt-2 text-indigo-200 text-sm max-w-md">
                                {highestLevel 
                                    ? highestLevel.description 
                                    : "Start capturing moments and receiving vouches to unlock your first milestone badge."}
                            </p>
                            
                            {/* Progress to next level */}
                            {nextMilestone && (
                                <div className="mt-5">
                                    <div className="flex justify-between text-xs font-medium text-indigo-300 mb-1.5">
                                        <span>Progress to {nextMilestone.name}</span>
                                        <span>{stats?.total_vouches || 0} / {nextMilestone.required_vouches} vouches</span>
                                    </div>
                                    <div className="h-2 w-full bg-white/10 rounded-full overflow-hidden">
                                        <div 
                                            className="h-full bg-linear-to-r from-cyan-400 to-indigo-500 rounded-full transition-all duration-1000 ease-out"
                                            style={{ width: `${progressPercent}%` }}
                                        ></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-4 border-b border-slate-200 dark:border-slate-800 mb-6">
                    <button 
                        onClick={() => setActiveTab("milestones")}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-colors border-b-2 px-2",
                            activeTab === "milestones" 
                                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" 
                                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        Milestone Levels
                    </button>
                    <button 
                        onClick={() => setActiveTab("posts")}
                        className={cn(
                            "pb-3 text-sm font-semibold transition-colors border-b-2 px-2",
                            activeTab === "posts" 
                                ? "border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400" 
                                : "border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200"
                        )}
                    >
                        Post Archives ({post_sbts?.length || 0})
                    </button>
                </div>

                {/* Tab Content: Milestones */}
                {activeTab === "milestones" && (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {milestones?.slice(0, 20).map((milestone: any, idx: number) => {
                            const isUnlocked = milestone.is_unlocked;
                            const levelNum = milestone.attributes.find((a:any)=>a.trait_type==="Level")?.value;
                            
                            return (
                                <div 
                                    key={idx}
                                    className={cn(
                                        "relative rounded-2xl border p-5 flex flex-col items-center text-center transition-all duration-300",
                                        isUnlocked 
                                            ? "border-cyan-200 bg-white shadow-lg shadow-cyan-100/50 dark:border-cyan-900/50 dark:bg-slate-900 dark:shadow-cyan-900/20" 
                                            : "border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-900/50 opacity-70 grayscale"
                                    )}
                                >
                                    {!isUnlocked && (
                                        <div className="absolute top-3 right-3 text-slate-400">
                                            <Lock className="w-4 h-4" />
                                        </div>
                                    )}
                                    
                                    <div className={cn(
                                        "w-16 h-16 rounded-full flex items-center justify-center mb-3 text-xl font-bold border-2",
                                        isUnlocked
                                            ? "bg-linear-to-br from-cyan-100 to-indigo-100 border-cyan-300 text-indigo-700 dark:from-cyan-900/40 dark:to-indigo-900/40 dark:border-cyan-700 dark:text-cyan-300 shadow-inner"
                                            : "bg-slate-200 border-slate-300 text-slate-400 dark:bg-slate-800 dark:border-slate-700"
                                    )}>
                                        L{levelNum}
                                    </div>
                                    
                                    <h3 className={cn(
                                        "font-bold text-sm",
                                        isUnlocked ? "text-slate-900 dark:text-white" : "text-slate-500 dark:text-slate-400"
                                    )}>
                                        {milestone.name}
                                    </h3>
                                    
                                    <p className="mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                                        {milestone.required_vouches} Vouches Required
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* Tab Content: Posts */}
                {activeTab === "posts" && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {post_sbts?.length === 0 ? (
                            <div className="col-span-full py-12 text-center text-slate-500">
                                You haven't earned any Post SBTs yet. Create a post and get vouched!
                            </div>
                        ) : (
                            post_sbts?.map((post: any) => (
                                <div key={post.id} className="group relative rounded-2xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                                    <div className="aspect-square relative bg-slate-100 dark:bg-slate-800">
                                        <Image
                                            src={post.image_url}
                                            alt={post.title}
                                            fill
                                            className="object-cover"
                                        />
                                        <div className="absolute inset-0 bg-linear-to-t from-black/80 via-black/20 to-transparent opacity-80" />
                                        
                                        <div className="absolute bottom-3 left-3 right-3 text-white">
                                            <span className="text-[10px] uppercase tracking-wider font-semibold text-cyan-300 mb-1 block">
                                                {post.pillar}
                                            </span>
                                            <h3 className="font-semibold text-sm line-clamp-1">{post.title}</h3>
                                        </div>
                                    </div>
                                    
                                    <div className="p-3 bg-slate-50 dark:bg-slate-950/50 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-medium">
                                            <ShieldCheck className="w-4 h-4" />
                                            Token #{post.sbt_token_id}
                                        </div>
                                        <a 
                                            href={`https://testnet.snowtrace.io/tx/${post.tx_hash}`}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-slate-400 hover:text-indigo-600 transition-colors"
                                            title="View on Snowtrace"
                                        >
                                            <ExternalLink className="w-4 h-4" />
                                        </a>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                )}
                
            </section>
        </main>
    );
}
