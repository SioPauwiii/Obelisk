import { Award } from "lucide-react";

export default function BadgesPage() {
    return (
        <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <section className="mx-auto max-w-2xl px-4 py-10 md:px-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-cyan-50 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400">
                        <Award className="h-7 w-7" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Badges are coming soon
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        SBT and achievement progression will appear here once
                        vouch thresholds are integrated.
                    </p>
                </div>
            </section>
        </main>
    );
}
