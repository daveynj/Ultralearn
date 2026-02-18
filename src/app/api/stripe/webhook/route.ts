import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/db";
import Stripe from "stripe";

export async function POST(req: NextRequest) {
    if (!stripe) {
        return NextResponse.json({ error: "Stripe not configured" }, { status: 503 });
    }

    const body = await req.text();
    const sig = req.headers.get("stripe-signature");

    if (!sig || !process.env.STRIPE_WEBHOOK_SECRET) {
        return NextResponse.json({ error: "Missing signature" }, { status: 400 });
    }

    let event: Stripe.Event;
    try {
        event = stripe.webhooks.constructEvent(
            body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );
    } catch (err) {
        console.error("Webhook signature verification failed:", err);
        return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    switch (event.type) {
        case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            const userId = session.metadata?.userId;
            const plan = session.metadata?.plan;

            if (userId && plan) {
                const updateData: Record<string, unknown> = {
                    plan,
                    stripeCustomerId: session.customer as string,
                };

                if (session.subscription) {
                    updateData.stripeSubscriptionId = session.subscription as string;
                }

                if (plan === "lifetime") {
                    // Lifetime = no expiry
                    updateData.planExpiresAt = null;
                }

                await prisma.user.update({
                    where: { id: userId },
                    data: updateData,
                });
            }
            break;
        }

        case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = subscription.metadata?.userId;

            if (userId) {
                const isActive = ["active", "trialing"].includes(subscription.status);
                // Access period end from raw data (Stripe API still sends it)
                const rawSub = event.data.object as unknown as Record<string, unknown>;
                const periodEnd = rawSub.current_period_end as number | undefined;
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        plan: isActive ? "pro" : "free",
                        ...(periodEnd && {
                            planExpiresAt: new Date(periodEnd * 1000),
                        }),
                    },
                });
            }
            break;
        }

        case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            const userId = subscription.metadata?.userId;

            if (userId) {
                await prisma.user.update({
                    where: { id: userId },
                    data: {
                        plan: "free",
                        stripeSubscriptionId: null,
                        planExpiresAt: null,
                    },
                });
            }
            break;
        }

        case "invoice.payment_failed": {
            const invoice = event.data.object as Stripe.Invoice;
            const customerId = invoice.customer as string;

            const user = await prisma.user.findFirst({
                where: { stripeCustomerId: customerId },
            });

            if (user) {
                console.warn(`Payment failed for user ${user.id} (${user.email})`);
            }
            break;
        }
    }

    return NextResponse.json({ received: true });
}
