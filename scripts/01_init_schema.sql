-- Create enum types
CREATE TYPE "LessonType" AS ENUM ('FLASH', 'COURSE_LESSON');

-- ---- User & Auth ----
CREATE TABLE "users" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "email" TEXT NOT NULL UNIQUE,
  "name" TEXT,
  "image" TEXT,
  "passwordHash" TEXT,
  "xp" INTEGER NOT NULL DEFAULT 0,
  "streakDays" INTEGER NOT NULL DEFAULT 0,
  "lastActiveAt" TIMESTAMP(3),
  "plan" TEXT NOT NULL DEFAULT 'free',
  "stripeCustomerId" TEXT UNIQUE,
  "stripeSubscriptionId" TEXT,
  "planExpiresAt" TIMESTAMP(3),
  "freeCredits" INTEGER NOT NULL DEFAULT 3,
  "creditsUsed" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE "accounts" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "providerAccountId" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "accounts_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "accounts_provider_providerAccountId_key" ON "accounts"("provider", "providerAccountId");

CREATE TABLE "sessions" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "sessionToken" TEXT NOT NULL UNIQUE,
  "userId" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE
);

CREATE TABLE "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL UNIQUE,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "verification_tokens_identifier_token_key" UNIQUE ("identifier", "token")
);

-- ---- Lessons (Flash Lessons) ----
CREATE TABLE "lessons" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "topic" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "type" "LessonType" NOT NULL DEFAULT 'FLASH',
  "plan" JSONB NOT NULL,
  "content" JSONB NOT NULL,
  "coverImageUrl" TEXT,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 5,
  "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "moduleId" TEXT,
  "moduleOrder" INTEGER
);

CREATE INDEX "lessons_topic_idx" ON "lessons"("topic");
CREATE INDEX "lessons_slug_idx" ON "lessons"("slug");

-- ---- Courses (Deep Dive) ----
CREATE TABLE "courses" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "topic" TEXT NOT NULL,
  "slug" TEXT NOT NULL UNIQUE,
  "syllabus" JSONB NOT NULL,
  "description" TEXT NOT NULL,
  "coverImageUrl" TEXT,
  "estimatedMinutes" INTEGER NOT NULL DEFAULT 60,
  "moduleCount" INTEGER NOT NULL DEFAULT 0,
  "lessonCount" INTEGER NOT NULL DEFAULT 0,
  "difficulty" TEXT NOT NULL DEFAULT 'intermediate',
  "tags" TEXT[],
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE INDEX "courses_topic_idx" ON "courses"("topic");
CREATE INDEX "courses_slug_idx" ON "courses"("slug");

-- ---- Modules ----
CREATE TABLE "modules" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "courseId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "description" TEXT,
  "order" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "modules_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE
);

CREATE INDEX "modules_courseId_idx" ON "modules"("courseId");

-- Add foreign key to lessons for module
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE SET NULL;

-- ---- Quizzes ----
CREATE TABLE "quizzes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "lessonId" TEXT UNIQUE,
  "moduleId" TEXT UNIQUE,
  "questions" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "quizzes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE,
  CONSTRAINT "quizzes_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "modules" ("id") ON DELETE CASCADE
);

-- ---- User Progress ----
CREATE TABLE "lesson_progress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "quizScore" INTEGER,
  "quizAnswers" JSONB,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "lesson_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_progress_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE,
  CONSTRAINT "lesson_progress_userId_lessonId_key" UNIQUE ("userId", "lessonId")
);

CREATE TABLE "course_progress" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "courseId" TEXT NOT NULL,
  "currentModule" INTEGER NOT NULL DEFAULT 0,
  "currentLesson" INTEGER NOT NULL DEFAULT 0,
  "completionPct" DOUBLE PRECISION NOT NULL DEFAULT 0,
  "completed" BOOLEAN NOT NULL DEFAULT false,
  "xpEarned" INTEGER NOT NULL DEFAULT 0,
  "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "completedAt" TIMESTAMP(3),
  CONSTRAINT "course_progress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "course_progress_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE,
  CONSTRAINT "course_progress_userId_courseId_key" UNIQUE ("userId", "courseId")
);

-- ---- Bookmarks & Notes ----
CREATE TABLE "bookmarks" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "highlightText" TEXT,
  "sectionIndex" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "bookmarks_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "bookmarks_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE,
  CONSTRAINT "bookmarks_userId_lessonId_sectionIndex_key" UNIQUE ("userId", "lessonId", "sectionIndex")
);

CREATE TABLE "notes" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "sectionIndex" INTEGER,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "notes_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "notes_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE
);

-- ---- AI Tutor Chat ----
CREATE TABLE "chat_messages" (
  "id" TEXT NOT NULL PRIMARY KEY,
  "userId" TEXT NOT NULL,
  "lessonId" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "content" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "chat_messages_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users" ("id") ON DELETE CASCADE,
  CONSTRAINT "chat_messages_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "lessons" ("id") ON DELETE CASCADE
);

CREATE INDEX "chat_messages_userId_lessonId_idx" ON "chat_messages"("userId", "lessonId");
