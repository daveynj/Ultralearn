import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Pricing",
    description: "Choose a plan that fits your learning goals. Start free, upgrade anytime.",
};

export default function PricingLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
