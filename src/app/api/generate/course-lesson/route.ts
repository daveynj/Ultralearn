import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel, MODELS } from "@/lib/ai/openrouter";
import {
    LESSON_WRITER_SYSTEM,
    LESSON_WRITER_CONFIG,
} from "@/prompts/lesson-writer";
import {
    IMAGE_DESCRIBER_SYSTEM,
    IMAGE_DESCRIBER_CONFIG,
} from "@/prompts/image-describer";
import { generateImage } from "@/lib/ai/image-gen";
import { storeImage } from "@/lib/image-cache";

/**
 * POST /api/generate/course-lesson
 * 
 * Generates content for a single lesson within a Deep Dive Course module.
 * Takes the lesson title, key topics, and course context.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { courseTopic, moduleTitle, lessonTitle, keyTopics, lessonIndex } = body;

        if (!courseTopic || !lessonTitle) {
            return NextResponse.json(
                { error: "Course topic and lesson title are required" },
                { status: 400 }
            );
        }

        // Generate lesson content
        const contentPrompt = `Write a detailed lesson for a course about "${courseTopic}".

MODULE: "${moduleTitle}"
LESSON: "${lessonTitle}"
KEY TOPICS TO COVER: ${(keyTopics || []).join(", ")}

Generate a JSON response with this exact structure:
{
  "sections": [
    {
      "title": "Section heading",
      "content": "Full written content (3-5 paragraphs of rich, engaging text in markdown format)",
      "didYouKnow": "Optional fascinating fact (or null)",
      "keyTakeaway": "Optional key takeaway (or null)"
    }
  ],
  "summary": "2-3 sentence summary of this lesson",
  "imagePrompt": "A detailed prompt for generating an image that represents this lesson's content"
}

INSTRUCTIONS:
- Write 3-4 sections with rich, engaging content
- Use storytelling and analogies — not dry textbook writing
- Include at least 1 "Did You Know?" fact
- Include at least 1 Key Takeaway
- Content should be roughly 800-1500 words total
- Write as part of a larger course — reference that this is one piece of a bigger journey`;

        // Generate content and image prompt in parallel
        const { text } = await generateText({
            model: getModel(MODELS.LESSON_WRITER),
            system: LESSON_WRITER_SYSTEM,
            prompt: contentPrompt,
            temperature: LESSON_WRITER_CONFIG.temperature,
            maxOutputTokens: LESSON_WRITER_CONFIG.maxOutputTokens,
        });

        const lessonContent = parseJsonFromAI(text);

        if (!lessonContent) {
            return NextResponse.json(
                { error: "Failed to parse lesson content" },
                { status: 500 }
            );
        }

        // Generate image for the lesson
        let imageUrl: string | null = null;
        const imagePrompt = (lessonContent as Record<string, unknown>).imagePrompt as string;

        if (imagePrompt) {
            try {
                const result = await generateImage(
                    `Educational illustration: ${imagePrompt}. Style: rich digital illustration, educational, detailed`,
                    { width: 1024, height: 576, style: "digital-art" }
                );
                imageUrl = storeImage(result.url);
            } catch (err) {
                console.warn("Failed to generate lesson image:", err);
            }
        }

        return NextResponse.json({
            content: lessonContent,
            imageUrl,
            lessonIndex,
        });
    } catch (error) {
        console.error("Error generating course lesson:", error);
        return NextResponse.json(
            { error: "Failed to generate course lesson" },
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
