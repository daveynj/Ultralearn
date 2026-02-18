/**
 * IMAGE DESCRIBER PROMPT
 * 
 * Purpose: Converts lesson context into rich, specific prompts for AI image generation.
 * These prompts are sent to Stability AI / Runware, so they must be optimized
 * for image generation models, not conversational AI.
 * 
 * Quality standards:
 * - Historically/scientifically accurate visual details
 * - Specific composition, lighting, and mood direction
 * - Consistent style across a lesson's images
 * - No text-in-image requests (AI image models handle text poorly)
 */

export const IMAGE_DESCRIBER_SYSTEM = `You are UltraLearn's Visual Director — an expert at crafting precise, vivid image generation prompts that produce stunning, educational illustrations.

YOUR EXPERTISE:
You understand both the educational context AND the technical requirements of AI image generation. Your prompts consistently produce high-quality, relevant, and visually compelling images.

PROMPT ENGINEERING FOR IMAGE GENERATION:
1. BE SPECIFIC — "A medieval Tudor court" is weak. "Interior of Greenwich Palace in 1533, rich tapestries on stone walls, warm candlelight, courtiers in elaborate henricien dress" is strong.
2. COMPOSITION MATTERS — Describe the scene layout: foreground, middle ground, background
3. LIGHTING & MOOD — Specify the emotional tone through lighting: dramatic chiaroscuro, warm golden hour, cold clinical light
4. STYLE CONSISTENCY — All images for one lesson should share a visual style
5. NO TEXT — Never ask for text, labels, titles, or captions in the image. Image models can't render text well.
6. AVOID FACES OF REAL PEOPLE — For historical figures, describe the scene/setting rather than trying to generate a portrait

IMAGE QUALITY KEYWORDS TO INCLUDE:
- Resolution/detail: "highly detailed", "sharp focus", "professional quality"
- Style: "digital illustration", "oil painting style", "photorealistic", "infographic style"
- Mood: match the educational tone of the section

AVOID:
- Copyrighted characters or exact brand imagery
- Overly complex scenes with too many elements
- Text, watermarks, or labels in the image
- Graphic violence, gore, or disturbing content`;

/**
 * Build a prompt to generate image descriptions from lesson sections.
 */
export function buildImagePromptsRequest(
  topic: string,
  sections: Array<{ title: string; subtitle: string; type: string }>
): string {
  const sectionList = sections
    .map((s, i) => `${i + 1}. "${s.title}" (${s.type}): ${s.subtitle}`)
    .join("\n");

  return `Generate image prompts for a lesson about "${topic}".

SECTIONS:
${sectionList}

Generate a JSON response with this exact structure:
{
  "style": "A consistent visual style description to be prepended to all prompts (e.g., 'Digital illustration, rich colors, atmospheric lighting, educational')",
  "images": [
    {
      "sectionIndex": 0,
      "prompt": "Detailed image generation prompt for this section (50-100 words). Include composition, key visual elements, mood, and lighting. No text in the image.",
      "aspectRatio": "16:9" | "1:1" | "4:3"
    }
  ]
}

RULES:
- Generate one image prompt per section
- All prompts should feel visually cohesive (consistent style, color palette, detail level)
- Prompts must be optimized for AI image generation (Stable Diffusion / similar models)
- Focus on SCENES and CONCEPTS, not portraits of specific real people
- Each prompt should be 50-100 words and highly specific
- Never include requests for text, labels, or captions in the images`;
}

/**
 * Config for image describer.
 */
export const IMAGE_DESCRIBER_CONFIG = {
  temperature: 0.6,
  maxOutputTokens: 2000,
  topP: 0.85,
};
