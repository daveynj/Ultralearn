/**
 * Shared types for the UltraLearn application.
 */

// ---- Lesson Plan Types ----

export interface FlashLessonPlan {
    title: string;
    subtitle: string;
    estimatedMinutes: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    tags: string[];
    learningObjectives: string[];
    sections: LessonPlanSection[];
    keyFacts: KeyFact[];
    timelineEvents?: TimelineEvent[];
}

export interface LessonPlanSection {
    title: string;
    subtitle: string;
    type:
    | "intro"
    | "context"
    | "key_concept"
    | "deep_insight"
    | "turning_point"
    | "impact"
    | "conclusion";
    imagePrompt: string;
}

export interface KeyFact {
    label: string;
    value: string;
}

export interface TimelineEvent {
    date: string;
    event: string;
    significance: string;
}

// ---- Lesson Content Types ----

export interface LessonContent {
    sections: LessonContentSection[];
    summary: string;
    furtherReading: string[];
}

export interface LessonContentSection {
    title: string;
    content: string; // Markdown formatted text
    didYouKnow: string | null;
    keyTakeaway: string | null;
    imageUrl?: string; // Populated after image generation
}

// ---- Course / Syllabus Types ----

export interface CourseSyllabus {
    title: string;
    subtitle: string;
    description: string;
    estimatedMinutes: number;
    difficulty: "beginner" | "intermediate" | "advanced";
    tags: string[];
    prerequisites: string[];
    learningObjectives: string[];
    modules: CourseModule[];
    coverImagePrompt: string;
}

export interface CourseModule {
    title: string;
    description: string;
    estimatedMinutes: number;
    lessons: CourseModuleLesson[];
}

export interface CourseModuleLesson {
    title: string;
    description: string;
    keyTopics: string[];
}

// ---- Quiz Types ----

export interface Quiz {
    questions: QuizQuestion[];
}

export interface QuizQuestion {
    question: string;
    type: "multiple_choice" | "true_false";
    options: string[];
    correctIndex: number;
    explanation: string;
    difficulty: "easy" | "medium" | "hard";
}

// ---- Image Generation ----

export interface ImagePromptSet {
    style: string;
    images: {
        sectionIndex: number;
        prompt: string;
        aspectRatio: "16:9" | "1:1" | "4:3";
    }[];
}

// ---- API Request/Response ----

export interface GeneratePlanRequest {
    topic: string;
    mode: "flash" | "deep_dive";
}

export interface GeneratePlanResponse {
    planId: string;
    plan: FlashLessonPlan | CourseSyllabus;
    mode: "flash" | "deep_dive";
}

export interface GenerateLessonRequest {
    topic: string;
    plan: FlashLessonPlan;
}

export interface GenerateQuizRequest {
    topic: string;
    lessonContent: string;
    questionCount?: number;
}
