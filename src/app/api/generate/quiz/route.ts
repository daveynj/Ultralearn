import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { getModel, MODELS } from "@/lib/ai/openrouter";
import {
    QUIZ_MASTER_SYSTEM,
    buildQuizPrompt,
    QUIZ_MASTER_CONFIG,
} from "@/prompts/quiz-master";

/**
 * POST /api/generate/quiz
 * 
 * Generates quiz questions from lesson content.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, lessonContent, questionCount = 5 } = body;

        if (!topic || !lessonContent) {
            return NextResponse.json(
                { error: "Topic and lesson content are required" },
                { status: 400 }
            );
        }

        const { text } = await generateText({
            model: getModel(MODELS.QUIZ),
            system: QUIZ_MASTER_SYSTEM,
            prompt: buildQuizPrompt(topic, lessonContent, questionCount),
            temperature: QUIZ_MASTER_CONFIG.temperature,
            maxOutputTokens: QUIZ_MASTER_CONFIG.maxOutputTokens,
        });

        const quiz = parseJsonFromAI(text);

        if (!quiz) {
            return NextResponse.json(
                { error: "Failed to parse quiz from AI response" },
                { status: 500 }
            );
        }

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("Error generating quiz:", error);
        return NextResponse.json(
            { error: "Failed to generate quiz" },
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
