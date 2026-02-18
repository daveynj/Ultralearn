"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { useChat } from "@ai-sdk/react";
import { TextStreamChatTransport } from "ai";
import { MessageCircle, X, Send } from "lucide-react";
import styles from "./chat-widget.module.css";

interface ChatWidgetProps {
    topic: string;
    lessonTitle?: string;
    lessonContent?: string;
}

/**
 * Extract text content from a UIMessage.
 * AI SDK v6 uses `parts` instead of `content`.
 */
function getMessageText(message: { content?: string; parts?: Array<{ type: string; text?: string }> }): string {
    // Try parts first (v6)
    if (message.parts) {
        return message.parts
            .filter((p: { type: string }) => p.type === "text")
            .map((p: { text?: string }) => p.text || "")
            .join("");
    }
    // Fallback to content (v5)
    return (message as { content?: string }).content || "";
}

/**
 * Floating AI Tutor chat widget.
 * Appears as a button in the bottom-right corner, expands into a chat panel.
 */
export default function ChatWidget({
    topic,
    lessonTitle,
    lessonContent,
}: ChatWidgetProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [inputValue, setInputValue] = useState("");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // AI SDK v6: use TextStreamChatTransport for text streaming
    const transport = useMemo(
        () =>
            new TextStreamChatTransport({
                api: "/api/chat/tutor",
                body: {
                    topic,
                    lessonTitle: lessonTitle || topic,
                    lessonContent: lessonContent || "",
                },
            }),
        [topic, lessonTitle, lessonContent]
    );

    const { messages, sendMessage, status } = useChat({ transport });

    const isLoading = status === "submitted" || status === "streaming";

    // Auto-scroll to bottom on new messages
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isLoading]);

    // Focus input when panel opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 200);
        }
    }, [isOpen]);

    const handleSend = useCallback(
        (text: string) => {
            const trimmed = text.trim();
            if (!trimmed || isLoading) return;
            setInputValue("");
            sendMessage({ text: trimmed });
        },
        [isLoading, sendMessage]
    );

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSend(inputValue);
        }
    };

    const suggestions = [
        `Explain ${topic} like I'm 10 years old`,
        `What's the most surprising fact about ${topic}?`,
        `Why is ${topic} important?`,
    ];

    return (
        <div className={styles.chatWidget}>
            {/* Chat Panel */}
            {isOpen && (
                <div className={styles.chatPanel}>
                    {/* Header */}
                    <div className={styles.chatHeader}>
                        <div className={styles.chatHeaderInfo}>
                            <div className={styles.chatAvatar}>🧠</div>
                            <div className={styles.chatHeaderText}>
                                <h3>AI Tutor</h3>
                                <p>Ask anything about {topic}</p>
                            </div>
                        </div>
                        <button
                            className={styles.closeBtn}
                            onClick={() => setIsOpen(false)}
                            aria-label="Close chat"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Messages */}
                    <div className={styles.chatMessages}>
                        {messages.length === 0 ? (
                            <div className={styles.welcome}>
                                <span className={styles.welcomeEmoji}>👋</span>
                                <h4>Hi there!</h4>
                                <p>
                                    I&apos;m your AI tutor. Ask me anything about{" "}
                                    <strong>{topic}</strong> — I&apos;ll guide you through it!
                                </p>
                                <div className={styles.suggestions}>
                                    {suggestions.map((s: string, i: number) => (
                                        <button
                                            key={i}
                                            className={styles.suggestionBtn}
                                            onClick={() => handleSend(s)}
                                        >
                                            {s}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            messages.map((message) => {
                                const text = getMessageText(message);
                                return (
                                    <div
                                        key={message.id}
                                        className={`${styles.message} ${message.role === "user"
                                            ? styles.messageUser
                                            : styles.messageAssistant
                                            }`}
                                    >
                                        {message.role === "assistant" && (
                                            <div className={styles.assistantIcon}>🧠</div>
                                        )}
                                        <div className={styles.messageBubble}>
                                            {text.split("\n").map((line: string, i: number) => (
                                                <p key={i}>{line || "\u00A0"}</p>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })
                        )}

                        {/* Typing indicator */}
                        {isLoading && (
                            <div className={styles.typing}>
                                <div className={styles.assistantIcon}>🧠</div>
                                <div className={styles.typingDots}>
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                    <div className={styles.typingDot} />
                                </div>
                            </div>
                        )}

                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className={styles.chatInput}>
                        <textarea
                            ref={inputRef}
                            className={styles.inputField}
                            placeholder="Ask a question..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            rows={1}
                        />
                        <button
                            type="button"
                            className={styles.sendBtn}
                            disabled={!inputValue.trim() || isLoading}
                            onClick={() => handleSend(inputValue)}
                            aria-label="Send message"
                        >
                            <Send size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button
                className={styles.toggleBtn}
                onClick={() => setIsOpen(!isOpen)}
                aria-label={isOpen ? "Close AI Tutor" : "Open AI Tutor"}
            >
                {!isOpen && <div className={styles.toggleBtnPulse} />}
                {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
            </button>
        </div>
    );
}
