import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Obelisk | Privacy Policy",
        template: "%s | Privacy Policy",
    },
};

export default function PrivacyPolicyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
