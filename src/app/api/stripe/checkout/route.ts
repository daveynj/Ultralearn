import { NextRequest, NextResponse } from "next/server";
import { stripe, PLANS } from "@/lib/stripe";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function POST(req: NextRequest) {
    try {
        if (!stripe) {
            return NextResponse.json(
                { error: "Stripe is not configured. Add STRIPE_SECRET_KEY to .env.local" },
                { status: 503 }
            );
        }

        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
        }

        const { plan, interval } = (await req.json()) as {
            plan: "pro" | "lifetime";
            interval?: "monthly" | "yearly";
        };

        // Get or create Stripe customer
        const user = await prisma.user.findUnique({
            where: { email: session.user.email },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        let customerId = user.stripeCustomerId;

        if (!customerId) {
            const customer = await stripe.customers.create({
                email: session.user.email,
                name: session.user.name || undefined,
                metadata: { userId: user.id },
            });
            customerId = customer.id;
            await prisma.user.update({
                where: { id: user.id },
                data: { stripeCustomerId: customerId },
            });
        }

        // Determine price ID
        let priceId: string;
        let mode: "subscription" | "payment";

        if (plan === "lifetime") {
            priceId = PLANS.lifetime.stripePriceId;
            mode = "payment";
        } else {
            priceId =
                interval === "yearly"
                    ? PLANS.pro.stripePriceIdYearly
                    : PLANS.pro.stripePriceIdMonthly;
            mode = "subscription";
        }

        if (!priceId) {
            return NextResponse.json(
                { error: "Stripe price ID not configured" },
                { status: 500 }
            );
        }

        const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

        const checkoutSession = await stripe.checkout.sessions.create({
            customer: customerId,
            mode,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/dashboard?upgraded=true`,
            cancel_url: `${appUrl}/pricing?cancelled=true`,
            metadata: {
                userId: user.id,
                plan,
            },
            ...(mode === "subscription" && {
                subscription_data: {
                    metadata: { userId: user.id, plan },
                },
            }),
        });

        return NextResponse.json({ url: checkoutSession.url });
    } catch (error) {
        console.error("Checkout error:", error);
        return NextResponse.json(
            { error: "Failed to create checkout session" },
            { status: 500 }
        );
    }
}
