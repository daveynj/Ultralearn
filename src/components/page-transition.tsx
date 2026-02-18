"use client";

import { useEffect, useState } from "react";

/**
 * Page transition wrapper — fade-in + slide-up on mount.
 */
export default function PageTransition({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        // Small delay for mount animation
        const timer = requestAnimationFrame(() => setIsVisible(true));
        return () => cancelAnimationFrame(timer);
    }, []);

    return (
        <div
            style={{
                opacity: isVisible ? 1 : 0,
                transform: isVisible ? "translateY(0)" : "translateY(16px)",
                transition: "opacity 0.4s ease-out, transform 0.4s ease-out",
            }}
        >
            {children}
        </div>
    );
}
