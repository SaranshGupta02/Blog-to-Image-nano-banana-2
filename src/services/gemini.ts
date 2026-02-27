import { GoogleGenAI, Type } from "@google/genai";
import { BlogSection, GenerationConfig } from "../types";

export async function summarizeSection(content: string): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Summarize the following blog section in 1-2 concise, engaging sentences suitable for a social media post. Focus on the core message.
    
    Section Content:
    ${content}`,
  });
  return response.text || "Could not generate summary.";
}

export async function generateIllustration(
  heading: string,
  summary: string,
  config: GenerationConfig
): Promise<string> {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });
  const stylePrompt = config.style === 'flat' 
    ? "Minimal flat illustration, clean lines, professional, modern, vector style, limited color palette."
    : "Modern digital illustration, high detail, professional editorial style, clean composition.";
  
  const lightingPrompt = config.isCinematicMode 
    ? "Dramatic cinematic lighting, high contrast, atmospheric, volumetric light." 
    : "Soft professional lighting.";

  const prompt = `A professional editorial illustration for a blog post titled "${heading}". 
  Subject: ${summary}. 
  Style: ${stylePrompt} 
  Lighting: ${lightingPrompt}
  Requirements: No text inside the image, clean composition, high quality, suitable for LinkedIn/Twitter.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-image-preview",
    contents: {
      parts: [{ text: prompt }],
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
        imageSize: "1K"
      },
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image generated");
}
