import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Obelisk | Sign In",
        template: "%s | Sign In",
    },
};

export default function SignInLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
