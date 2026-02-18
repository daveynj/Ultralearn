import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel, MODELS } from "@/lib/ai/openrouter";
import {
    LESSON_WRITER_SYSTEM,
    buildLessonContentPrompt,
    LESSON_WRITER_CONFIG,
} from "@/prompts/lesson-writer";
import {
    IMAGE_DESCRIBER_SYSTEM,
    buildImagePromptsRequest,
    IMAGE_DESCRIBER_CONFIG,
} from "@/prompts/image-describer";
import { generateImage } from "@/lib/ai/image-gen";
import { storeImage } from "@/lib/image-cache";
import type { FlashLessonPlan, LessonContent, ImagePromptSet } from "@/lib/types";

/**
 * POST /api/generate/lesson
 * 
 * Generates full lesson content from a confirmed plan.
 * Runs text generation and image generation in parallel.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, plan } = body as { topic: string; plan: FlashLessonPlan };

        if (!topic || !plan) {
            return NextResponse.json(
                { error: "Topic and plan are required" },
                { status: 400 }
            );
        }

        // Run text content and image prompts generation in parallel
        const [contentResult, imagePromptsResult] = await Promise.all([
            // Generate lesson text content
            generateText({
                model: getModel(MODELS.LESSON_WRITER),
                system: LESSON_WRITER_SYSTEM,
                prompt: buildLessonContentPrompt(topic, plan),
                temperature: LESSON_WRITER_CONFIG.temperature,
                maxOutputTokens: LESSON_WRITER_CONFIG.maxOutputTokens,
            }),

            // Generate image prompts
            generateText({
                model: getModel(MODELS.PLANNER),
                system: IMAGE_DESCRIBER_SYSTEM,
                prompt: buildImagePromptsRequest(topic, plan.sections),
                temperature: IMAGE_DESCRIBER_CONFIG.temperature,
                maxOutputTokens: IMAGE_DESCRIBER_CONFIG.maxOutputTokens,
            }),
        ]);

        // Parse content
        const content = parseJsonFromAI(contentResult.text) as unknown as LessonContent;
        if (!content) {
            return NextResponse.json(
                { error: "Failed to parse lesson content" },
                { status: 500 }
            );
        }

        // Parse image prompts and generate images
        const imagePrompts = parseJsonFromAI(imagePromptsResult.text) as unknown as ImagePromptSet;

        let imageUrls: Record<number, string> = {};

        if (imagePrompts?.images) {
            // Generate images in parallel (limit concurrency to 3)
            const imageResults = await Promise.allSettled(
                imagePrompts.images.slice(0, 6).map(async (img) => {
                    const fullPrompt = `${imagePrompts.style}. ${img.prompt}`;
                    const result = await generateImage(fullPrompt, {
                        width: img.aspectRatio === "16:9" ? 1024 : img.aspectRatio === "4:3" ? 1024 : 1024,
                        height: img.aspectRatio === "16:9" ? 576 : img.aspectRatio === "4:3" ? 768 : 1024,
                        style: "digital-art",
                    });
                    return { sectionIndex: img.sectionIndex, url: storeImage(result.url) };
                })
            );

            for (const result of imageResults) {
                if (result.status === "fulfilled") {
                    imageUrls[result.value.sectionIndex] = result.value.url;
                }
            }
        }

        // Merge images into content sections
        if (content.sections) {
            content.sections = content.sections.map((section, index) => ({
                ...section,
                imageUrl: imageUrls[index] || undefined,
            }));
        }

        return NextResponse.json({
            content,
            imageCount: Object.keys(imageUrls).length,
        });
    } catch (error) {
        console.error("Error generating lesson:", error);
        return NextResponse.json(
            { error: "Failed to generate lesson content" },
            { status: 500 }
        );
    }
}

function parseJsonFromAI(text: string): Record<string, unknown> | null {
    try {
        return JSON.parse(text);
    } catch {
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch {
                return null;
            }
        }
        const objectMatch = text.match(/\{[\s\S]*\}/);
        if (objectMatch) {
            try {
                return JSON.parse(objectMatch[0]);
            } catch {
                return null;
            }
        }
        return null;
    }
}
