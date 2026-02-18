import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel, MODELS } from "@/lib/ai/openrouter";
import {
    LESSON_PLANNER_SYSTEM,
    buildLessonPlanPrompt,
    LESSON_PLANNER_CONFIG,
} from "@/prompts/lesson-planner";

/**
 * POST /api/generate/plan
 * 
 * Generates a lesson plan or course syllabus from a topic.
 * Returns structured JSON that can be previewed/edited before content generation.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, mode } = body;

        if (!topic || !mode) {
            return NextResponse.json(
                { error: "Topic and mode are required" },
                { status: 400 }
            );
        }

        if (!["flash", "deep_dive"].includes(mode)) {
            return NextResponse.json(
                { error: "Mode must be 'flash' or 'deep_dive'" },
                { status: 400 }
            );
        }

        // Generate the lesson plan using AI
        const { text } = await generateText({
            model: getModel(MODELS.PLANNER),
            system: LESSON_PLANNER_SYSTEM,
            prompt: buildLessonPlanPrompt(topic, mode),
            temperature: LESSON_PLANNER_CONFIG.temperature,
            maxOutputTokens: LESSON_PLANNER_CONFIG.maxOutputTokens,
        });

        // Parse the JSON from the AI response
        const plan = parseJsonFromAI(text);

        if (!plan) {
            return NextResponse.json(
                { error: "Failed to parse lesson plan from AI response" },
                { status: 500 }
            );
        }

        // Generate a simple plan ID (in production, save to database)
        const planId = generatePlanId();

        // Store plan in memory for now (in production, use database)
        // We'll pass it via URL params / session storage for the MVP
        return NextResponse.json({
            planId,
            plan,
            mode,
            topic,
        });
    } catch (error) {
        console.error("Error generating plan:", error);
        return NextResponse.json(
            { error: "Failed to generate lesson plan" },
            { status: 500 }
        );
    }
}

/**
 * Parse JSON from AI response, handling markdown code blocks.
 */
function parseJsonFromAI(text: string): Record<string, unknown> | null {
    try {
        // Try direct parse first
        return JSON.parse(text);
    } catch {
        // Try extracting from markdown code block
        const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (jsonMatch) {
            try {
                return JSON.parse(jsonMatch[1].trim());
            } catch {
                return null;
            }
        }

        // Try finding JSON object in text
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

function generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}
