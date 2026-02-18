import { NextRequest, NextResponse } from "next/server";
import { getImage } from "@/lib/image-cache";

/**
 * GET /api/images/[id]
 * 
 * Serves a cached image by ID. Images are stored in server memory
 * after generation to avoid sending huge base64 strings to the client.
 */
export async function GET(
    _req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const image = getImage(id);

    if (!image) {
        return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    return new NextResponse(new Uint8Array(image.data), {
        headers: {
            "Content-Type": image.contentType,
            "Cache-Control": "public, max-age=86400, immutable",
        },
    });
}
