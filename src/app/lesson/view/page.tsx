"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Clock, BarChart3, Sparkles, CheckCircle, XCircle } from "lucide-react";
import type { FlashLessonPlan, LessonContent, QuizQuestion } from "@/lib/types";
import ChatWidget from "@/components/chat-widget";
import styles from "./lesson.module.css";

interface LessonData {
    topic: string;
    plan: FlashLessonPlan;
    content: LessonContent;
}

export default function LessonViewPage() {
    const router = useRouter();
    const [lessonData, setLessonData] = useState<LessonData | null>(null);
    const [quiz, setQuiz] = useState<QuizQuestion[] | null>(null);
    const [quizLoading, setQuizLoading] = useState(false);
    const [answers, setAnswers] = useState<Record<number, number>>({});
    const [showResults, setShowResults] = useState(false);

    useEffect(() => {
        const stored = sessionStorage.getItem("currentLesson");
        if (!stored) {
            router.push("/");
            return;
        }

        try {
            setLessonData(JSON.parse(stored));
        } catch {
            router.push("/");
        }
    }, [router]);

    const handleLoadQuiz = async () => {
        if (!lessonData) return;
        setQuizLoading(true);

        try {
            const contentSummary = lessonData.content.sections
                .map((s) => `${s.title}: ${s.content.substring(0, 300)}`)
                .join("\n\n");

            const response = await fetch("/api/generate/quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    topic: lessonData.topic,
                    lessonContent: contentSummary,
                    questionCount: 5,
                }),
            });

            if (!response.ok) throw new Error("Failed to generate quiz");
            const data = await response.json();
            setQuiz(data.questions);
        } catch (err) {
            console.error("Quiz generation error:", err);
        } finally {
            setQuizLoading(false);
        }
    };

    const handleAnswer = (questionIndex: number, optionIndex: number) => {
        if (answers[questionIndex] !== undefined) return; // Already answered
        setAnswers((prev) => ({ ...prev, [questionIndex]: optionIndex }));
    };

    const getScore = () => {
        if (!quiz) return 0;
        let correct = 0;
        Object.entries(answers).forEach(([qi, ai]) => {
            if (quiz[parseInt(qi)]?.correctIndex === ai) correct++;
        });
        return correct;
    };

    const handleFinishQuiz = () => {
        setShowResults(true);
    };

    const allAnswered = quiz ? Object.keys(answers).length === quiz.length : false;
    const score = getScore();
    const scorePercent = quiz ? Math.round((score / quiz.length) * 100) : 0;

    if (!lessonData) {
        return (
            <div className={styles.noData}>
                <h2 className={styles.noDataTitle}>No lesson loaded</h2>
                <button className="btn btn-primary" onClick={() => router.push("/")}>
                    Go Home
                </button>
            </div>
        );
    }

    const { plan, content, topic } = lessonData;

    return (
        <div className={styles.lessonPage}>
            {/* Sticky Header */}
            <header className={styles.lessonHeader}>
                <div className={styles.headerLeft}>
                    <button className={styles.backBtn} onClick={() => router.push("/")}>
                        <ArrowLeft size={16} /> Home
                    </button>
                    <span className={styles.headerTitle}>{plan.title}</span>
                </div>
            </header>

            {/* Hero */}
            <section className={styles.heroSection}>
                <div className={styles.heroContent}>
                    <span className={styles.lessonBadge}>⚡ Flash Lesson</span>
                    <h1 className={styles.lessonTitle}>{plan.title}</h1>
                    <p className={styles.lessonSubtitle}>{plan.subtitle}</p>
                    <div className={styles.heroMeta}>
                        <span className={styles.heroMetaItem}>
                            <Clock size={14} /> ~{plan.estimatedMinutes} min
                        </span>
                        <span className={styles.heroMetaItem}>
                            <BarChart3 size={14} /> {plan.difficulty}
                        </span>
                        <span className={styles.heroMetaItem}>
                            {content.sections.length} sections
                        </span>
                    </div>
                </div>
            </section>

            {/* Content Layout */}
            <div className={styles.contentLayout}>
                {/* Main Content */}
                <main className={styles.mainContent}>
                    {content.sections.map((section, index) => (
                        <article key={index} className={styles.lessonSection}>
                            <h2 className={styles.sectionTitle}>{section.title}</h2>

                            {/* Section Image */}
                            {section.imageUrl && (
                                <img
                                    src={section.imageUrl}
                                    alt={section.title}
                                    className={styles.sectionImage}
                                    loading="lazy"
                                />
                            )}

                            {/* Section Content */}
                            <div
                                className={styles.sectionContent}
                                dangerouslySetInnerHTML={{
                                    __html: formatMarkdown(section.content),
                                }}
                            />

                            {/* Did You Know */}
                            {section.didYouKnow && (
                                <div className={styles.didYouKnow}>
                                    <div className={styles.didYouKnowLabel}>💡 Did You Know?</div>
                                    <div className={styles.didYouKnowText}>{section.didYouKnow}</div>
                                </div>
                            )}

                            {/* Key Takeaway */}
                            {section.keyTakeaway && (
                                <div className={styles.keyTakeaway}>
                                    <div className={styles.keyTakeawayLabel}>🔑 Key Takeaway</div>
                                    <div className={styles.keyTakeawayText}>{section.keyTakeaway}</div>
                                </div>
                            )}
                        </article>
                    ))}

                    {/* Summary */}
                    {content.summary && (
                        <div className={styles.summarySection}>
                            <h3 className={styles.summaryTitle}>📝 Lesson Summary</h3>
                            <p className={styles.summaryText}>{content.summary}</p>

                            {content.furtherReading && content.furtherReading.length > 0 && (
                                <div className={styles.furtherReading}>
                                    {content.furtherReading.map((topic, i) => (
                                        <button
                                            key={i}
                                            className={styles.furtherReadingChip}
                                            onClick={() => {
                                                router.push(`/?topic=${encodeURIComponent(topic)}`);
                                            }}
                                        >
                                            Learn about: {topic}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Quiz Section */}
                    <div className={styles.quizSection}>
                        <h3 className={styles.quizTitle}>🧠 Test Your Knowledge</h3>
                        <p className={styles.quizSubtitle}>
                            See how much you&apos;ve learned with a quick quiz
                        </p>

                        {!quiz && !quizLoading && (
                            <div className={styles.quizLoading}>
                                <button className={styles.quizLoadBtn} onClick={handleLoadQuiz}>
                                    <Sparkles size={18} />
                                    Generate Quiz
                                </button>
                            </div>
                        )}

                        {quizLoading && (
                            <div className={styles.quizLoading}>
                                <p style={{ color: "var(--color-text-secondary)" }}>
                                    Generating quiz questions...
                                </p>
                            </div>
                        )}

                        {quiz && !showResults && (
                            <>
                                {quiz.map((q, qi) => (
                                    <div key={qi} className={styles.quizQuestion}>
                                        <div className={styles.questionHeader}>
                                            <span className={styles.questionNumber}>{qi + 1}</span>
                                            <span className={styles.questionText}>{q.question}</span>
                                            <span
                                                className={`${styles.questionDifficulty} ${q.difficulty === "easy"
                                                    ? styles.diffEasy
                                                    : q.difficulty === "medium"
                                                        ? styles.diffMedium
                                                        : styles.diffHard
                                                    }`}
                                            >
                                                {q.difficulty}
                                            </span>
                                        </div>

                                        <div className={styles.optionsList}>
                                            {q.options.map((opt, oi) => {
                                                const isAnswered = answers[qi] !== undefined;
                                                const isSelected = answers[qi] === oi;
                                                const isCorrect = q.correctIndex === oi;

                                                let optionClass = styles.optionBtn;
                                                if (isAnswered) {
                                                    if (isCorrect) optionClass += ` ${styles.optionCorrect}`;
                                                    else if (isSelected) optionClass += ` ${styles.optionWrong}`;
                                                    else optionClass += ` ${styles.optionDisabled}`;
                                                }

                                                return (
                                                    <button
                                                        key={oi}
                                                        className={optionClass}
                                                        onClick={() => handleAnswer(qi, oi)}
                                                        disabled={isAnswered}
                                                    >
                                                        <span className={styles.optionLetter}>
                                                            {isAnswered && isCorrect ? (
                                                                <CheckCircle size={14} />
                                                            ) : isAnswered && isSelected && !isCorrect ? (
                                                                <XCircle size={14} />
                                                            ) : (
                                                                String.fromCharCode(65 + oi)
                                                            )}
                                                        </span>
                                                        {opt}
                                                    </button>
                                                );
                                            })}
                                        </div>

                                        {answers[qi] !== undefined && (
                                            <div className={styles.explanation}>
                                                <div className={styles.explanationLabel}>
                                                    {answers[qi] === q.correctIndex ? "✅ Correct!" : "❌ Not quite"}
                                                </div>
                                                {q.explanation}
                                            </div>
                                        )}
                                    </div>
                                ))}

                                {allAnswered && (
                                    <div style={{ textAlign: "center", marginTop: "var(--space-6)" }}>
                                        <button className={styles.quizLoadBtn} onClick={handleFinishQuiz}>
                                            See Results
                                        </button>
                                    </div>
                                )}
                            </>
                        )}

                        {showResults && quiz && (
                            <div className={styles.quizResults}>
                                <div
                                    className={`${styles.scoreCircle} ${scorePercent >= 80
                                        ? styles.scoreGood
                                        : scorePercent >= 50
                                            ? styles.scoreOk
                                            : styles.scoreLow
                                        }`}
                                >
                                    {scorePercent}%
                                </div>
                                <div className={styles.quizResultText}>
                                    You got {score} out of {quiz.length} correct!
                                </div>
                                <div className={styles.quizResultSubtext}>
                                    {scorePercent >= 80
                                        ? "Excellent! You really understood this topic! 🎉"
                                        : scorePercent >= 50
                                            ? "Good effort! Review the lesson to strengthen your knowledge."
                                            : "Keep learning! Try re-reading the lesson and take the quiz again."}
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                {/* Sidebar */}
                <aside className={styles.sidebar}>
                    {/* Key Facts */}
                    {plan.keyFacts && plan.keyFacts.length > 0 && (
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarCardTitle}>📌 Key Facts</h3>
                            {plan.keyFacts.map((fact, i) => (
                                <div key={i} className={styles.keyFactItem}>
                                    <div className={styles.keyFactLabel}>{fact.label}</div>
                                    <div className={styles.keyFactValue}>{fact.value}</div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Timeline */}
                    {plan.timelineEvents && plan.timelineEvents.length > 0 && (
                        <div className={styles.sidebarCard}>
                            <h3 className={styles.sidebarCardTitle}>📅 Timeline</h3>
                            {plan.timelineEvents.map((event, i) => (
                                <div key={i} className={styles.timelineItem}>
                                    <div className={styles.timelineDot} />
                                    <div className={styles.timelineDate}>{event.date}</div>
                                    <div className={styles.timelineEvent}>{event.event}</div>
                                    <div className={styles.timelineSignificance}>
                                        {event.significance}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </aside>
            </div>

            {/* AI Tutor Chat Widget */}
            <ChatWidget
                topic={topic}
                lessonTitle={plan.title}
                lessonContent={content.sections.map(s => `${s.title}: ${s.content}`).join('\n\n')}
            />
        </div>
    );
}

/**
 * Simple markdown to HTML converter for lesson content.
 */
function formatMarkdown(text: string): string {
    return text
        .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
        .replace(/\*(.*?)\*/g, "<em>$1</em>")
        .replace(/\n\n/g, "</p><p>")
        .replace(/\n/g, "<br>")
        .replace(/^(.+)$/, "<p>$1</p>");
}
