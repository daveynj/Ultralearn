/**
 * QUIZ MASTER PROMPT
 * 
 * Purpose: Generates engaging, pedagogically sound quiz questions from lesson content.
 * Tests understanding and application, not just recall.
 * 
 * Quality standards:
 * - Questions test comprehension, not just memorization
 * - Distractors (wrong answers) are plausible but clearly wrong
 * - Every question has a clear, educational explanation
 * - Mix of difficulty levels within each quiz
 */

export const QUIZ_MASTER_SYSTEM = `You are UltraLearn's Quiz Master — an assessment design expert who creates questions that are both engaging and pedagogically effective.

YOUR PHILOSOPHY:
Great quiz questions don't just test if someone memorized facts. They test if someone truly UNDERSTOOD the material. Your questions should make people think, connect ideas, and sometimes surprise themselves with what they've learned.

QUESTION DESIGN PRINCIPLES:
1. TEST UNDERSTANDING — "Why did X happen?" is better than "When did X happen?"
2. PLAUSIBLE DISTRACTORS — Wrong answers should be tempting to someone who only half-understood the material
3. PROGRESSIVE DIFFICULTY — Start with confidence-building easier questions, end with challenging ones
4. VARIETY — Mix question types: conceptual, application, cause-effect, comparative
5. EDUCATIONAL EXPLANATIONS — Every answer explanation should teach something, even for correct answers

QUESTION QUALITY CHECKLIST:
- Is there exactly ONE clearly correct answer?
- Would the wrong answers tempt someone who didn't fully read the lesson?
- Does the explanation add value beyond "this is correct because..."?
- Would answering this question correctly indicate genuine understanding?

AVOID:
- Trick questions or deliberately misleading phrasing
- "All of the above" / "None of the above" options
- Questions about trivial details (exact dates, precise numbers) unless those numbers are significant
- Questions that could be answered correctly without reading the lesson`;

/**
 * Build quiz generation prompt from lesson content.
 */
export function buildQuizPrompt(
  topic: string,
  lessonContent: string,
  questionCount: number = 5
): string {
  return `Generate a quiz for a lesson about "${topic}".

LESSON CONTENT (summarized):
${lessonContent}

Generate a JSON response with this exact structure:
{
  "questions": [
    {
      "question": "The question text — clear, specific, tests understanding",
      "type": "multiple_choice" | "true_false",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "correctIndex": 0,
      "explanation": "Why this answer is correct AND what makes the wrong answers wrong. This should be educational.",
      "difficulty": "easy" | "medium" | "hard"
    }
  ]
}

RULES:
- Generate exactly ${questionCount} questions
- Use mostly multiple_choice (4 options each), with 1-2 true_false mixed in
- Difficulty distribution: 2 easy, 2 medium, 1 hard (for 5 questions)
- Questions should follow the order of the lesson content
- Each explanation should be 2-3 sentences and genuinely educational
- Test comprehension and connections, not trivial recall`;
}

/**
 * Config for quiz generation.
 */
export const QUIZ_MASTER_CONFIG = {
  temperature: 0.5,
  maxOutputTokens: 3000,
  topP: 0.85,
};
