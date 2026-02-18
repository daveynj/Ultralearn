import styles from "./loading-states.module.css";

/**
 * Animated orb loader — used for AI generation states.
 */
export function OrbLoader({
    text = "Generating...",
    subtext,
}: {
    text?: string;
    subtext?: string;
}) {
    return (
        <div className={styles.loaderOverlay}>
            <div className={styles.orbContainer}>
                <div className={styles.orb} />
                <div className={styles.orbRing} />
                <div className={styles.orbCore} />
            </div>
            <div className={styles.loaderText}>{text}</div>
            {subtext && <div className={styles.loaderSubtext}>{subtext}</div>}
        </div>
    );
}

/**
 * Skeleton card loader.
 */
export function SkeletonCard({ lines = 3 }: { lines?: number }) {
    return (
        <div className={styles.skeletonCard}>
            <div className={`${styles.skeletonLine} ${styles.skeletonLineShort}`} />
            {Array.from({ length: lines }).map((_, i) => (
                <div
                    key={i}
                    className={`${styles.skeletonLine} ${i % 2 === 0 ? "" : styles.skeletonLineMedium
                        }`}
                    style={{ animationDelay: `${i * 0.1}s` }}
                />
            ))}
        </div>
    );
}

/**
 * Error fallback state.
 */
export function ErrorState({
    title = "Something went wrong",
    message = "Please try again later.",
    onRetry,
}: {
    title?: string;
    message?: string;
    onRetry?: () => void;
}) {
    return (
        <div className={styles.errorState}>
            <div className={styles.errorIcon}>⚠️</div>
            <h3 className={styles.errorTitle}>{title}</h3>
            <p className={styles.errorMessage}>{message}</p>
            {onRetry && (
                <button className="btn btn-primary" onClick={onRetry}>
                    Try Again
                </button>
            )}
        </div>
    );
}
