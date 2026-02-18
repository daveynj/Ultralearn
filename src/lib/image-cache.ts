/**
 * Server-side image cache.
 * 
 * Stores generated images in memory so the client can reference them
 * via /api/images/[id] instead of passing huge base64 strings through
 * sessionStorage.
 */

import crypto from "crypto";

interface CachedImage {
    data: Buffer;
    contentType: string;
    createdAt: number;
}

// In-memory store — survives hot reload via globalThis
const globalForCache = globalThis as unknown as {
    __imageCache?: Map<string, CachedImage>;
};

const cache = globalForCache.__imageCache ?? new Map<string, CachedImage>();
globalForCache.__imageCache = cache;

const TTL_MS = 60 * 60 * 1000; // 1 hour

/**
 * Store a base64 data URI and return a serveable URL path.
 */
export function storeImage(dataUri: string): string {
    const id = crypto.randomUUID();

    // Parse data URI: "data:image/webp;base64,AAAA..."
    const match = dataUri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) {
        // Not a data URI — it's already a regular URL, return as-is
        return dataUri;
    }

    const contentType = match[1];
    const data = Buffer.from(match[2], "base64");

    cache.set(id, { data, contentType, createdAt: Date.now() });

    // Lazy cleanup of expired entries
    cleanup();

    return `/api/images/${id}`;
}

/**
 * Retrieve a cached image by ID.
 */
export function getImage(id: string): CachedImage | null {
    const entry = cache.get(id);
    if (!entry) return null;

    // Check TTL
    if (Date.now() - entry.createdAt > TTL_MS) {
        cache.delete(id);
        return null;
    }

    return entry;
}

/**
 * Remove expired entries (runs lazily on each store).
 */
function cleanup() {
    const now = Date.now();
    for (const [id, entry] of cache.entries()) {
        if (now - entry.createdAt > TTL_MS) {
            cache.delete(id);
        }
    }
}
