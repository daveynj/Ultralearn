import { createOpenAI } from "@ai-sdk/openai";

/**
 * OpenRouter client configured via Vercel AI SDK.
 * Uses the @ai-sdk/openai provider with a custom baseURL pointed at OpenRouter.
 */
const openrouter = createOpenAI({
    apiKey: process.env.OPENROUTER_API_KEY,
    baseURL: "https://openrouter.ai/api/v1",
    headers: {
        "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
        "X-Title": "UltraLearn",
    },
});

/**
 * Available models via OpenRouter — organized by use case.
 */
export const MODELS = {
    // Primary lesson generation — smart, creative
    LESSON_WRITER: "anthropic/claude-sonnet-4",

    // Planning & structuring — fast, capable
    PLANNER: "google/gemini-2.5-flash",

    // Quiz generation — fast, structured output
    QUIZ: "google/gemini-2.5-flash",

    // AI Tutor — conversational, empathetic
    TUTOR: "anthropic/claude-sonnet-4",

    // Fact checking — meticulous
    FACT_CHECKER: "google/gemini-2.5-flash",
} as const;

/**
 * Get a model instance for a specific use case.
 */
export function getModel(modelId: string) {
    return openrouter(modelId);
}

export default openrouter;

