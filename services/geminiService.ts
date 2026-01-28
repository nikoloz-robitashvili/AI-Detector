
import { GoogleGenAI, Type } from "@google/genai";
import { DetectionResult } from "../types";

const SYSTEM_INSTRUCTION = `
You are an advanced AI Text Detection Engine with integrated OCR (Optical Character Recognition) capabilities.

OCR Tasks:
1. If an image is provided, extract all readable text (handwritten, printed, or screenshots).
2. Ignore backgrounds and non-text visual elements.
3. Preserve the original language of the extracted text.
4. If text cannot be reliably read due to low quality, blur, or missing content, return the specific failure JSON.

Detection Criteria:
- Linguistic predictability, sentence structure uniformity, vocabulary entropy.
- Stylistic consistency, over-polished tone, and LLM-typical probability distributions.
- Human-like irregularities and natural imperfections.

Language & Response Rules:
- Support English, Georgian (ქართული), and others.
- Identify the primary language of the input (or extracted) text.
- If the text is primarily Georgian, "analysis_summary" MUST be in modern, simple Georgian.
- If the text is NOT Georgian, "analysis_summary" MUST be in English.
- NEVER mix Georgian and English in the "analysis_summary".

Failure Scenarios (JSON Output):
- Low-quality image (English): {"is_ai_generated": null, "ai_probability_percent": null, "confidence_level": "low", "detected_language": "Unknown", "analysis_summary": "The text in the image could not be reliably read for analysis."}
- Low-quality image (Georgian): {"is_ai_generated": null, "ai_probability_percent": null, "confidence_level": "low", "detected_language": "ქართული", "analysis_summary": "მოცემული სურათიდან ტექსტის წაკითხვა საიმედო ანალიზისთვის ვერ მოხერხდა."}
- Short text (Georgian): {"is_ai_generated": null, "ai_probability_percent": null, "confidence_level": "low", "detected_language": "Georgian", "analysis_summary": "მოცემული ტექსტი ძალიან მოკლეა საიმედო ანალიზისთვის."}
- Short text (English): {"is_ai_generated": null, "ai_probability_percent": null, "confidence_level": "low", "detected_language": "English", "analysis_summary": "The provided text is too short to determine whether it was AI-generated."}

Final Output:
Always return a strict JSON object following the schema.
`;

export async function analyzeText(text?: string, image?: { data: string; mimeType: string }): Promise<DetectionResult> {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  
  const parts: any[] = [];
  if (text) parts.push({ text: `Analyze this text: ${text}` });
  if (image) {
    parts.push({
      inlineData: {
        data: image.data,
        mimeType: image.mimeType
      }
    });
    if (!text) {
      parts.push({ text: "Perform OCR on this image and then analyze if the extracted text is AI-generated." });
    }
  }

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { parts },
    config: {
      systemInstruction: SYSTEM_INSTRUCTION,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          is_ai_generated: {
            type: Type.BOOLEAN,
            nullable: true
          },
          ai_probability_percent: {
            type: Type.NUMBER,
            nullable: true
          },
          confidence_level: {
            type: Type.STRING
          },
          detected_language: {
            type: Type.STRING
          },
          analysis_summary: {
            type: Type.STRING
          }
        },
        required: ["is_ai_generated", "ai_probability_percent", "confidence_level", "detected_language", "analysis_summary"],
      },
    },
  });

  try {
    const data = JSON.parse(response.text || '{}');
    return data as DetectionResult;
  } catch (err) {
    throw new Error("Failed to parse analysis result");
  }
}
