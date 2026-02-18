import { streamText } from "ai";
import { NextRequest } from "next/server";
import { getModel, MODELS } from "@/lib/ai/openrouter";
import { TUTOR_SYSTEM, TUTOR_CONFIG } from "@/prompts/tutor";

/**
 * POST /api/chat/tutor
 * 
 * Streaming AI Tutor chat endpoint.
 * Accepts lesson context + message history, returns a streamed response.
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { topic, lessonTitle, lessonContent, messages } = body;

        if (!topic || !messages || !Array.isArray(messages)) {
            return new Response(
                JSON.stringify({ error: "topic and messages are required" }),
                { status: 400, headers: { "Content-Type": "application/json" } }
            );
        }

        // Build system prompt with lesson context
        const systemPrompt = `${TUTOR_SYSTEM}

LESSON CONTEXT:
Topic: ${topic}
Lesson: ${lessonTitle || topic}

LESSON CONTENT:
${lessonContent || "No specific lesson content provided. Help the student with their question about the topic."}

Remember your Socratic approach — guide them to understanding rather than just providing answers. Be warm, encouraging, and genuinely helpful.`;

        // Convert messages to the expected format
        const chatMessages = messages.map(
            (m: { role: string; content: string }) => ({
                role: m.role as "user" | "assistant",
                content: m.content,
            })
        );

        const result = streamText({
            model: getModel(MODELS.TUTOR),
            system: systemPrompt,
            messages: chatMessages,
            temperature: TUTOR_CONFIG.temperature,
            maxOutputTokens: TUTOR_CONFIG.maxOutputTokens,
        });

        return result.toTextStreamResponse();
    } catch (error) {
        console.error("Tutor chat error:", error);
        return new Response(
            JSON.stringify({ error: "Failed to generate response" }),
            { status: 500, headers: { "Content-Type": "application/json" } }
        );
    }
}
