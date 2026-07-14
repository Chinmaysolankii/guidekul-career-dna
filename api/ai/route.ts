import { NextRequest, NextResponse } from "next/server";

// Run on the Node.js runtime so the API key stays server-side only.
export const runtime = "nodejs";
// Never cache AI responses.
export const dynamic = "force-dynamic";

const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const DEFAULT_MAX_TOKENS = 1024;

type GeminiPart = { text?: string };
type GeminiResponse = {
  candidates?: Array<{
    content?: { parts?: GeminiPart[] };
    finishReason?: string;
  }>;
  promptFeedback?: { blockReason?: string };
};

/**
 * POST /api/ai
 *
 * Request body:  { prompt: string, max_tokens?: number }
 * Response body: { content: [{ text: string }] }
 *
 * This route proxies the request to Google's Gemini generateContent endpoint.
 * The GEMINI_API_KEY is read from the server environment and is never sent to
 * the browser or included in any response.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    // Log server-side; do not tell the client anything about the key.
    console.error("[api/ai] GEMINI_API_KEY is not configured on the server.");
    return NextResponse.json(
      { error: "The server is not configured correctly." },
      { status: 500 }
    );
  }

  // Parse and validate the incoming JSON body.
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const { prompt, max_tokens } = (body ?? {}) as {
    prompt?: unknown;
    max_tokens?: unknown;
  };

  if (typeof prompt !== "string" || prompt.trim() === "") {
    return NextResponse.json(
      { error: "A non-empty 'prompt' string is required." },
      { status: 400 }
    );
  }

  const maxOutputTokens =
    typeof max_tokens === "number" && Number.isFinite(max_tokens) && max_tokens > 0
      ? Math.floor(max_tokens)
      : DEFAULT_MAX_TOKENS;

  // Call Gemini. The key travels in a header so it does not land in URL logs.
  let geminiRes: Response;
  try {
    geminiRes = await fetch(GEMINI_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
          // Ask Gemini for clean JSON with no markdown fences.
          responseMimeType: "application/json",
          maxOutputTokens,
        },
      }),
    });
  } catch (err) {
    console.error("[api/ai] Network error while calling Gemini:", err);
    return NextResponse.json(
      { error: "Could not reach the AI provider." },
      { status: 502 }
    );
  }

  // Read the upstream response as JSON.
  let data: GeminiResponse;
  try {
    data = (await geminiRes.json()) as GeminiResponse;
  } catch (err) {
    console.error(
      `[api/ai] Gemini returned a non-JSON response (status ${geminiRes.status}):`,
      err
    );
    return NextResponse.json(
      { error: "The AI provider returned an unreadable response." },
      { status: 502 }
    );
  }

  if (!geminiRes.ok) {
    // Log the full upstream error server-side for debugging. Do not forward
    // the raw provider payload (or anything key-related) to the client.
    console.error(
      `[api/ai] Gemini responded with status ${geminiRes.status}:`,
      JSON.stringify(data)
    );
    // Surface rate limiting distinctly; collapse everything else to 502.
    const status = geminiRes.status === 429 ? 429 : 502;
    return NextResponse.json(
      { error: "The AI provider rejected the request." },
      { status }
    );
  }

  // Normalize Gemini's shape into { content: [{ text }] } for the frontend.
  const text = (data.candidates?.[0]?.content?.parts ?? [])
    .map((p) => p?.text ?? "")
    .join("");

  if (!text) {
    const finishReason = data.candidates?.[0]?.finishReason;
    const blockReason = data.promptFeedback?.blockReason;
    console.error(
      "[api/ai] Gemini returned an empty completion.",
      "finishReason:",
      finishReason,
      "blockReason:",
      blockReason
    );
    return NextResponse.json(
      { error: "The AI returned an empty response. Please try again." },
      { status: 502 }
    );
  }

  return NextResponse.json({ content: [{ text }] });
}

// Reject other verbs cleanly so the tool never sees an HTML 405 page.
export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
