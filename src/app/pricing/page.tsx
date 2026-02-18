"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown } from "lucide-react";
import { PLANS } from "@/lib/stripe";
import styles from "./pricing.module.css";

const FAQ_ITEMS = [
    {
        q: "Can I cancel anytime?",
        a: "Yes! You can cancel your Pro subscription at any time. You'll keep access until the end of your billing period.",
    },
    {
        q: "What happens to my lessons if I downgrade?",
        a: "All lessons you've generated remain accessible forever. You just won't be able to create new ones beyond the free tier limit.",
    },
    {
        q: "Is there a student discount?",
        a: "We're working on an education program. Contact us at support@ultralearn.io for current availability.",
    },
    {
        q: "What's included in the Lifetime plan?",
        a: "Everything in Pro, forever. One payment, no recurring charges. Plus early access to all new features.",
    },
];

export default function PricingPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [isYearly, setIsYearly] = useState(true);
    const [loading, setLoading] = useState<string | null>(null);
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const monthlyPrice = PLANS.pro.priceMonthly;
    const yearlyPrice = PLANS.pro.priceYearly;
    const yearlyMonthly = (yearlyPrice / 12).toFixed(2);
    const savePct = Math.round(
        ((monthlyPrice * 12 - yearlyPrice) / (monthlyPrice * 12)) * 100
    );

    const handleCheckout = async (plan: "pro" | "lifetime") => {
        if (!session) {
            router.push("/auth/signin");
            return;
        }

        setLoading(plan);
        try {
            const res = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    plan,
                    interval: plan === "pro" ? (isYearly ? "yearly" : "monthly") : undefined,
                }),
            });

            const data = await res.json();
            if (data.url) {
                window.location.href = data.url;
            }
        } catch (err) {
            console.error("Checkout error:", err);
        } finally {
            setLoading(null);
        }
    };

    return (
        <div className={styles.pricingPage}>
            {/* Hero */}
            <div className={styles.hero}>
                <div className={styles.badge}>💎 Simple Pricing</div>
                <h1 className={styles.title}>
                    Invest in Your{" "}
                    <span className="text-gradient">Learning</span>
                </h1>
                <p className={styles.subtitle}>
                    Start free, upgrade when you&apos;re ready. No hidden fees, cancel anytime.
                </p>
            </div>

            {/* Toggle */}
            <div className={styles.toggle}>
                <span
                    className={`${styles.toggleLabel} ${!isYearly ? styles.toggleLabelActive : ""}`}
                >
                    Monthly
                </span>
                <button
                    className={`${styles.toggleSwitch} ${isYearly ? styles.toggleSwitchActive : ""}`}
                    onClick={() => setIsYearly(!isYearly)}
                    aria-label="Toggle billing period"
                />
                <span
                    className={`${styles.toggleLabel} ${isYearly ? styles.toggleLabelActive : ""}`}
                >
                    Yearly
                </span>
                {isYearly && <span className={styles.saveBadge}>Save {savePct}%</span>}
            </div>

            {/* Cards */}
            <div className={styles.cards}>
                {/* Free */}
                <div className={styles.card}>
                    <h3 className={styles.planName}>{PLANS.free.name}</h3>
                    <p className={styles.planDesc}>Perfect for trying things out</p>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>$0</span>
                        <span className={styles.pricePeriod}>forever</span>
                    </div>
                    <ul className={styles.features}>
                        {PLANS.free.features.map((f) => (
                            <li key={f} className={styles.feature}>
                                <Check size={16} className={styles.featureCheck} />
                                {f}
                            </li>
                        ))}
                    </ul>
                    <button
                        className={`${styles.cta} ${styles.ctaSecondary} ${styles.ctaDisabled}`}
                        disabled
                    >
                        Current Plan
                    </button>
                </div>

                {/* Pro */}
                <div className={`${styles.card} ${styles.cardPopular}`}>
                    <div className={styles.popularBadge}>Most Popular</div>
                    <h3 className={styles.planName}>{PLANS.pro.name}</h3>
                    <p className={styles.planDesc}>For serious learners</p>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>
                            ${isYearly ? yearlyMonthly : monthlyPrice.toFixed(2)}
                        </span>
                        <span className={styles.pricePeriod}>/month</span>
                        {isYearly && (
                            <span className={styles.priceOriginal}>
                                ${monthlyPrice.toFixed(2)}
                            </span>
                        )}
                    </div>
                    <ul className={styles.features}>
                        {PLANS.pro.features.map((f) => (
                            <li key={f} className={styles.feature}>
                                <Check size={16} className={styles.featureCheck} />
                                {f}
                            </li>
                        ))}
                    </ul>
                    <button
                        className={`${styles.cta} ${styles.ctaPrimary}`}
                        onClick={() => handleCheckout("pro")}
                        disabled={loading !== null}
                    >
                        {loading === "pro" ? "Redirecting..." : "Get Pro"}
                    </button>
                </div>

                {/* Lifetime */}
                <div className={styles.card}>
                    <h3 className={styles.planName}>{PLANS.lifetime.name}</h3>
                    <p className={styles.planDesc}>One payment, learn forever</p>
                    <div className={styles.price}>
                        <span className={styles.priceAmount}>
                            ${PLANS.lifetime.price.toFixed(2)}
                        </span>
                        <span className={styles.pricePeriod}>one-time</span>
                    </div>
                    <ul className={styles.features}>
                        {PLANS.lifetime.features.map((f) => (
                            <li key={f} className={styles.feature}>
                                <Check size={16} className={styles.featureCheck} />
                                {f}
                            </li>
                        ))}
                    </ul>
                    <button
                        className={`${styles.cta} ${styles.ctaSecondary}`}
                        onClick={() => handleCheckout("lifetime")}
                        disabled={loading !== null}
                    >
                        {loading === "lifetime" ? "Redirecting..." : "Get Lifetime"}
                    </button>
                </div>
            </div>

            {/* FAQ */}
            <div className={styles.faq}>
                <h2 className={styles.faqTitle}>Frequently Asked Questions</h2>
                {FAQ_ITEMS.map((item, i) => (
                    <div key={i} className={styles.faqItem}>
                        <button
                            className={styles.faqQuestion}
                            onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        >
                            {item.q}
                            <ChevronDown
                                size={18}
                                className={`${styles.faqChevron} ${openFaq === i ? styles.faqChevronOpen : ""}`}
                            />
                        </button>
                        <div
                            className={`${styles.faqAnswer} ${openFaq === i ? styles.faqAnswerOpen : ""}`}
                        >
                            {item.a}
                        </div>
                    </div>
                ))}
            </div>

            {/* Guarantee */}
            <div className={styles.guarantee}>
                <div className={styles.guaranteeIcon}>🛡️</div>
                <p>30-day money-back guarantee. No questions asked.</p>
            </div>
        </div>
    );
}
