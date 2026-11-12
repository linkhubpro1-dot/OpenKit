import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface AiRequestBody {
  messages: ChatMessage[];
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  temperature?: number;
  stream?: boolean;
}

const DEFAULT_BASE = "https://openrouter.ai/api/v1";
const DEFAULT_MODEL = "openrouter/free";

export async function POST(req: NextRequest) {
  let body: AiRequestBody;
  try {
    body = (await req.json()) as AiRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = body.apiKey?.trim() || process.env.OPENROUTER_API_KEY || "";
  if (!apiKey) {
    return NextResponse.json(
      {
        error:
          "No OpenRouter API key configured. Add one in Settings → AI, or set OPENROUTER_API_KEY on the server.",
      },
      { status: 401 }
    );
  }

  const baseUrl = (body.baseUrl?.trim() || DEFAULT_BASE).replace(/\/+$/, "");
  const model = body.model?.trim() || DEFAULT_MODEL;
  const temperature = typeof body.temperature === "number" ? body.temperature : 0.4;

  if (!Array.isArray(body.messages) || body.messages.length === 0) {
    return NextResponse.json({ error: "messages array is required" }, { status: 400 });
  }

  const upstream = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://openkil.app",
      "X-Title": "OpenKil Builder",
    },
    body: JSON.stringify({
      model,
      messages: body.messages,
      temperature,
      stream: Boolean(body.stream),
    }),
  });

  if (!upstream.ok) {
    const text = await upstream.text();
    let message = text;
    let code: string | number | undefined;
    try {
      const parsed = JSON.parse(text) as {
        error?: { message?: string; code?: string | number } | string;
      };
      if (typeof parsed.error === "string") {
        message = parsed.error;
      } else {
        message = parsed.error?.message ?? text;
        code = parsed.error?.code;
      }
    } catch {
      /* keep raw text */
    }

    // Friendly, actionable messages for the most common OpenRouter failures
    let hint = "";
    if (upstream.status === 401) {
      hint = "Your API key is invalid or expired. Check Settings → AI and paste a fresh key from openrouter.ai/keys.";
    } else if (upstream.status === 402) {
      hint = "Insufficient credits. Add credits at openrouter.ai/credits, or switch to a free model (id ending in ':free').";
    } else if (upstream.status === 404) {
      hint = `Model "${model}" was not found. Pick another model in Settings → AI. Free models usually end with ':free'.`;
    } else if (upstream.status === 429) {
      hint = "Rate limit reached. Free models are limited — wait a minute, or add credits / pick a different model.";
    } else if (upstream.status === 400) {
      hint = "The request was rejected. The model may not support this input, or the model id is wrong.";
    } else if (upstream.status >= 500) {
      hint = "OpenRouter or the upstream provider is having issues. Try again, or pick a different model.";
    }

    return NextResponse.json(
      {
        error: `OpenRouter error (${upstream.status}): ${message}${hint ? ` — ${hint}` : ""}`,
        status: upstream.status,
        code: code ?? null,
        model,
      },
      { status: upstream.status }
    );
  }

  if (body.stream && upstream.body) {
    return new NextResponse(upstream.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  }

  const data = (await upstream.json()) as {
    choices?: { message?: { content?: string } }[];
    usage?: unknown;
  };
  const content = data.choices?.[0]?.message?.content ?? "";
  return NextResponse.json({ content, usage: data.usage ?? null });
}
