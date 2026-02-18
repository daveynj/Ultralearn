import NextAuth from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import prisma from "@/lib/db";

/**
 * Try to create PrismaAdapter – if DB is unreachable we fall back
 * to pure JWT sessions (no persistence).
 */
function getAdapter() {
    try {
        return PrismaAdapter(prisma);
    } catch {
        console.warn("PrismaAdapter failed to initialise — running without DB adapter");
        return undefined;
    }
}

/**
 * Auth.js v5 configuration for UltraLearn.
 * Supports Google OAuth and Email/Password sign-in.
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
    adapter: getAdapter(),
    session: { strategy: "jwt" },
    pages: {
        signIn: "/auth/signin",
        error: "/auth/error",
    },
    providers: [
        Google({
            clientId: process.env.AUTH_GOOGLE_ID || "",
            clientSecret: process.env.AUTH_GOOGLE_SECRET || "",
        }),
        Credentials({
            name: "Email",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) return null;

                try {
                    const user = await prisma.user.findUnique({
                        where: { email: credentials.email as string },
                    });

                    if (!user || !user.passwordHash) return null;

                    const isValid = await bcrypt.compare(
                        credentials.password as string,
                        user.passwordHash
                    );

                    if (!isValid) return null;

                    return {
                        id: user.id,
                        email: user.email,
                        name: user.name,
                        image: user.image,
                    };
                } catch (error) {
                    console.error("Auth credentials error (DB may be unavailable):", error);
                    return null;
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (session.user && token.id) {
                session.user.id = token.id as string;
            }
            return session;
        },
    },
});

