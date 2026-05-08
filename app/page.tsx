export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
    const token = cookies().get("sb-access-token")?.value;

    if (!token) {
        redirect("/signin");
    }

    return (
        <main className="flex min-h-svh items-center justify-center bg-slate-50 px-6 text-center text-slate-900 dark:bg-slate-950 dark:text-slate-100">
            <div className="max-w-md space-y-3">
                <h1 className="text-2xl font-bold">Signed in</h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                    You are authenticated. Replace this placeholder with your
                    real landing experience.
                </p>
            </div>
        </main>
    );
}
