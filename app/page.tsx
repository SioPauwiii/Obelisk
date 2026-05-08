import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function HomePage() {
    const cookieStore = await cookies();
    const token = cookieStore.get("sb-access-token")?.value;

    if (!token) {
        redirect("/signin");
    }

    redirect("/dashboard");
}
