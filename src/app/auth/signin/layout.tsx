import type { Metadata } from "next";

export const metadata: Metadata = {
    title: "Sign In",
    description: "Sign in to UltraLearn to save your progress and unlock all features.",
};

export default function SignInLayout({ children }: { children: React.ReactNode }) {
    return <>{children}</>;
}
