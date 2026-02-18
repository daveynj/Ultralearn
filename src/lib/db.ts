import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

/**
 * Singleton Prisma client — prevents multiple instances in dev with hot reload.
 * If DATABASE_URL is not set, creates a proxy that throws a clear error
 * on any query rather than crashing the entire server at import time.
 */
function createPrismaClient(): PrismaClient {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
        console.warn(
            "⚠ DATABASE_URL is not set — database features will be unavailable"
        );
        // Return a proxy that throws a helpful error on any method call
        return new Proxy({} as PrismaClient, {
            get(_target, prop) {
                // Allow toString / Symbol.toPrimitive etc. for debug
                if (typeof prop === "symbol" || prop === "then") return undefined;
                // Return a function that throws for any model access (user, lesson, etc.)
                return new Proxy(() => { }, {
                    get() {
                        return () => {
                            throw new Error(
                                `Database unavailable: DATABASE_URL is not configured. Set it in .env.local to enable database features.`
                            );
                        };
                    },
                    apply() {
                        throw new Error(
                            `Database unavailable: DATABASE_URL is not configured.`
                        );
                    },
                });
            },
        });
    }

    return new PrismaClient();
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

export default prisma;

