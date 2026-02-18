"use client";

import { useState, useRef, useEffect } from "react";
import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { User, LogOut, LayoutDashboard } from "lucide-react";
import styles from "./navbar.module.css";

export default function Navbar() {
    const { data: session } = useSession();
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(e.target as Node)
            ) {
                setDropdownOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <>
            <nav className={styles.navbar}>
                <div className={styles.navLeft}>
                    <Link href="/" className={styles.logo}>
                        <span className="text-gradient">Ultra</span>Learn
                    </Link>
                </div>

                <div className={styles.navRight}>
                    <Link href="/pricing" className={styles.navLink}>
                        Pricing
                    </Link>
                    {session?.user ? (
                        <>
                            <Link href="/dashboard" className={styles.navLink}>
                                Dashboard
                            </Link>
                            <div className={styles.userMenu} ref={dropdownRef}>
                                <button
                                    className={styles.userBtn}
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                >
                                    <div className={styles.userAvatar}>
                                        {session.user.image ? (
                                            <img src={session.user.image} alt="" />
                                        ) : (
                                            (session.user.name?.[0] || session.user.email?.[0] || "U").toUpperCase()
                                        )}
                                    </div>
                                    {session.user.name || "User"}
                                </button>

                                {dropdownOpen && (
                                    <div className={styles.dropdown}>
                                        <Link
                                            href="/dashboard"
                                            className={styles.dropdownItem}
                                            onClick={() => setDropdownOpen(false)}
                                        >
                                            <LayoutDashboard size={16} />
                                            Dashboard
                                        </Link>
                                        <div className={styles.dropdownDivider} />
                                        <button
                                            className={styles.dropdownItem}
                                            onClick={() => signOut({ callbackUrl: "/" })}
                                        >
                                            <LogOut size={16} />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </>
                    ) : (
                        <Link href="/auth/signin" className={styles.signInBtn}>
                            <User size={14} style={{ display: "inline", marginRight: 4, verticalAlign: "middle" }} />
                            Sign In
                        </Link>
                    )}
                </div>
            </nav>
            {/* Spacer to prevent content from hiding behind fixed navbar */}
            <div className={styles.spacer} />
        </>
    );
}
