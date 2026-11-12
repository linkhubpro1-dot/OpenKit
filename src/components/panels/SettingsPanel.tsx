"use client";

import React from "react";
import { useBuilder } from "@/store/builder";

interface ModelInfo {
  id: string;
  name: string;
  contextLength: number | null;
  promptPrice: number | null;
  completionPrice: number | null;
  modality: string;
}

const POPULAR = [
  "openai/gpt-4o-mini",
  "openai/gpt-4o",
  "anthropic/claude-3.5-sonnet",
  "anthropic/claude-3.5-haiku",
  "google/gemini-flash-1.5",
  "google/gemini-pro-1.5",
  "meta-llama/llama-3.1-70b-instruct",
  "deepseek/deepseek-chat",
  "qwen/qwen-2.5-72b-instruct",
];

export function SettingsPanel() {
  const aiSettings = useBuilder((s) => s.aiSettings);
  const setAiSettings = useBuilder((s) => s.setAiSettings);
  const project = useBuilder((s) => s.project);
  const updateSettings = useBuilder((s) => s.updateSettings);
  const [showKey, setShowKey] = React.useState(false);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);
  const [models, setModels] = React.useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = React.useState(true);
  const [modelsError, setModelsError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [showAll, setShowAll] = React.useState(false);
  const [freeOnly, setFreeOnly] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    setModelsLoading(true);
    fetch("/api/models")
      .then((r) => r.json())
      .then((data: { models?: ModelInfo[]; error?: string }) => {
        if (cancelled) return;
        if (data.models?.length) {
          setModels(data.models);
          setModelsError(null);
        } else {
          setModelsError(data.error ?? "Could not load model list");
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setModelsError(err instanceof Error ? err.message : "Could not load model list");
      })
      .finally(() => {
        if (!cancelled) setModelsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const q = query.trim().toLowerCase();
  const isFree = (m: ModelInfo) => m.promptPrice === 0 && m.completionPrice === 0;
  const filtered = React.useMemo(() => {
    let list = models;
    if (freeOnly) list = list.filter(isFree);
    if (!q) return list;
    return list.filter(
      (m) => m.id.toLowerCase().includes(q) || m.name.toLowerCase().includes(q)
    );
  }, [models, q, freeOnly]);

  const freeModels = React.useMemo(() => models.filter(isFree), [models]);
  const popularModels = React.useMemo(
    () => models.filter((m) => POPULAR.includes(m.id)),
    [models]
  );

  const visible =
    showAll || q || freeOnly
      ? filtered
      : popularModels.length
      ? popularModels
      : filtered.slice(0, 12);
  const selectedModel = models.find((m) => m.id === aiSettings.model);

  const testKey = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: aiSettings.apiKey,
          model: aiSettings.model,
          baseUrl: aiSettings.baseUrl,
          temperature: 0,
          messages: [{ role: "user", content: "Reply with exactly: OK" }],
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      setTestResult(res.ok ? `✓ Connected — model replied: ${(data.content ?? "").slice(0, 60)}` : `✗ ${data.error}`);
    } catch (err) {
      setTestResult(`✗ ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {/* AI settings */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">AI Provider — OpenRouter</h3>
        <p className="mb-3 text-[11px] leading-snug text-slate-500">
          Your key is stored only in this browser (localStorage) and sent to OpenRouter through the local API route. Get a key at{" "}
          <a href="https://openrouter.ai/keys" target="_blank" rel="noreferrer" className="text-brand-300 hover:underline">openrouter.ai/keys</a>.
        </p>

        <label className="mb-1 block text-[10px] font-medium text-slate-500">API key</label>
        <div className="mb-3 flex gap-2">
          <input
            type={showKey ? "text" : "password"}
            value={aiSettings.apiKey}
            onChange={(e) => setAiSettings({ apiKey: e.target.value })}
            placeholder="sk-or-v1-…"
            autoComplete="off"
            spellCheck={false}
            className="w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-2 font-mono text-[11px] text-slate-200 outline-none placeholder:text-slate-600 focus:border-brand-500"
          />
          <button onClick={() => setShowKey((v) => !v)} className="rounded-md border border-ink-700 px-2 text-xs text-slate-400 hover:text-white">
            {showKey ? "Hide" : "Show"}
          </button>
        </div>

        <label className="mb-1 block text-[10px] font-medium text-slate-500">
          Model {modelsLoading ? "· loading…" : models.length ? `· ${models.length} available` : ""}
        </label>

        {/* Selected model summary */}
        <div className="mb-2 rounded-md border border-ink-700 bg-ink-850 px-2 py-1.5">
          <p className="truncate font-mono text-[11px] text-brand-300" title={aiSettings.model}>
            {aiSettings.model}
          </p>
          {selectedModel ? (
            <p className="mt-0.5 text-[9px] text-slate-500">
              {selectedModel.name}
              {selectedModel.contextLength ? ` · ${Math.round(selectedModel.contextLength / 1000)}k ctx` : ""}
              {selectedModel.promptPrice !== null ? ` · $${selectedModel.promptPrice.toFixed(2)}/M in` : ""}
              {selectedModel.completionPrice !== null ? ` · $${selectedModel.completionPrice.toFixed(2)}/M out` : ""}
            </p>
          ) : null}
        </div>

        {/* Search + free filter */}
        <div className="mb-2 flex gap-2">
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${models.length || 600}+ models… (e.g. claude, gpt, llama)`}
            className="w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-2 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-brand-500"
          />
          <button
            onClick={() => setFreeOnly((v) => !v)}
            title="Show only free models"
            className={`shrink-0 rounded-md border px-2 py-2 text-[10px] font-semibold ${
              freeOnly
                ? "border-green-500/50 bg-green-500/15 text-green-400"
                : "border-ink-700 text-slate-400 hover:text-white"
            }`}
          >
            FREE {freeModels.length ? `(${freeModels.length})` : ""}
          </button>
        </div>

        {freeModels.length > 0 && !freeOnly && !q ? (
          <button
            onClick={() => setFreeOnly(true)}
            className="mb-2 w-full rounded-md border border-green-500/30 bg-green-500/5 px-2 py-1.5 text-[10px] text-green-400 hover:bg-green-500/10"
          >
            ✨ {freeModels.length} free models available — tap to show only free
          </button>
        ) : null}

        {modelsError ? (
          <p className="mb-2 rounded-md bg-red-500/10 px-2 py-1.5 text-[10px] text-red-400">
            {modelsError} — you can still type a model id below.
          </p>
        ) : null}

        {/* Model list */}
        <div className="mb-2 max-h-56 overflow-y-auto rounded-md border border-ink-800">
          {modelsLoading ? (
            <div className="p-3 text-center text-[11px] text-slate-500">Loading models from OpenRouter…</div>
          ) : visible.length === 0 ? (
            <div className="p-3 text-center text-[11px] text-slate-500">No models match “{query}”</div>
          ) : (
            visible.map((m) => {
              const active = m.id === aiSettings.model;
              const isFree = m.promptPrice === 0 && m.completionPrice === 0;
              return (
                <button
                  key={m.id}
                  onClick={() => setAiSettings({ model: m.id })}
                  className={`flex w-full items-start gap-2 border-b border-ink-800 px-2 py-1.5 text-left last:border-b-0 ${
                    active ? "bg-brand-600/20" : "hover:bg-ink-850"
                  }`}
                >
                  <span className={`mt-0.5 text-[10px] ${active ? "text-brand-300" : "text-slate-600"}`}>
                    {active ? "●" : "○"}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-mono text-[10px] text-slate-200" title={m.id}>
                      {m.id}
                      {isFree ? <span className="ml-1 rounded bg-green-500/15 px-1 text-[8px] text-green-400">FREE</span> : null}
                    </span>
                    <span className="block truncate text-[9px] text-slate-500">
                      {m.name}
                      {m.contextLength ? ` · ${Math.round(m.contextLength / 1000)}k` : ""}
                      {m.promptPrice !== null ? ` · $${m.promptPrice.toFixed(2)}/M` : ""}
                    </span>
                  </span>
                </button>
              );
            })
          )}
        </div>

        {!q && !showAll && models.length > visible.length ? (
          <button
            onClick={() => setShowAll(true)}
            className="mb-3 w-full rounded-md border border-ink-700 px-2 py-1.5 text-[10px] text-slate-400 hover:text-white"
          >
            Show all {models.length} models →
          </button>
        ) : null}
        {showAll && !q ? (
          <button
            onClick={() => setShowAll(false)}
            className="mb-3 w-full rounded-md border border-ink-700 px-2 py-1.5 text-[10px] text-slate-400 hover:text-white"
          >
            Show popular only
          </button>
        ) : null}

        <label className="mb-1 block text-[10px] font-medium text-slate-500">Custom model id</label>
        <input
          value={aiSettings.model}
          onChange={(e) => setAiSettings({ model: e.target.value })}
          className="mb-3 w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-2 font-mono text-[11px] text-slate-200 outline-none focus:border-brand-500"
          placeholder="provider/model-name"
        />

        <label className="mb-1 block text-[10px] font-medium text-slate-500">Base URL</label>
        <input
          value={aiSettings.baseUrl}
          onChange={(e) => setAiSettings({ baseUrl: e.target.value })}
          className="mb-3 w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-2 font-mono text-[11px] text-slate-200 outline-none focus:border-brand-500"
        />

        <label className="mb-1 block text-[10px] font-medium text-slate-500">Temperature: {aiSettings.temperature.toFixed(2)}</label>
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={aiSettings.temperature}
          onChange={(e) => setAiSettings({ temperature: Number(e.target.value) })}
          className="mb-3 w-full"
        />

        <button
          onClick={testKey}
          disabled={testing || !aiSettings.apiKey.trim()}
          className="w-full rounded-lg border border-brand-600 bg-brand-600/10 px-3 py-2 text-xs font-semibold text-brand-300 hover:bg-brand-600/20 disabled:opacity-40"
        >
          {testing ? "Testing…" : "Test connection"}
        </button>
        {testResult ? (
          <p className={`mt-2 rounded-md px-2 py-1.5 text-[10px] ${testResult.startsWith("✓") ? "bg-green-500/10 text-green-400" : "bg-red-500/10 text-red-400"}`}>
            {testResult}
          </p>
        ) : null}
      </section>

      {/* Project settings */}
      <section className="mb-6">
        <h3 className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Project</h3>
        <label className="mb-1 block text-[10px] font-medium text-slate-500">Name</label>
        <input
          value={project.settings.name}
          onChange={(e) => updateSettings({ name: e.target.value })}
          className="mb-3 w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-2 text-xs text-slate-200 outline-none focus:border-brand-500"
        />
        <label className="mb-1 block text-[10px] font-medium text-slate-500">Description</label>
        <textarea
          value={project.settings.description}
          onChange={(e) => updateSettings({ description: e.target.value })}
          rows={2}
          className="mb-3 w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-2 text-xs text-slate-200 outline-none focus:border-brand-500"
        />
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-500">Primary</label>
            <input type="color" value={project.settings.primary} onChange={(e) => updateSettings({ primary: e.target.value })} className="h-9 w-full rounded-md border border-ink-700 bg-ink-850" />
          </div>
          <div>
            <label className="mb-1 block text-[10px] font-medium text-slate-500">Accent</label>
            <input type="color" value={project.settings.accent} onChange={(e) => updateSettings({ accent: e.target.value })} className="h-9 w-full rounded-md border border-ink-700 bg-ink-850" />
          </div>
        </div>
        <label className="mb-1 mt-3 block text-[10px] font-medium text-slate-500">Mode</label>
        <div className="grid grid-cols-2 gap-2">
          {(["website", "app"] as const).map((mode) => (
            <button
              key={mode}
              onClick={() => updateSettings({ mode })}
              className={`rounded-lg border px-3 py-2 text-xs font-medium capitalize ${
                project.settings.mode === mode
                  ? "border-brand-500 bg-brand-600/20 text-brand-300"
                  : "border-ink-700 text-slate-400 hover:text-white"
              }`}
            >
              {mode}
            </button>
          ))}
        </div>
      </section>

      <p className="mt-auto text-center text-[9px] text-slate-600">OpenKil v0.1 · Your data stays in this browser</p>
    </div>
  );
}
