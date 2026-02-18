"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import styles from "./signin.module.css";

export default function SignInPage() {
    const router = useRouter();
    const [isSignUp, setIsSignUp] = useState(false);
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleGoogleSignIn = () => {
        signIn("google", { callbackUrl: "/dashboard" });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        try {
            if (isSignUp) {
                // Register first
                const registerRes = await fetch("/api/auth/register", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ name, email, password }),
                });

                const registerData = await registerRes.json();

                if (!registerRes.ok) {
                    setError(registerData.error || "Failed to create account");
                    setIsLoading(false);
                    return;
                }
            }

            // Sign in with credentials
            const result = await signIn("credentials", {
                email,
                password,
                redirect: false,
            });

            if (result?.error) {
                setError("Invalid email or password");
                setIsLoading(false);
                return;
            }

            router.push("/dashboard");
        } catch {
            setError("Something went wrong. Please try again.");
            setIsLoading(false);
        }
    };

    return (
        <div className={styles.authPage}>
            <div className={styles.authCard}>
                {/* Logo */}
                <div className={styles.logo}>
                    <span className={styles.logoText}>
                        <span className="text-gradient">Ultra</span>Learn
                    </span>
                </div>

                <h1 className={styles.authTitle}>
                    {isSignUp ? "Create an account" : "Welcome back"}
                </h1>
                <p className={styles.authSubtitle}>
                    {isSignUp
                        ? "Start your learning journey today"
                        : "Sign in to continue learning"}
                </p>

                {/* Google Sign In */}
                <button className={styles.providerBtn} onClick={handleGoogleSignIn}>
                    <svg className={styles.providerIcon} viewBox="0 0 24 24">
                        <path
                            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                            fill="#4285F4"
                        />
                        <path
                            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            fill="#34A853"
                        />
                        <path
                            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            fill="#FBBC05"
                        />
                        <path
                            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            fill="#EA4335"
                        />
                    </svg>
                    Continue with Google
                </button>

                {/* Divider */}
                <div className={styles.divider}>or</div>

                {/* Email/Password Form */}
                <form className={styles.form} onSubmit={handleSubmit}>
                    {isSignUp && (
                        <div className={styles.fieldGroup}>
                            <label className={styles.label} htmlFor="name">Name</label>
                            <input
                                id="name"
                                type="text"
                                className={styles.input}
                                placeholder="Your name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                            />
                        </div>
                    )}

                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="email">Email</label>
                        <input
                            id="email"
                            type="email"
                            className={styles.input}
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label className={styles.label} htmlFor="password">Password</label>
                        <input
                            id="password"
                            type="password"
                            className={styles.input}
                            placeholder="At least 8 characters"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={8}
                        />
                    </div>

                    {error && <div className={styles.error}>{error}</div>}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={isLoading}
                    >
                        {isLoading
                            ? "Please wait..."
                            : isSignUp
                                ? "Create Account"
                                : "Sign In"}
                    </button>
                </form>

                {/* Footer */}
                <div className={styles.footer}>
                    {isSignUp ? "Already have an account? " : "Don't have an account? "}
                    <button
                        className={styles.footerLink}
                        onClick={() => {
                            setIsSignUp(!isSignUp);
                            setError(null);
                        }}
                    >
                        {isSignUp ? "Sign in" : "Sign up"}
                    </button>
                </div>
            </div>
        </div>
    );
}
