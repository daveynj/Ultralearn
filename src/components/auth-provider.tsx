"use client";

import { SessionProvider } from "next-auth/react";

/**
 * Wraps the app with Auth.js session provider for client-side session access.
 */
export default function AuthProvider({
    children,
}: {
    children: React.ReactNode;
}) {
    return <SessionProvider>{children}</SessionProvider>;
}
