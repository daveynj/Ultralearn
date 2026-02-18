import { prisma } from "@/lib/db";
import { auth } from "@/lib/auth";

export interface UsageStatus {
    plan: string;
    canGenerate: boolean;
    creditsRemaining: number | null; // null = unlimited
    creditsUsed: number;
    totalCredits: number | null;
}

/**
 * Check if the current user can generate a lesson.
 * Returns usage info for displaying limits in the UI.
 */
export async function checkUsage(): Promise<UsageStatus> {
    const session = await auth();

    if (!session?.user?.email) {
        // Not logged in — allow free usage without tracking
        return {
            plan: "free",
            canGenerate: true,
            creditsRemaining: null,
            creditsUsed: 0,
            totalCredits: null,
        };
    }

    const user = await prisma.user.findUnique({
        where: { email: session.user.email },
        select: {
            plan: true,
            freeCredits: true,
            creditsUsed: true,
            planExpiresAt: true,
        },
    });

    if (!user) {
        return {
            plan: "free",
            canGenerate: true,
            creditsRemaining: null,
            creditsUsed: 0,
            totalCredits: null,
        };
    }

    // Pro / Lifetime = unlimited
    if (user.plan === "pro" || user.plan === "lifetime") {
        // Check if plan expired (for pro subscription)
        if (user.plan === "pro" && user.planExpiresAt && user.planExpiresAt < new Date()) {
            // Plan expired — treat as free
        } else {
            return {
                plan: user.plan,
                canGenerate: true,
                creditsRemaining: null,
                creditsUsed: user.creditsUsed,
                totalCredits: null,
            };
        }
    }

    // Free tier — check credits
    const remaining = user.freeCredits - user.creditsUsed;
    return {
        plan: "free",
        canGenerate: remaining > 0,
        creditsRemaining: Math.max(0, remaining),
        creditsUsed: user.creditsUsed,
        totalCredits: user.freeCredits,
    };
}

/**
 * Consume a credit (call after successful lesson generation).
 */
export async function consumeCredit(userEmail: string): Promise<void> {
    await prisma.user.update({
        where: { email: userEmail },
        data: { creditsUsed: { increment: 1 } },
    });
}
