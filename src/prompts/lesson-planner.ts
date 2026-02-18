/**
 * LESSON PLANNER PROMPT
 * 
 * Purpose: Generates a structured lesson plan / syllabus from a user's topic input.
 * Used for both Flash Lessons (single plan) and Deep Dive Courses (full syllabus).
 * 
 * Quality standards:
 * - Pedagogically sound progression (simple → complex)
 * - Appropriate scope for the chosen mode
 * - Engaging section titles that spark curiosity
 * - Clear learning objectives for each section
 */

export const LESSON_PLANNER_SYSTEM = `You are UltraLearn's Master Curriculum Designer — an expert educator with deep knowledge spanning every academic discipline, historical period, scientific field, and cultural domain.

YOUR ROLE:
You design extraordinary learning experiences. You don't just list facts — you craft a narrative journey that takes a learner from curiosity to understanding. Every lesson plan you create should feel like a story worth following.

YOUR PEDAGOGICAL PHILOSOPHY:
1. HOOK FIRST — Start with something surprising, counterintuitive, or emotionally compelling about the topic
2. BUILD CONTEXT — Establish the "why this matters" before diving into details
3. PROGRESSIVE DISCLOSURE — Layer complexity naturally, each section building on the last
4. CONNECT THE DOTS — Show how this topic connects to things the learner already knows
5. END WITH IMPACT — Close with the lasting significance, modern relevance, or mind-expanding takeaway

QUALITY RUBRIC (self-evaluate against these):
- Would a curious adult find this plan genuinely interesting? (not just informative, but INTERESTING)
- Does each section title make someone want to read more?
- Is there a satisfying narrative arc from start to finish?
- Have I avoided just listing facts chronologically and instead organized by insight and impact?

ANTI-HALLUCINATION DIRECTIVE:
- Only include information you are confident is accurate
- For contested or debated topics, note the debate rather than picking a side
- If a topic is outside well-established knowledge, say so honestly
- Include approximate dates/numbers rather than making up precise ones you're unsure about`;

/**
 * Build the user prompt for lesson planning.
 */
export function buildLessonPlanPrompt(
  topic: string,
  mode: "flash" | "deep_dive"
): string {
  if (mode === "flash") {
    return `Design a FLASH LESSON plan for the topic: "${topic}"

A Flash Lesson is a single, condensed learning experience (5-10 minutes to read). 

Generate a JSON response with this exact structure:
{
  "title": "An engaging, specific title (not just the topic name)",
  "subtitle": "A compelling one-line hook that makes someone want to read this",
  "estimatedMinutes": 5-10,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "tags": ["tag1", "tag2", "tag3"],
  "learningObjectives": ["What the reader will understand after this lesson"],
  "sections": [
    {
      "title": "Section title — intriguing, not generic",
      "subtitle": "Brief description of what this section covers",
      "type": "intro" | "context" | "key_concept" | "deep_insight" | "turning_point" | "impact" | "conclusion",
      "imagePrompt": "A detailed description of an image that would powerfully illustrate this section. Be specific about composition, era-appropriate details, mood, and visual style."
    }
  ],
  "keyFacts": [
    {
      "label": "Short label",
      "value": "Interesting fact or statistic"
    }
  ],
  "timelineEvents": [
    {
      "date": "Year or date",
      "event": "What happened",
      "significance": "Why it matters"
    }
  ]
}

Rules:
- Generate 4-6 sections with a narrative arc
- At least 4 key facts
- Timeline events only if the topic is historical (otherwise omit the array)
- Image prompts should be vivid and specific — they'll be sent to an AI image generator
- Section types should vary to create rhythm
- The first section MUST hook the reader immediately`;
  }

  // Deep Dive mode
  return `Design a DEEP DIVE COURSE syllabus for the topic: "${topic}"

A Deep Dive Course is a comprehensive, multi-module learning experience (1-4 hours total).

Generate a JSON response with this exact structure:
{
  "title": "An engaging course title",
  "subtitle": "A compelling description of what this course covers",
  "description": "2-3 sentence overview of the course and what makes it worth taking",
  "estimatedMinutes": 60-240,
  "difficulty": "beginner" | "intermediate" | "advanced",
  "tags": ["tag1", "tag2", "tag3"],
  "prerequisites": ["Any recommended prior knowledge, or empty array"],
  "learningObjectives": ["3-5 major things the learner will understand"],
  "modules": [
    {
      "title": "Module title — clear and engaging",
      "description": "What this module covers and why it matters",
      "estimatedMinutes": 15-30,
      "lessons": [
        {
          "title": "Lesson title within this module",
          "description": "Brief description",
          "keyTopics": ["topic1", "topic2"]
        }
      ]
    }
  ],
  "coverImagePrompt": "A detailed, compelling image prompt for the course cover"
}

Rules:
- Generate 4-8 modules, each with 2-4 lessons
- Modules should follow a clear progression from foundations to advanced topics
- Each module should feel like a satisfying mini-journey on its own
- The first module should be accessible and hook the learner
- The last module should tie everything together with synthesis and significance
- Total estimated time should feel achievable but substantial`;
}

/**
 * Temperature and model config for the planner.
 */
export const LESSON_PLANNER_CONFIG = {
  temperature: 0.7,
  maxOutputTokens: 4000,
  topP: 0.9,
};
