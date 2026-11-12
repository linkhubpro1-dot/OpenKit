"use client";

import React, { useRef, useState } from "react";
import { useBuilder } from "@/store/builder";
import { findNode } from "@/lib/tree";
import { AGENTS, AGENT_MAP, scanProject, severityColor, type ScanFinding } from "@/lib/agents";
import type { DesignNode, ElementKind } from "@/lib/types";
import { cn, uid } from "@/lib/utils";

export function AiPanel() {
  const activeAgent = useBuilder((s) => s.activeAgent);
  const setActiveAgent = useBuilder((s) => s.setActiveAgent);
  const agent = AGENT_MAP[activeAgent];

  return (
    <div className="flex h-full flex-col">
      {/* Agent selector */}
      <div className="border-b border-ink-800 p-2">
        <div className="grid grid-cols-6 gap-1">
          {AGENTS.map((a) => (
            <button
              key={a.id}
              onClick={() => setActiveAgent(a.id)}
              title={`${a.name} — ${a.tagline}`}
              className={cn(
                "flex flex-col items-center gap-0.5 rounded-lg border px-1 py-1.5 transition",
                activeAgent === a.id
                  ? "border-brand-500 bg-brand-600/15"
                  : "border-transparent hover:bg-ink-850"
              )}
            >
              <span className="text-base leading-none">{a.icon}</span>
              <span className="text-[8px] font-medium leading-tight text-slate-400">
                {a.name.split(" ")[0]}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-2 flex items-center gap-2 px-1">
          <span className="text-sm">{agent.icon}</span>
          <div className="min-w-0">
            <p className="text-[11px] font-semibold text-slate-100">{agent.name}</p>
            <p className="truncate text-[9px] text-slate-500">{agent.tagline}</p>
          </div>
        </div>
      </div>

      {/* Agent body */}
      {activeAgent === "security" ? (
        <SecurityAgent />
      ) : (
        <ChatAgent agentId={activeAgent} />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Chat-based agents                                                   */
/* ------------------------------------------------------------------ */

function ChatAgent({ agentId }: { agentId: import("@/lib/agents").AgentId }) {
  const agent = AGENT_MAP[agentId];
  const aiSettings = useBuilder((s) => s.aiSettings);
  const aiMessages = useBuilder((s) => s.aiMessages);
  const aiBusy = useBuilder((s) => s.aiBusy);
  const pushAiMessage = useBuilder((s) => s.pushAiMessage);
  const setAiBusy = useBuilder((s) => s.setAiBusy);
  const clearAiMessages = useBuilder((s) => s.clearAiMessages);
  const applyAiNodes = useBuilder((s) => s.applyAiNodes);
  const project = useBuilder((s) => s.project);
  const activePageId = useBuilder((s) => s.activePageId);
  const selectedId = useBuilder((s) => s.selectedId);

  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const page = project.pages.find((p) => p.id === activePageId);
  const selectedNode = page && selectedId ? findNode(page.root, selectedId) : null;

  const send = async (prompt: string) => {
    const text = prompt.trim();
    if (!text || aiBusy) return;
    if (!aiSettings.apiKey.trim()) {
      pushAiMessage({
        role: "assistant",
        content: "⚠️ No OpenRouter API key set. Go to Settings → AI and paste your key first.",
      });
      return;
    }

    pushAiMessage({ role: "user", content: text });
    setInput("");
    setAiBusy(true);

    const context = selectedNode
      ? `The user has selected this element: ${JSON.stringify({ kind: selectedNode.kind, name: selectedNode.name, content: selectedNode.content })}. Prefer editing/replacing it if relevant.`
      : `Current page: ${page?.name ?? "Home"} with ${page?.root.children.length ?? 0} top-level sections. Project: ${project.settings.name} — ${project.settings.description}.`;

    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: aiSettings.apiKey,
          model: aiSettings.model,
          baseUrl: aiSettings.baseUrl,
          temperature: aiSettings.temperature,
          messages: [
            { role: "system", content: agent.systemPrompt },
            ...aiMessages.slice(-10).map((m) => ({ role: m.role, content: m.content })),
            { role: "user", content: `${context}\n\nRequest: ${text}` },
          ],
        }),
      });

      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) {
        pushAiMessage({ role: "assistant", content: `❌ ${data.error ?? "Request failed"}` });
        return;
      }

      const parsed = parseAiJson(data.content ?? "");
      if (!parsed) {
        pushAiMessage({ role: "assistant", content: data.content ?? "(empty response)" });
        return;
      }

      const nodes = (parsed.nodes ?? []).map(normalizeNode).filter(Boolean) as DesignNode[];
      if (nodes.length > 0) {
        applyAiNodes(nodes, parsed.mode === "replace" ? "replace" : "append");
      }
      pushAiMessage({
        role: "assistant",
        content: parsed.reply || (nodes.length ? `Done — ${nodes.length} section(s) applied.` : "Done."),
        nodeIds: nodes.map((n) => n.id),
      });
    } catch (err) {
      pushAiMessage({
        role: "assistant",
        content: `❌ ${err instanceof Error ? err.message : "Network error"}`,
      });
    } finally {
      setAiBusy(false);
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
      });
    }
  };

  return (
    <>
      <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto p-3">
        {aiMessages.length === 0 ? (
          <div className="rounded-xl border border-ink-800 bg-ink-850 p-4">
            <p className="text-sm font-medium text-slate-200">{agent.icon} {agent.name}</p>
            <p className="mt-1 text-xs leading-snug text-slate-500">{agent.description}</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {agent.quickActions.map((a) => (
                <button
                  key={a.label}
                  onClick={() => send(a.prompt)}
                  className="rounded-full border border-ink-700 px-2.5 py-1 text-[10px] text-slate-400 hover:border-brand-500 hover:text-white"
                >
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        ) : null}

        {aiMessages.map((m) => (
          <div
            key={m.id}
            className={cn(
              "max-w-[92%] whitespace-pre-wrap rounded-2xl px-3 py-2 text-xs leading-relaxed",
              m.role === "user" ? "ml-auto bg-brand-600 text-white" : "bg-ink-850 text-slate-200"
            )}
          >
            {m.content}
          </div>
        ))}

        {aiBusy ? (
          <div className="flex items-center gap-2 rounded-2xl bg-ink-850 px-3 py-2 text-xs text-slate-400">
            <span className="ai-dot h-2 w-2 rounded-full bg-brand-400" />
            {agent.name} is thinking…
          </div>
        ) : null}
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="border-t border-ink-800 p-3"
      >
        <div className="flex items-end gap-2 rounded-xl border border-ink-700 bg-ink-850 p-2 focus-within:border-brand-500">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send(input);
              }
            }}
            rows={2}
            placeholder={`Ask ${agent.name}…`}
            className="max-h-40 flex-1 resize-none bg-transparent text-xs text-slate-100 outline-none placeholder:text-slate-600"
          />
          <button
            type="submit"
            disabled={aiBusy || !input.trim()}
            className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-40"
          >
            Send
          </button>
        </div>
        <div className="mt-1.5 flex items-center justify-between">
          <p className="text-[9px] text-slate-600">Enter to send · Shift+Enter newline</p>
          <button onClick={clearAiMessages} className="text-[9px] text-slate-600 hover:text-slate-300">
            Clear chat
          </button>
        </div>
      </form>
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Security agent — real scanner + AI-assisted fixing                  */
/* ------------------------------------------------------------------ */

function SecurityAgent() {
  const project = useBuilder((s) => s.project);
  const select = useBuilder((s) => s.select);
  const aiSettings = useBuilder((s) => s.aiSettings);
  const applyAiNodes = useBuilder((s) => s.applyAiNodes);

  const [findings, setFindings] = useState<ScanFinding[] | null>(null);
  const [scanning, setScanning] = useState(false);
  const [fixing, setFixing] = useState(false);
  const [fixLog, setFixLog] = useState<string | null>(null);

  const runScan = () => {
    setScanning(true);
    setFixLog(null);
    // let the UI paint the scanning state before the (synchronous) scan
    setTimeout(() => {
      setFindings(scanProject(project));
      setScanning(false);
    }, 350);
  };

  const fixWithAi = async () => {
    if (!findings || findings.length === 0) return;
    if (!aiSettings.apiKey.trim()) {
      setFixLog("⚠️ No OpenRouter API key set. Go to Settings → AI first.");
      return;
    }
    setFixing(true);
    setFixLog(null);
    const agent = AGENT_MAP.security;
    const scanText = findings
      .map((f) => `[${f.severity.toUpperCase()}] ${f.title} — ${f.detail}${f.fix ? ` (fix: ${f.fix})` : ""}`)
      .join("\n");
    try {
      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: aiSettings.apiKey,
          model: aiSettings.model,
          baseUrl: aiSettings.baseUrl,
          temperature: 0.2,
          messages: [
            { role: "system", content: agent.systemPrompt },
            {
              role: "user",
              content: `Here are the scan findings for the current page. Fix ALL of them and return the corrected full page as JSON.\n\n${scanText}`,
            },
          ],
        }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      if (!res.ok) {
        setFixLog(`❌ ${data.error ?? "Request failed"}`);
        return;
      }
      const parsed = parseAiJson(data.content ?? "");
      const nodes = (parsed?.nodes ?? []).map(normalizeNode).filter(Boolean) as DesignNode[];
      if (nodes.length > 0) {
        applyAiNodes(nodes, "replace");
        setFixLog(`✓ ${parsed?.reply ?? "Fixes applied."} Re-run the scan to verify.`);
        setFindings(null);
      } else {
        setFixLog(parsed?.reply ?? "AI returned no changes. Try again or fix manually.");
      }
    } catch (err) {
      setFixLog(`❌ ${err instanceof Error ? err.message : "Network error"}`);
    } finally {
      setFixing(false);
    }
  };

  const counts = findings
    ? {
        critical: findings.filter((f) => f.severity === "critical").length,
        high: findings.filter((f) => f.severity === "high").length,
        medium: findings.filter((f) => f.severity === "medium").length,
        low: findings.filter((f) => f.severity === "low").length,
      }
    : null;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto p-3">
      <div className="rounded-xl border border-ink-800 bg-ink-850 p-4">
        <p className="text-sm font-medium text-slate-200">🛡️ Security & Quality Audit</p>
        <p className="mt-1 text-xs leading-snug text-slate-500">
          Scans every page for XSS in custom HTML, javascript: links, missing alt text, placeholder copy, dead links, insecure embeds and more. Runs locally — no data leaves your browser.
        </p>
        <button
          onClick={runScan}
          disabled={scanning}
          className="mt-3 w-full rounded-lg bg-red-500/90 px-3 py-2 text-xs font-semibold text-white hover:bg-red-500 disabled:opacity-50"
        >
          {scanning ? "Scanning…" : findings ? "Re-scan project" : "Run full audit"}
        </button>
      </div>

      {counts ? (
        <div className="mt-3 grid grid-cols-4 gap-1.5 text-center">
          {(["critical", "high", "medium", "low"] as const).map((s) => (
            <div key={s} className={cn("rounded-lg border px-2 py-2", severityColor(s))}>
              <p className="text-lg font-bold leading-none">{counts[s]}</p>
              <p className="mt-1 text-[9px] uppercase tracking-wide">{s}</p>
            </div>
          ))}
        </div>
      ) : null}

      {findings && findings.length > 0 ? (
        <>
          <div className="mt-3 space-y-2">
            {findings.map((f) => (
              <div key={f.id} className={cn("rounded-lg border p-2.5", severityColor(f.severity))}>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-[11px] font-semibold">{f.title}</p>
                  <span className="text-[8px] font-bold uppercase">{f.severity}</span>
                </div>
                <p className="mt-1 text-[10px] leading-snug opacity-90">{f.detail}</p>
                {f.fix ? <p className="mt-1 text-[9px] opacity-75">💡 {f.fix}</p> : null}
                {f.nodeId ? (
                  <button
                    onClick={() => select(f.nodeId!)}
                    className="mt-1.5 rounded border border-current/30 px-2 py-0.5 text-[9px] font-medium opacity-80 hover:opacity-100"
                  >
                    Select element →
                  </button>
                ) : null}
              </div>
            ))}
          </div>
          <button
            onClick={fixWithAi}
            disabled={fixing}
            className="mt-3 w-full rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
          >
            {fixing ? "AI is fixing…" : "✨ Fix all with AI"}
          </button>
        </>
      ) : null}

      {findings && findings.length === 0 ? (
        <div className="mt-4 rounded-xl border border-green-500/30 bg-green-500/10 p-4 text-center">
          <p className="text-2xl">✅</p>
          <p className="mt-1 text-sm font-semibold text-green-400">All clear</p>
          <p className="mt-0.5 text-[11px] text-green-500/80">No security or quality issues found in this project.</p>
        </div>
      ) : null}

      {fixLog ? (
        <p className="mt-3 rounded-lg border border-ink-800 bg-ink-850 px-3 py-2 text-[11px] text-slate-300">{fixLog}</p>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

function parseAiJson(raw: string): { reply?: string; mode?: string; nodes?: unknown[] } | null {
  const trimmed = raw.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    return null;
  }
}

const VALID_KINDS: ElementKind[] = [
  "section", "container", "heading", "text", "button", "image", "video", "audio",
  "input", "textarea", "select", "checkbox", "form", "navbar", "hero", "card",
  "cards", "features", "testimonial", "pricing", "stats", "faq", "footer",
  "divider", "spacer", "shape", "badge", "icon", "list", "table", "code", "html",
];

function normalizeNode(raw: unknown): DesignNode | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const kind = String(r.kind ?? "section") as ElementKind;
  if (!VALID_KINDS.includes(kind)) return null;

  const content = (r.content && typeof r.content === "object" ? r.content : {}) as DesignNode["content"];
  const style = (r.style && typeof r.style === "object" ? r.style : {}) as DesignNode["style"];
  const childrenRaw = Array.isArray(r.children) ? r.children : [];

  return {
    id: typeof r.id === "string" && r.id ? r.id : uid(),
    kind,
    name: typeof r.name === "string" ? r.name : kind,
    content,
    style,
    children: childrenRaw.map(normalizeNode).filter(Boolean) as DesignNode[],
  };
}
