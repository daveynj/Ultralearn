import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Dashboard",
    description: "Track your learning progress, streaks, and XP.",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
