"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    Circle,
    PlayCircle,
    Home,
} from "lucide-react";
import type { CourseSyllabus, LessonContentSection } from "@/lib/types";
import ChatWidget from "@/components/chat-widget";
import styles from "./learn.module.css";

interface CourseState {
    topic: string;
    syllabus: CourseSyllabus;
    currentModule: number;
    currentLesson: number;
}

interface GeneratedLesson {
    sections: LessonContentSection[];
    summary: string;
    imageUrl?: string;
}

export default function CourseLearnPage() {
    const router = useRouter();
    const [courseState, setCourseState] = useState<CourseState | null>(null);
    const [lessonContent, setLessonContent] = useState<GeneratedLesson | null>(null);
    const [isLoadingLesson, setIsLoadingLesson] = useState(false);
    const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
    const [isCourseComplete, setIsCourseComplete] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentCourse");
        if (!stored) {
            router.push("/");
            return;
        }
        try {
            const state = JSON.parse(stored) as CourseState;
            setCourseState(state);
        } catch {
            router.push("/");
        }
    }, [router]);

    const loadLesson = useCallback(async (moduleIndex: number, lessonIndex: number) => {
        if (!courseState) return;

        const module = courseState.syllabus.modules[moduleIndex];
        const lesson = module?.lessons[lessonIndex];
        if (!module || !lesson) return;

        setIsLoadingLesson(true);
        setLessonContent(null);

        try {
            const response = await fetch("/api/generate/course-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    courseTopic: courseState.topic,
                    moduleTitle: module.title,
                    lessonTitle: lesson.title,
                    keyTopics: lesson.keyTopics,
                    lessonIndex,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate lesson");
            const data = await response.json();
            setLessonContent(data.content);
        } catch (err) {
            console.error("Error loading lesson:", err);
        } finally {
            setIsLoadingLesson(false);
        }
    }, [courseState]);

    // Load first lesson when course state is available
    useEffect(() => {
        if (courseState && !lessonContent && !isLoadingLesson) {
            loadLesson(courseState.currentModule, courseState.currentLesson);
        }
    }, [courseState, lessonContent, isLoadingLesson, loadLesson]);

    const navigateToLesson = (moduleIndex: number, lessonIndex: number) => {
        if (!courseState) return;

        // Mark current lesson as completed
        const key = `${courseState.currentModule}-${courseState.currentLesson}`;
        setCompletedLessons((prev) => new Set(prev).add(key));

        // Update state
        setCourseState((prev) =>
            prev ? { ...prev, currentModule: moduleIndex, currentLesson: lessonIndex } : null
        );
        setLessonContent(null);
        loadLesson(moduleIndex, lessonIndex);

        // Scroll to top
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleNext = () => {
        if (!courseState) return;
        const currentModule = courseState.syllabus.modules[courseState.currentModule];
        const totalLessonsInModule = currentModule.lessons.length;

        if (courseState.currentLesson < totalLessonsInModule - 1) {
            // Next lesson in same module
            navigateToLesson(courseState.currentModule, courseState.currentLesson + 1);
        } else if (courseState.currentModule < courseState.syllabus.modules.length - 1) {
            // First lesson of next module
            navigateToLesson(courseState.currentModule + 1, 0);
        } else {
            // Course complete!
            const key = `${courseState.currentModule}-${courseState.currentLesson}`;
            setCompletedLessons((prev) => new Set(prev).add(key));
            setIsCourseComplete(true);
        }
    };

    const handlePrev = () => {
        if (!courseState) return;
        if (courseState.currentLesson > 0) {
            navigateToLesson(courseState.currentModule, courseState.currentLesson - 1);
        } else if (courseState.currentModule > 0) {
            const prevModule = courseState.syllabus.modules[courseState.currentModule - 1];
            navigateToLesson(courseState.currentModule - 1, prevModule.lessons.length - 1);
        }
    };

    // Calculate progress
    const totalLessons = courseState?.syllabus.modules.reduce(
        (sum, m) => sum + m.lessons.length,
        0
    ) || 1;
    const progressPercent = Math.round((completedLessons.size / totalLessons) * 100);

    if (!courseState) {
        return (
            <div className={styles.noData}>
                <h2 className={styles.noDataTitle}>No course loaded</h2>
                <button className="btn btn-primary" onClick={() => router.push("/")}>
                    Go Home
                </button>
            </div>
        );
    }

    const currentModule = courseState.syllabus.modules[courseState.currentModule];
    const currentLessonMeta = currentModule?.lessons[courseState.currentLesson];
    const isFirstLesson = courseState.currentModule === 0 && courseState.currentLesson === 0;

    return (
        <div className={styles.learnPage}>
            {/* Top Navigation */}
            <nav className={styles.topNav}>
                <div className={styles.navLeft}>
                    <button className={styles.navBtn} onClick={() => router.push("/")}>
                        <Home size={16} />
                    </button>
                    <span className={styles.navTitle}>{courseState.syllabus.title}</span>
                </div>
                <div className={styles.navRight}>
                    <span style={{ fontSize: "var(--text-xs)", color: "var(--color-text-tertiary)" }}>
                        {progressPercent}% complete
                    </span>
                </div>
            </nav>

            {/* Progress Bar */}
            <div className={styles.progressBar}>
                <div className={styles.progressFill} style={{ width: `${progressPercent}%` }} />
            </div>

            {/* Content Area */}
            <div className={styles.contentArea}>
                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    <div className={styles.sidebarTitle}>Course Modules</div>
                    {courseState.syllabus.modules.map((module, mi) => (
                        <div key={mi} className={styles.moduleGroup}>
                            <div className={styles.moduleGroupTitle}>
                                <span className={styles.moduleGroupNumber}>{mi + 1}</span>
                                {module.title}
                            </div>
                            {module.lessons.map((lesson, li) => {
                                const key = `${mi}-${li}`;
                                const isActive =
                                    mi === courseState.currentModule && li === courseState.currentLesson;
                                const isCompleted = completedLessons.has(key);

                                return (
                                    <button
                                        key={li}
                                        className={`${styles.sidebarLesson} ${isActive ? styles.sidebarLessonActive : ""
                                            } ${isCompleted ? styles.sidebarLessonCompleted : ""}`}
                                        onClick={() => navigateToLesson(mi, li)}
                                    >
                                        {isCompleted ? (
                                            <CheckCircle2 size={16} className={`${styles.lessonStatusIcon} ${styles.completedIcon}`} />
                                        ) : isActive ? (
                                            <PlayCircle size={16} className={`${styles.lessonStatusIcon} ${styles.currentIcon}`} />
                                        ) : (
                                            <Circle size={16} className={`${styles.lessonStatusIcon} ${styles.lockedIcon}`} />
                                        )}
                                        {lesson.title}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </aside>

                {/* Main Content */}
                <main className={styles.mainContent}>
                    {isCourseComplete ? (
                        <div className={styles.courseComplete}>
                            <span className={styles.completeBadge}>🎓</span>
                            <h2 className={styles.completeTitle}>Course Complete!</h2>
                            <p className={styles.completeText}>
                                Congratulations! You&apos;ve completed the entire course on
                                &ldquo;{courseState.topic}&rdquo;. You&apos;ve covered{" "}
                                {courseState.syllabus.modules.length} modules and {totalLessons} lessons.
                            </p>
                            <button
                                className={styles.lessonNavBtnPrimary}
                                style={{ display: "inline-flex" }}
                                onClick={() => router.push("/")}
                            >
                                Learn Something New
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Lesson Header */}
                            <div className={styles.lessonHeader}>
                                <div className={styles.breadcrumb}>
                                    Module {courseState.currentModule + 1}
                                    <span className={styles.breadcrumbSep}>›</span>
                                    {currentModule?.title}
                                    <span className={styles.breadcrumbSep}>›</span>
                                    Lesson {courseState.currentLesson + 1}
                                </div>
                                <h1 className={styles.lessonTitle}>
                                    {currentLessonMeta?.title || "Loading..."}
                                </h1>
                            </div>

                            {/* Lesson Content */}
                            {isLoadingLesson ? (
                                <div className={styles.loadingLesson}>
                                    <div className={styles.loadingLessonOrb} />
                                    <p className={styles.loadingLessonText}>
                                        Generating lesson content...
                                    </p>
                                </div>
                            ) : lessonContent ? (
                                <div className={styles.lessonBody}>
                                    {/* Image */}
                                    {lessonContent.imageUrl && (
                                        <img
                                            src={lessonContent.imageUrl}
                                            alt={currentLessonMeta?.title || "Lesson image"}
                                            className={styles.lessonImage}
                                        />
                                    )}

                                    {/* Sections */}
                                    {lessonContent.sections?.map((section, si) => (
                                        <div key={si}>
                                            <h3>{section.title}</h3>
                                            <div
                                                dangerouslySetInnerHTML={{
                                                    __html: formatMarkdown(section.content),
                                                }}
                                            />

                                            {section.didYouKnow && (
                                                <div className={`${styles.calloutBox} ${styles.calloutDYK}`}>
                                                    <div className={styles.calloutLabel}>💡 Did You Know?</div>
                                                    <div className={styles.calloutText}>{section.didYouKnow}</div>
                                                </div>
                                            )}

                                            {section.keyTakeaway && (
                                                <div className={`${styles.calloutBox} ${styles.calloutKey}`}>
                                                    <div className={styles.calloutLabel}>🔑 Key Takeaway</div>
                                                    <div className={styles.calloutText}>{section.keyTakeaway}</div>
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Summary */}
                                    {lessonContent.summary && (
                                        <div className={`${styles.calloutBox} ${styles.calloutKey}`}>
                                            <div className={styles.calloutLabel}>📝 Summary</div>
                                            <div className={styles.calloutText}>{lessonContent.summary}</div>
                                        </div>
                                    )}
                                </div>
                            ) : null}

                            {/* Navigation */}
                            <div className={styles.lessonNav}>
                                <button
                                    className={styles.lessonNavBtn}
                                    onClick={handlePrev}
                                    disabled={isFirstLesson}
                                    style={{ visibility: isFirstLesson ? "hidden" : "visible" }}
                                >
                                    <ArrowLeft size={16} /> Previous
                                </button>

                                <button
                                    className={`${styles.lessonNavBtn} ${styles.lessonNavBtnPrimary}`}
                                    onClick={handleNext}
                                    disabled={isLoadingLesson}
                                >
                                    {courseState.currentModule === courseState.syllabus.modules.length - 1 &&
                                        courseState.currentLesson ===
                                        currentModule.lessons.length - 1
                                        ? "Finish Course 🎓"
                                        : "Next Lesson"}{" "}
                                    <ArrowRight size={16} />
                                </button>
                            </div>
                        </>
                    )}
                </main>
            </div>

            {/* AI Tutor Chat Widget */}
            <ChatWidget
                topic={courseState.topic}
                lessonTitle={currentLessonMeta?.title || courseState.topic}
                lessonContent={
                    lessonContent?.sections?.map(s => `${s.title}: ${s.content}`).join('\n\n') || ''
                }
            />
        </div>
    );
}

function formatMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>")
        .replace(/^(.+)$/, "<p>$1</p>");
}
