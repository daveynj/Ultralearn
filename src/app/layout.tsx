import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import AuthProvider from "@/components/auth-provider";
import Navbar from "@/components/navbar";
import XPToast from "@/components/xp-toast";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "UltraLearn — Learn Anything, Instantly",
    template: "%s | UltraLearn",
  },
  description:
    "AI-powered learning platform. Enter any topic and get rich, multimedia educational content — from quick flash lessons to full in-depth courses.",
  keywords: [
    "learning",
    "AI",
    "education",
    "courses",
    "lessons",
    "AI tutor",
    "online learning",
    "flash lessons",
  ],
  authors: [{ name: "UltraLearn" }],
  openGraph: {
    type: "website",
    title: "UltraLearn — Learn Anything, Instantly",
    description:
      "AI-powered learning. Enter any topic, get expert-crafted lessons in seconds.",
    siteName: "UltraLearn",
  },
  twitter: {
    card: "summary_large_image",
    title: "UltraLearn — Learn Anything, Instantly",
    description:
      "AI-powered learning. Enter any topic, get expert-crafted lessons in seconds.",
  },
  robots: { index: true, follow: true },
};

export const viewport: Viewport = {
  themeColor: "#0a0a0f",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${inter.variable} ${jetbrainsMono.variable}`} suppressHydrationWarning>
        <AuthProvider>
          <Navbar />
          {children}
          <XPToast />
        </AuthProvider>
      </body>
    </html>
  );
}

