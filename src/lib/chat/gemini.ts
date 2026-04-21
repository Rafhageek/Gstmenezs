import { GoogleGenAI } from "@google/genai";

export interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

let clientSingleton: GoogleGenAI | null = null;

function getClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  if (!clientSingleton) {
    clientSingleton = new GoogleGenAI({ apiKey });
  }
  return clientSingleton;
}

export function isGeminiEnabled(): boolean {
  return Boolean(process.env.GEMINI_API_KEY);
}

/**
 * Consulta o Gemini com histórico + system prompt.
 * Retorna null se a API key não estiver configurada ou se der erro.
 */
export async function askGemini(
  messages: ChatMsg[],
  systemInstruction: string,
): Promise<string | null> {
  const client = getClient();
  if (!client) return null;

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  try {
    const response = await client.models.generateContent({
      model: "gemini-2.0-flash",
      contents,
      config: {
        systemInstruction,
        temperature: 0.3,
        maxOutputTokens: 800,
      },
    });
    const text = response.text?.trim();
    if (!text) return null;
    return text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.error("[gemini] erro:", msg);
    return null;
  }
}
