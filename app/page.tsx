export const dynamic = "force-dynamic";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function Home() {
    const token = cookies().get("sb-access-token")?.value;

    if (!token) {
        redirect("/signin");
    }

    redirect("/dashboard");
}
