import { Metadata } from "next";

export const metadata: Metadata = {
    title: {
        default: "Obelisk | Onboarding",
        template: "%s | Onboarding",
    },
};

export default function OnboardingLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
