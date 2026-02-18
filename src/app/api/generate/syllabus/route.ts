import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel, MODELS } from "@/lib/ai/openrouter";
import {
    LESSON_PLANNER_SYSTEM,
    buildLessonPlanPrompt,
    LESSON_PLANNER_CONFIG,
} from "@/prompts/lesson-planner";

/**
 * POST /api/generate/syllabus
 * 
 * Generates a full Deep Dive Course syllabus from a topic.
 * Returns structured JSON with modules and lessons.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic } = body;

        if (!topic) {
            return NextResponse.json(
                { error: "Topic is required" },
                { status: 400 }
            );
        }

        const { text } = await generateText({
            model: getModel(MODELS.PLANNER),
            system: LESSON_PLANNER_SYSTEM,
            prompt: buildLessonPlanPrompt(topic, "deep_dive"),
            temperature: LESSON_PLANNER_CONFIG.temperature,
            maxOutputTokens: LESSON_PLANNER_CONFIG.maxOutputTokens,
        });

        const syllabus = parseJsonFromAI(text);

        if (!syllabus) {
            return NextResponse.json(
                { error: "Failed to parse syllabus from AI response" },
                { status: 500 }
            );
        }

        const planId = `syllabus_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

        return NextResponse.json({
            planId,
            syllabus,
            topic,
        });
    } catch (error) {
        console.error("Error generating syllabus:", error);
        return NextResponse.json(
            { error: "Failed to generate syllabus" },
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
