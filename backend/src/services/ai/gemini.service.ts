import { GoogleGenAI } from "@google/genai";

let genAIClient: GoogleGenAI | null = null;

export const getGeminiClient = (): GoogleGenAI | null => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey === "your_gemini_api_key_here") {
    return null;
  }
  if (!genAIClient) {
    genAIClient = new GoogleGenAI({ apiKey });
  }
  return genAIClient;
};

/**
 * Generates vector embedding using Gemini Embedding 2.
 * Throws a clean, user-friendly error if the service is unavailable or experiencing high traffic.
 */
export const generateEmbedding = async (text: string): Promise<number[]> => {
  const ai = getGeminiClient();
  if (!ai) {
    throw new Error(
      "Gemini API key is not configured. Please add GEMINI_API_KEY to your environment variables."
    );
  }

  const modelsToTry = ["gemini-embedding-2", "text-embedding-004"];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.embedContent({
        model,
        contents: text.slice(0, 8000),
        config: {
          outputDimensionality: 768,
        },
      });

      const values = response.embeddings?.[0]?.values;
      if (values && values.length > 0) {
        return values;
      }
    } catch (error: any) {
      const errMsg = error?.message || "";
      if (errMsg.includes("not found") || error?.status === 404) {
        continue;
      }

      console.warn(`Gemini embedding failed with model ${model}:`, errMsg);

      if (
        errMsg.includes("429") ||
        errMsg.includes("ResourceExhausted") ||
        errMsg.includes("Quota") ||
        errMsg.includes("overloaded") ||
        errMsg.includes("503")
      ) {
        throw new Error(
          "Our AI service is experiencing heavy traffic right now. Please try again in a few moments."
        );
      }
    }
  }

  throw new Error(
    "Our AI service is experiencing heavy traffic right now. Please try again in a few moments."
  );
};

const formatSecondsToTime = (sec?: number): string => {
  if (sec === undefined || sec === null) return "";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
};

/**
 * Generates answer grounded strictly in user's saved knowledge base chunks.
 */
export const generateGroundedAnswer = async (
  question: string,
  contextChunks: Array<{ text: string; metadata?: any }>
): Promise<string> => {
  const ai = getGeminiClient();

  if (!ai) {
    return (
      "Gemini API key is not configured. Please add your `GEMINI_API_KEY` to backend settings to enable AI answers."
    );
  }

  const systemPrompt = `You are BrainStack AI, a knowledgeable, articulate, and friendly personal second-brain assistant.
Your goal is to answer the user's question clearly, naturally, and conversationally based on their saved knowledge base.

Guidelines for your response:
1. Speak naturally and conversationally, like an experienced colleague explaining a concept clearly.
2. Structure your answer with natural paragraphs, clear explanations, and bullet points only where they genuinely help readability.
3. Keep your answers grounded in the provided context. If the saved sources do not contain enough information, explain that politely.
4. Do NOT clutter every sentence with bracketed markdown links or repetitive citation URLs. The application interface already provides a dedicated "Sources Cited" list at the bottom of the card. If you want to point to a specific moment in a video, mention it naturally (e.g. "discussed around 19:48").
5. Write in clean, modern markdown with bolding for key terms. Avoid artificial or robotic formatting.`;

  const contextText = contextChunks
    .map(
      (c, i) =>
        `[Excerpt ${i + 1}] Source: "${c.metadata?.title || "Unknown"}"${
          c.metadata?.startTime !== undefined ? ` (Timestamp: ${formatSecondsToTime(c.metadata.startTime)})` : ""
        }\n${c.text}`
    )
    .join("\n\n");

  const fullPrompt = `Context from user's personal knowledge base:\n${contextText}\n\nUser Question: ${question}`;

  const modelsToTry = [
    "gemini-3.1-flash-lite",
    "gemini-2.5-flash-lite",
    "gemini-2.5-flash",
    "gemini-1.5-flash",
  ];

  for (const model of modelsToTry) {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          systemInstruction: systemPrompt,
          temperature: 0.2,
        },
      });

      if (response.text) {
        return response.text;
      }
    } catch (error: any) {
      const errMsg = error?.message || "";
      if (errMsg.includes("not found") || error?.status === 404) {
        continue;
      }

      console.error(`Gemini generation failed with ${model}:`, errMsg);

      if (
        errMsg.includes("429") ||
        errMsg.includes("ResourceExhausted") ||
        errMsg.includes("Quota") ||
        errMsg.includes("overloaded") ||
        errMsg.includes("503")
      ) {
        return "Our AI service is experiencing heavy traffic right now. Please try again in a few moments.";
      }
    }
  }

  return "Our AI service is experiencing heavy traffic right now. Please try again in a few moments.";
};
