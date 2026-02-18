"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Sparkles, Plus, BookOpen, Zap } from "lucide-react";
import styles from "./dashboard.module.css";

// Mock data for MVP — in production, fetched from database
const MOCK_STATS = {
    lessonsCompleted: 0,
    coursesStarted: 0,
    totalXP: 0,
    streakDays: 0,
};

const DAYS_OF_WEEK = ["M", "T", "W", "T", "F", "S", "S"];

export default function DashboardPage() {
    const { data: session, status } = useSession();

    if (status === "loading") {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.emptyState}>
                    <span className={styles.emptyIcon}>⏳</span>
                    <p className={styles.emptyText}>Loading...</p>
                </div>
            </div>
        );
    }

    if (!session?.user) {
        return (
            <div className={styles.dashboardPage}>
                <div className={styles.notSignedIn}>
                    <h2 className={styles.notSignedInTitle}>Sign in to access your dashboard</h2>
                    <p className={styles.notSignedInText}>
                        Track your progress, save lessons, and pick up where you left off.
                    </p>
                    <Link href="/auth/signin" className={styles.emptyBtn}>
                        Sign In
                    </Link>
                </div>
            </div>
        );
    }

    const firstName = session.user.name?.split(" ")[0] || "Learner";

    return (
        <div className={styles.dashboardPage}>
            {/* Header */}
            <div className={styles.header}>
                <h1 className={styles.greeting}>
                    Welcome back, <span className="text-gradient">{firstName}</span> 👋
                </h1>
                <p className={styles.greetingSub}>
                    Ready to learn something new today?
                </p>
            </div>

            {/* Stats Grid */}
            <div className={styles.statsGrid}>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconPurple}`}>⚡</div>
                    <div className={styles.statValue}>{MOCK_STATS.lessonsCompleted}</div>
                    <div className={styles.statLabel}>Lessons Completed</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconCyan}`}>📚</div>
                    <div className={styles.statValue}>{MOCK_STATS.coursesStarted}</div>
                    <div className={styles.statLabel}>Courses Started</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconGreen}`}>✨</div>
                    <div className={styles.statValue}>{MOCK_STATS.totalXP}</div>
                    <div className={styles.statLabel}>Total XP</div>
                </div>
                <div className={styles.statCard}>
                    <div className={`${styles.statIcon} ${styles.statIconOrange}`}>🔥</div>
                    <div className={styles.statValue}>{MOCK_STATS.streakDays}</div>
                    <div className={styles.statLabel}>Day Streak</div>
                </div>
            </div>

            {/* Content Grid */}
            <div className={styles.contentGrid}>
                {/* Main Content */}
                <div>
                    {/* Recent Lessons */}
                    <div className={styles.section}>
                        <div className={styles.sectionHeader}>
                            <h2 className={styles.sectionTitle}>Recent Lessons</h2>
                        </div>

                        <div className={styles.emptyState}>
                            <span className={styles.emptyIcon}>📖</span>
                            <p className={styles.emptyText}>
                                No lessons yet. Start learning to see your history here!
                            </p>
                            <Link href="/" className={styles.emptyBtn}>
                                <Sparkles size={16} />
                                Start Learning
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Sidebar */}
                <div>
                    {/* Streak */}
                    <div className={styles.sidebarCard}>
                        <div className={styles.sidebarCardTitle}>🔥 Learning Streak</div>
                        <div className={styles.streakDisplay}>
                            <div className={styles.streakNumber}>{MOCK_STATS.streakDays}</div>
                            <div className={styles.streakLabel}>day streak</div>
                        </div>
                        <div className={styles.streakDots}>
                            {DAYS_OF_WEEK.map((day, i) => (
                                <div
                                    key={i}
                                    className={`${styles.streakDot} ${i < MOCK_STATS.streakDays
                                            ? styles.streakDotActive
                                            : styles.streakDotInactive
                                        }`}
                                >
                                    {day}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Quick Start */}
                    <div className={styles.sidebarCard}>
                        <div className={styles.sidebarCardTitle}>🚀 Quick Start</div>
                        <div className={styles.quickStartGrid}>
                            <Link href="/?mode=flash" className={styles.quickStartBtn}>
                                <Zap size={16} />
                                Flash Lesson
                            </Link>
                            <Link href="/?mode=deep" className={styles.quickStartBtn}>
                                <BookOpen size={16} />
                                Deep Dive Course
                            </Link>
                            <Link href="/" className={styles.quickStartBtn}>
                                <Plus size={16} />
                                New Topic
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
