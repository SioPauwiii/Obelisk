import { User } from "lucide-react";

export default function ProfilePage() {
    return (
        <main className="flex-1 overflow-y-auto pb-20 pt-16">
            <section className="mx-auto max-w-2xl px-4 py-10 md:px-6">
                <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                        <User className="h-7 w-7" />
                    </div>
                    <h1 className="text-xl font-semibold text-slate-900 dark:text-slate-100">
                        Profile is coming soon
                    </h1>
                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        Your personal archive and account controls will be
                        available in this section.
                    </p>
                </div>
            </section>
        </main>
    );
}
