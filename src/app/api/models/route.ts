import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const revalidate = 3600; // cache for 1 hour

interface OpenRouterModel {
  id: string;
  name?: string;
  context_length?: number;
  pricing?: { prompt?: string; completion?: string };
  architecture?: { modality?: string };
}

export async function GET() {
  try {
    const res = await fetch("https://openrouter.ai/api/v1/models", {
      headers: { "Content-Type": "application/json" },
      next: { revalidate: 3600 },
    });
    if (!res.ok) {
      return NextResponse.json(
        { error: `OpenRouter models fetch failed (${res.status})`, models: [] },
        { status: 502 }
      );
    }
    const data = (await res.json()) as { data?: OpenRouterModel[] };
    const models = (data.data ?? [])
      .map((m) => ({
        id: m.id,
        name: m.name ?? m.id,
        contextLength: m.context_length ?? null,
        promptPrice: m.pricing?.prompt ? Number(m.pricing.prompt) * 1_000_000 : null,
        completionPrice: m.pricing?.completion ? Number(m.pricing.completion) * 1_000_000 : null,
        modality: m.architecture?.modality ?? "text->text",
      }))
      .sort((a, b) => a.id.localeCompare(b.id));
    return NextResponse.json({ models });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Failed to fetch models", models: [] },
      { status: 502 }
    );
  }
}
