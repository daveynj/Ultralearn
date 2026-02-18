"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, Clock, BarChart3, CheckCircle2, BookOpen, Layers } from "lucide-react";
import type { CourseSyllabus } from "@/lib/types";
import styles from "./preview.module.css";

function CoursePreviewContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [syllabus, setSyllabus] = useState<CourseSyllabus | null>(null);
    const [topic, setTopic] = useState("");
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const topicParam = searchParams.get("topic");

        if (!topicParam) {
            router.push("/");
            return;
        }

        setTopic(topicParam);

        const fetchSyllabus = async () => {
            try {
                const response = await fetch("/api/generate/syllabus", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ topic: topicParam }),
                });

                if (!response.ok) throw new Error("Failed to generate syllabus");
                const data = await response.json();
                setSyllabus(data.syllabus);
            } catch (err) {
                setError("Failed to generate course syllabus. Please try again.");
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        fetchSyllabus();
    }, [searchParams, router]);

    const handleStartCourse = () => {
        if (!syllabus || !topic) return;

        // Store syllabus and navigate to the first lesson
        sessionStorage.setItem(
            "currentCourse",
            JSON.stringify({ topic, syllabus, currentModule: 0, currentLesson: 0 })
        );
        router.push("/course/learn");
    };

    const totalLessons = syllabus?.modules?.reduce(
        (sum, m) => sum + (m.lessons?.length || 0),
        0
    ) || 0;

    if (isLoading) {
        return (
            <div className={styles.loadingState}>
                <div className={styles.loadingOrb} />
                <h2 className={styles.loadingTitle}>Designing your course...</h2>
                <p className={styles.loadingSubtitle}>
                    AI is building a complete curriculum for &ldquo;{topic || "your topic"}&rdquo;
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

    if (!syllabus) return null;

    return (
        <div className={styles.previewPage}>
            <div className={styles.header}>
                <button className={styles.backBtn} onClick={() => router.push("/")}>
                    <ArrowLeft size={16} /> Back
                </button>
                <span className={styles.headerBadge}>📚 Deep Dive Course</span>
            </div>

            <div className={styles.syllabusCard}>
                <h1 className={styles.courseTitle}>{syllabus.title}</h1>
                <p className={styles.courseSubtitle}>{syllabus.subtitle}</p>
                <p className={styles.courseDescription}>{syllabus.description}</p>

                {/* Meta */}
                <div className={styles.metaRow}>
                    <div className={styles.metaItem}>
                        <Clock size={16} className={styles.metaIcon} />
                        ~{syllabus.estimatedMinutes} min total
                    </div>
                    <div className={styles.metaItem}>
                        <Layers size={16} className={styles.metaIcon} />
                        {syllabus.modules?.length || 0} modules
                    </div>
                    <div className={styles.metaItem}>
                        <BookOpen size={16} className={styles.metaIcon} />
                        {totalLessons} lessons
                    </div>
                    <div className={styles.metaItem}>
                        <BarChart3 size={16} className={styles.metaIcon} />
                        {syllabus.difficulty}
                    </div>
                </div>

                {/* Learning Objectives */}
                {syllabus.learningObjectives && syllabus.learningObjectives.length > 0 && (
                    <div className={styles.objectivesSection}>
                        <div className={styles.objectivesTitle}>What you&apos;ll learn</div>
                        <ul className={styles.objectivesList}>
                            {syllabus.learningObjectives.map((obj, i) => (
                                <li key={i} className={styles.objectiveItem}>
                                    <CheckCircle2 size={16} className={styles.objectiveCheck} />
                                    {obj}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Modules */}
                <h3 className={styles.modulesTitle}>Course Curriculum</h3>
                <div className={styles.modulesList}>
                    {syllabus.modules?.map((module, mi) => (
                        <div key={mi} className={styles.moduleCard}>
                            <div className={styles.moduleHeader}>
                                <div className={styles.moduleNumber}>{mi + 1}</div>
                                <div className={styles.moduleInfo}>
                                    <div className={styles.moduleTitle}>{module.title}</div>
                                    <div className={styles.moduleDescription}>{module.description}</div>
                                </div>
                                <div className={styles.moduleMeta}>
                                    <Clock size={12} />
                                    ~{module.estimatedMinutes} min
                                </div>
                            </div>

                            <div className={styles.lessonsList}>
                                {module.lessons?.map((lesson, li) => (
                                    <div key={li} className={styles.lessonItem}>
                                        <span className={styles.lessonBullet} />
                                        {lesson.title}
                                        {lesson.keyTopics && lesson.keyTopics.length > 0 && (
                                            <div className={styles.lessonTopics}>
                                                {lesson.keyTopics.slice(0, 3).map((t, ti) => (
                                                    <span key={ti} className={styles.topicTag}>{t}</span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Actions */}
                <div className={styles.actions}>
                    <button className={styles.startCourseBtn} onClick={handleStartCourse}>
                        <BookOpen size={20} />
                        Start Course
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function CoursePreviewPage() {
    return (
        <Suspense fallback={
            <div className={styles.loadingState}>
                <div className={styles.loadingOrb} />
                <h2 className={styles.loadingTitle}>Loading...</h2>
            </div>
        }>
            <CoursePreviewContent />
        </Suspense>
    );
}
