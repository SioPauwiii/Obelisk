import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Obelisk | Terms of Service",
        template: "%s | Terms of Service",
    },
};

export default function TermsOfServiceLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
