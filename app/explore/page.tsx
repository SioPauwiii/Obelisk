import { Compass } from "lucide-react";

export default function ExplorePage() {
    return (
        <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <section className="mx-auto max-w-2xl px-4 py-10 md:px-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400">
                        <Compass className="h-7 w-7" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Explore is coming soon
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        This placeholder route keeps navigation stable while
                        discovery tools are under active development.
                    </p>
                </div>
            </section>
        </main>
    );
}
