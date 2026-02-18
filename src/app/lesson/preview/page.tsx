"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, BarChart3, CheckCircle2, Sparkles } from "lucide-react";
import type { FlashLessonPlan } from "@/lib/types";
import styles from "./preview.module.css";

function LessonPreviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [plan, setPlan] = useState<FlashLessonPlan | null>(null);
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [isGenerating, setIsGenerating] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const topicParam = searchParams.get("topic");
        const planId = searchParams.get("planId");

        if (!topicParam) {
            router.push("/");
            return;
        }

        setTopic(topicParam);

        // The plan data was returned from the API — fetch it if we only have planId
        // For MVP, we'll re-generate if no plan is cached
        const fetchPlan = async () => {
            try {
                const response = await fetch("/api/generate/plan", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic: topicParam, mode: "flash" }),
                });

                if (!response.ok) throw new Error("Failed to generate plan");
                const data = await response.json();
                setPlan(data.plan);
            } catch (err) {
                setError("Failed to generate lesson plan. Please try again.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchPlan();
    }, [searchParams, router]);

    const handleGenerateLesson = async () => {
        if (!plan || !topic) return;
        setIsGenerating(true);

        try {
            const response = await fetch("/api/generate/lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ topic, plan }),
            });

            if (!response.ok) throw new Error("Failed to generate lesson");

            const data = await response.json();

            // Store lesson content and navigate to the lesson display page
            sessionStorage.setItem(
                "currentLesson",
                JSON.stringify({ topic, plan, content: data.content })
            );
            router.push("/lesson/view");
        } catch (err) {
            setError("Failed to generate lesson content. Please try again.");
            console.error(err);
            setIsGenerating(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.loadingOrb} />
                <h2 className={styles.loadingTitle}>Designing your lesson...</h2>
                <p className={styles.loadingSubtitle}>
                    AI is crafting the perfect learning experience for &ldquo;{topic || "your topic"}&rdquo;
                </p>
            </div>
        );
    }

    if (error) {
        return (
            <div className={styles.errorState}>
                <h2 className={styles.errorTitle}>Something went wrong</h2>
                <p className={styles.errorMessage}>{error}</p>
                <button className={styles.backBtn} onClick={() => router.push("/")}>
                    <ArrowLeft size={16} /> Try Again
                </button>
            </div>
        );
    }

    if (!plan) return null;

    return (
        <div className={styles.previewPage}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push("/")}>
                    <ArrowLeft size={16} /> Back
                </button>
                <span className={styles.headerBadge}>⚡ Flash Lesson Preview</span>
            </div>

            <div className={styles.planCard}>
                <h1 className={styles.planTitle}>{plan.title}</h1>
                <p className={styles.planSubtitle}>{plan.subtitle}</p>

                {/* Meta info */}
                <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                        <Clock size={16} className={styles.metaIcon} />
                        ~{plan.estimatedMinutes} min read
                    </div>
                    <div className={styles.metaItem}>
                        <BarChart3 size={16} className={styles.metaIcon} />
                        {plan.difficulty}
                    </div>
                    <div className={styles.metaItem}>
                        {plan.sections?.length || 0} sections
                    </div>
                </div>

                {/* Learning Objectives */}
                {plan.learningObjectives && plan.learningObjectives.length > 0 && (
                    <div className={styles.objectivesSection}>
                        <div className={styles.objectivesTitle}>What you&apos;ll learn</div>
                        <ul className={styles.objectivesList}>
                            {plan.learningObjectives.map((obj, i) => (
                                <li key={i} className={styles.objectiveItem}>
                                    <CheckCircle2 size={16} className={styles.objectiveCheck} />
                                    {obj}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Sections Preview */}
                <h3 className={styles.sectionsTitle}>Lesson Outline</h3>
                <div className={styles.sectionsList}>
                    {plan.sections?.map((section, i) => (
                        <div key={i} className={styles.sectionPreview}>
                            <div className={styles.sectionNumber}>{i + 1}</div>
                            <div className={styles.sectionInfo}>
                                <div className={styles.sectionName}>{section.title}</div>
                                <div className={styles.sectionDesc}>{section.subtitle}</div>
                            </div>
                            <span className={styles.sectionType}>{section.type.replace("_", " ")}</span>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button
                        className={`${styles.generateFullBtn} ${isGenerating ? styles.loading : ""}`}
                        onClick={handleGenerateLesson}
                        disabled={isGenerating}
                    >
                        {isGenerating && <span className={styles.spinner} />}
                        <Sparkles size={20} />
                        Generate Full Lesson
                    </button>
                </div>

                {isGenerating && (
                    <p style={{ textAlign: "center", marginTop: "var(--space-4)", color: "var(--color-text-secondary)", fontSize: "var(--text-sm)" }}>
                        Generating content and images... this may take 30-60 seconds
                    </p>
                )}
            </div>
        </div>
    );
}

export default function LessonPreviewPage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingState}>
                <div className={styles.loadingOrb} />
                <h2 className={styles.loadingTitle}>Loading...</h2>
            </div>
        }>
            <LessonPreviewContent />
        </Suspense>
    );
}
