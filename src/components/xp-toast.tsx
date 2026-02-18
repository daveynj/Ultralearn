"use client";

import { useState, useCallback, useEffect } from "react";
import styles from "./xp-toast.module.css";

export type ToastType = "xp" | "streak" | "level" | "complete";

interface Toast {
    id: string;
    type: ToastType;
    title: string;
    subtitle?: string;
    amount?: number;
}

const ICONS: Record<ToastType, string> = {
    xp: "⚡",
    streak: "🔥",
    level: "🎯",
    complete: "✅",
};

const ICON_CLASS: Record<ToastType, string> = {
    xp: styles.toastIconXp,
    streak: styles.toastIconStreak,
    level: styles.toastIconLevel,
    complete: styles.toastIconComplete,
};

let globalAddToast: ((toast: Omit<Toast, "id">) => void) | null = null;

/**
 * Show an XP/achievement toast from anywhere in the app.
 */
export function showToast(toast: Omit<Toast, "id">) {
    globalAddToast?.(toast);
}

/**
 * Convenience functions for common toasts.
 */
export const toasts = {
    xp: (amount: number, reason?: string) =>
        showToast({
            type: "xp",
            title: `+${amount} XP`,
            subtitle: reason || "Keep learning!",
            amount,
        }),
    streak: (days: number) =>
        showToast({
            type: "streak",
            title: `${days}-Day Streak! 🔥`,
            subtitle: "You're on fire!",
        }),
    levelUp: (level: number) =>
        showToast({
            type: "level",
            title: `Level ${level} Reached!`,
            subtitle: "Congratulations!",
        }),
    lessonComplete: () =>
        showToast({
            type: "complete",
            title: "Lesson Complete!",
            subtitle: "Great work!",
        }),
    quizPassed: (score: number) =>
        showToast({
            type: "xp",
            title: `Quiz Score: ${score}%`,
            subtitle: score >= 80 ? "Excellent!" : "Good effort!",
            amount: Math.round(score / 10) * 5,
        }),
};

/**
 * Toast container — mount once in layout.
 */
export default function XPToast() {
    const [toastList, setToastList] = useState<Toast[]>([]);

    const addToast = useCallback((toast: Omit<Toast, "id">) => {
        const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2)}`;
        setToastList((prev) => [...prev, { ...toast, id }]);

        // Auto-remove after animation
        setTimeout(() => {
            setToastList((prev) => prev.filter((t) => t.id !== id));
        }, 3200);
    }, []);

    useEffect(() => {
        globalAddToast = addToast;
        return () => {
            globalAddToast = null;
        };
    }, [addToast]);

    if (toastList.length === 0) return null;

    return (
        <div className={styles.toast}>
            {toastList.map((t) => (
                <div key={t.id} className={styles.toastItem}>
                    <div className={`${styles.toastIcon} ${ICON_CLASS[t.type]}`}>
                        {ICONS[t.type]}
                    </div>
                    <div className={styles.toastContent}>
                        <div className={styles.toastTitle}>{t.title}</div>
                        {t.subtitle && (
                            <div className={styles.toastSubtitle}>{t.subtitle}</div>
                        )}
                    </div>
                    {t.amount && (
                        <div className={styles.toastXpAmount}>+{t.amount}</div>
                    )}
                </div>
            ))}
        </div>
    );
}
