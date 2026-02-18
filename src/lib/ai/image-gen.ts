/**
 * Image Generation Service
 * 
 * Supports Stability AI and Runware AI with automatic fallback.
 * Generates contextual images for lessons based on rich prompt descriptions.
 */

export interface ImageGenerationResult {
    url: string;
    provider: "stability" | "runware";
    prompt: string;
}

/**
 * Generate an image using Stability AI (primary) with Runware fallback.
 */
export async function generateImage(
    prompt: string,
    options: {
        width?: number;
        height?: number;
        style?: "photographic" | "digital-art" | "cinematic" | "anime" | "illustration";
    } = {}
): Promise<ImageGenerationResult> {
    const { width = 1024, height = 1024, style = "digital-art" } = options;

    // Enhance prompt with style guidance
    const enhancedPrompt = `${prompt}. Style: ${style}, high quality, detailed, professional, educational illustration`;

    // Check if any image generation API keys are configured
    const hasStability = !!process.env.STABILITY_AI_API_KEY;
    const hasRunware = !!process.env.RUNWARE_API_KEY;

    if (hasStability) {
        try {
            const result = await generateWithStability(enhancedPrompt, width, height);
            return { url: result, provider: "stability", prompt: enhancedPrompt };
        } catch (error) {
            console.warn("Stability AI failed:", error);
        }
    }

    if (hasRunware) {
        try {
            const result = await generateWithRunware(enhancedPrompt, width, height);
            return { url: result, provider: "runware", prompt: enhancedPrompt };
        } catch (error) {
            console.warn("Runware failed:", error);
        }
    }

    // Fallback: use Unsplash for a relevant placeholder image
    console.log("No image API keys configured — using Unsplash fallback");
    const searchTerms = prompt
        .split(/[.,;:!?]+/)[0] // Take first phrase
        .replace(/Style:.*$/, "") // Remove style suffix
        .trim()
        .split(" ")
        .slice(0, 4) // Max 4 words for search
        .join(" ");
    const unsplashUrl = `https://source.unsplash.com/featured/${width}x${height}/?${encodeURIComponent(searchTerms)}`;
    return { url: unsplashUrl, provider: "stability" as const, prompt: searchTerms };
}

/**
 * Generate multiple images in parallel for a lesson.
 */
export async function generateLessonImages(
    imagePrompts: { sectionIndex: number; prompt: string }[]
): Promise<Map<number, ImageGenerationResult>> {
    const results = new Map<number, ImageGenerationResult>();

    const promises = imagePrompts.map(async ({ sectionIndex, prompt }) => {
        try {
            const result = await generateImage(prompt, {
                width: 1024,
                height: 768,
                style: "digital-art",
            });
            results.set(sectionIndex, result);
        } catch (error) {
            console.error(`Failed to generate image for section ${sectionIndex}:`, error);
            // Don't throw — allow partial results
        }
    });

    await Promise.allSettled(promises);
    return results;
}

// ---- Provider Implementations ----

async function generateWithStability(
    prompt: string,
    width: number,
    height: number
): Promise<string> {
    const apiKey = process.env.STABILITY_AI_API_KEY;
    if (!apiKey) throw new Error("STABILITY_AI_API_KEY not configured");

    const response = await fetch(
        "https://api.stability.ai/v2beta/stable-image/generate/sd3",
        {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                Accept: "application/json",
            },
            body: (() => {
                const formData = new FormData();
                formData.append("prompt", prompt);
                formData.append("output_format", "webp");
                formData.append("aspect_ratio", width > height ? "16:9" : width < height ? "9:16" : "1:1");
                return formData;
            })(),
        }
    );

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Stability AI error: ${response.status} — ${error}`);
    }

    const data = await response.json();

    // Stability returns base64 — we'd normally upload to storage
    // For now, return as data URI
    if (data.image) {
        return `data:image/webp;base64,${data.image}`;
    }

    throw new Error("No image returned from Stability AI");
}

async function generateWithRunware(
    prompt: string,
    width: number,
    height: number
): Promise<string> {
    const apiKey = process.env.RUNWARE_API_KEY;
    if (!apiKey) throw new Error("RUNWARE_API_KEY not configured");

    const response = await fetch("https://api.runware.ai/v1/images/generations", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify([
            {
                taskType: "imageInference",
                taskUUID: crypto.randomUUID(),
                positivePrompt: prompt,
                width: Math.min(width, 1024),
                height: Math.min(height, 1024),
                numberResults: 1,
                outputFormat: "WEBP",
            },
        ]),
    });

    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Runware error: ${response.status} — ${error}`);
    }

    const data = await response.json();

    if (data?.data?.[0]?.imageURL) {
        return data.data[0].imageURL;
    }

    throw new Error("No image returned from Runware");
}
