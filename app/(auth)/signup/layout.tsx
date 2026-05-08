import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Obelisk | Sign Up",
        template: "%s | Sign Up",
    },
};

export default function SignUpLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
