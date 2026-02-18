import Stripe from "stripe";

/**
 * Stripe client — only initialised when STRIPE_SECRET_KEY is available.
 * APIs that use stripe should check for null first.
 */
export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY, { typescript: true })
    : null;

/**
 * Plans configuration — single source of truth for pricing.
 */
export const PLANS = {
    free: {
        name: "Free",
        credits: 3,
        price: 0,
        features: [
            "3 flash lessons",
            "Basic quiz access",
            "Community support",
        ],
    },
    pro: {
        name: "Pro",
        priceMonthly: 9.99,
        priceYearly: 79.99,
        stripePriceIdMonthly: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || "",
        stripePriceIdYearly: process.env.STRIPE_PRO_YEARLY_PRICE_ID || "",
        features: [
            "Unlimited flash lessons",
            "Unlimited deep dive courses",
            "AI tutor chat",
            "Priority generation",
            "Progress tracking",
            "No ads",
        ],
    },
    lifetime: {
        name: "Lifetime",
        price: 199.99,
        stripePriceId: process.env.STRIPE_LIFETIME_PRICE_ID || "",
        features: [
            "Everything in Pro",
            "One-time payment",
            "Lifetime access",
            "Early access to new features",
        ],
    },
} as const;

export type PlanType = keyof typeof PLANS;
