"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, Sparkles, Zap, BookOpen, Brain, ImageIcon, MessageCircle } from "lucide-react";
import styles from "./page.module.css";

const SUGGESTIONS = [
  "Anne Boleyn",
  "Quantum Physics",
  "Ancient Rome",
  "Neil Armstrong",
  "The Renaissance",
  "Black Holes",
  "Cleopatra",
  "How Computers Work",
  "The French Revolution",
  "DNA & Genetics",
];

export default function Home() {
  const router = useRouter();
  const [topic, setTopic] = useState("");
  const [mode, setMode] = useState<"flash" | "deep_dive">("flash");
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerate = () => {
    if (!topic.trim()) return;

    setIsLoading(true);
    const encodedTopic = encodeURIComponent(topic.trim());

    // Navigate directly—preview pages generate their own plans/syllabi
    if (mode === "flash") {
      router.push(`/lesson/preview?topic=${encodedTopic}`);
    } else {
      router.push(`/course/preview?topic=${encodedTopic}`);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && topic.trim()) {
      handleGenerate();
    }
  };

  return (
    <div className={styles.home}>
      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.badgeDot} />
          Powered by AI
        </div>

        <h1 className={styles.title}>
          Learn <span className="text-gradient">Anything</span>,<br />
          Instantly.
        </h1>

        <p className={styles.subtitle}>
          Type any topic — a subject, a person, an event, a concept — and get
          a rich, AI-generated learning experience with text and images.
        </p>

        {/* Search Input */}
        <div className={styles.searchSection}>
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} size={22} />
            <input
              id="topic-input"
              type="text"
              className={styles.searchInput}
              placeholder="What do you want to learn about?"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              autoFocus
            />
          </div>

          {/* Mode Selection */}
          <div className={styles.modeSection}>
            <button
              className={`${styles.modeCard} ${mode === "flash" ? styles.selected : ""}`}
              onClick={() => setMode("flash")}
            >
              <div className={styles.modeCardContent}>
                <span className={styles.modeIcon}>⚡</span>
                <div className={styles.modeTitle}>Flash Lesson</div>
                <div className={styles.modeDescription}>
                  Quick, condensed lesson with key insights and visuals
                </div>
                <span className={`${styles.modeBadge} ${styles.flashBadge}`}>
                  5-10 min
                </span>
              </div>
            </button>

            <button
              className={`${styles.modeCard} ${mode === "deep_dive" ? styles.selected : ""}`}
              onClick={() => setMode("deep_dive")}
            >
              <div className={styles.modeCardContent}>
                <span className={styles.modeIcon}>📚</span>
                <div className={styles.modeTitle}>Deep Dive Course</div>
                <div className={styles.modeDescription}>
                  Full curriculum with modules, lessons, and assessments
                </div>
                <span className={`${styles.modeBadge} ${styles.deepBadge}`}>
                  1-4 hours
                </span>
              </div>
            </button>
          </div>

          {/* Generate Button */}
          <button
            className={`${styles.generateBtn} ${isLoading ? styles.loading : ""}`}
            onClick={handleGenerate}
            disabled={!topic.trim() || isLoading}
          >
            {isLoading && <span className={styles.spinner} />}
            <Sparkles size={20} />
            Generate {mode === "flash" ? "Flash Lesson" : "Deep Dive Course"}
          </button>

          {/* Suggestions */}
          <div className={styles.suggestions}>
            {SUGGESTIONS.map((suggestion) => (
              <button
                key={suggestion}
                className={styles.suggestionChip}
                onClick={() => setTopic(suggestion)}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className={styles.features}>
        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconPurple}`}>
              <Brain size={24} />
            </div>
            <h3 className={styles.featureTitle}>AI-Powered Content</h3>
            <p className={styles.featureDescription}>
              Every lesson is uniquely generated by AI, tailored to your topic with
              accurate, engaging, storytelling-driven content.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconCyan}`}>
              <ImageIcon size={24} />
            </div>
            <h3 className={styles.featureTitle}>Rich Visuals</h3>
            <p className={styles.featureDescription}>
              AI-generated images bring every lesson to life — from historical scenes
              to scientific diagrams, each crafted for your topic.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={`${styles.featureIcon} ${styles.featureIconPink}`}>
              <MessageCircle size={24} />
            </div>
            <h3 className={styles.featureTitle}>AI Tutor Chat</h3>
            <p className={styles.featureDescription}>
              Ask follow-up questions, explore "what ifs", and deepen your understanding
              with a patient, knowledgeable AI tutor.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
