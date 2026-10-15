import "server-only";
import { requireFeature } from "@/lib/env";

export type ChatTurn = { role: "user" | "assistant"; content: string };

export class AiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AiError";
  }
}

/**
 * One function for both providers (OpenAI or Gemini, chosen by AI_PROVIDER).
 * No tools, no browsing: the model only sees the system prompt we write and
 * the citizen's messages. Throws AiError on any failure so callers can fall
 * back to the rule-based answers.
 */
export async function complete({
  system,
  messages,
  json = false,
  maxTokens = 600,
}: {
  system: string;
  messages: ChatTurn[];
  json?: boolean;
  maxTokens?: number;
}): Promise<string> {
  const env = requireFeature("ai");
  const signal = AbortSignal.timeout(20_000);

  try {
    if (env.AI_PROVIDER === "gemini") {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(env.AI_MODEL!)}:generateContent`,
        {
          method: "POST",
          signal,
          headers: { "Content-Type": "application/json", "x-goog-api-key": env.GEMINI_API_KEY! },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: system }] },
            contents: messages.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
            generationConfig: {
              temperature: 0.2,
              maxOutputTokens: maxTokens,
              ...(json ? { responseMimeType: "application/json" } : {}),
            },
          }),
        },
      );
      if (!response.ok) throw new AiError(`Gemini HTTP ${response.status}`);
      const data = (await response.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
      const text = data.candidates?.[0]?.content?.parts?.map((p) => p.text ?? "").join("") ?? "";
      if (!text.trim()) throw new AiError("Gemini returned no text");
      return text;
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      signal,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${env.OPENAI_API_KEY}` },
      body: JSON.stringify({
        model: env.AI_MODEL,
        temperature: 0.2,
        max_completion_tokens: maxTokens,
        messages: [{ role: "system", content: system }, ...messages],
        ...(json ? { response_format: { type: "json_object" } } : {}),
      }),
    });
    if (!response.ok) throw new AiError(`OpenAI HTTP ${response.status}`);
    const data = (await response.json()) as { choices?: { message?: { content?: string } }[] };
    const text = data.choices?.[0]?.message?.content ?? "";
    if (!text.trim()) throw new AiError("OpenAI returned no text");
    return text;
  } catch (error) {
    if (error instanceof AiError) throw error;
    throw new AiError(error instanceof Error ? error.name : "AI request failed");
  }
}
