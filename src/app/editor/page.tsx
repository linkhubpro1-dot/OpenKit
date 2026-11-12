"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { useBuilder } from "@/store/builder";
import { Canvas } from "@/components/canvas/Canvas";
import { InsertPanel } from "@/components/panels/InsertPanel";
import { LayersPanel } from "@/components/panels/LayersPanel";
import { AssetsPanel } from "@/components/panels/AssetsPanel";
import { TemplatesPanel } from "@/components/panels/TemplatesPanel";
import { InspectorPanel } from "@/components/panels/InspectorPanel";
import { AiPanel } from "@/components/panels/AiPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { DeployPanel } from "@/components/panels/DeployPanel";
import { cn } from "@/lib/utils";
import type { Breakpoint } from "@/lib/types";

const LEFT_TABS = [
  { id: "insert", label: "Insert", icon: "＋" },
  { id: "layers", label: "Layers", icon: "☰" },
  { id: "assets", label: "Assets", icon: "🖼" },
  { id: "templates", label: "Templates", icon: "✦" },
] as const;

const RIGHT_TABS = [
  { id: "design", label: "Design", icon: "🎨" },
  { id: "ai", label: "AI", icon: "🤖" },
  { id: "settings", label: "Settings", icon: "⚙" },
  { id: "deploy", label: "Deploy", icon: "🚀" },
] as const;

export default function EditorPage() {
  const hydrate = useBuilder((s) => s.hydrate);
  const save = useBuilder((s) => s.save);
  const saved = useBuilder((s) => s.saved);
  const project = useBuilder((s) => s.project);
  const activePageId = useBuilder((s) => s.activePageId);
  const selectPage = useBuilder((s) => s.selectPage);
  const addPage = useBuilder((s) => s.addPage);
  const deletePage = useBuilder((s) => s.deletePage);
  const updatePage = useBuilder((s) => s.updatePage);
  const breakpoint = useBuilder((s) => s.breakpoint);
  const setBreakpoint = useBuilder((s) => s.setBreakpoint);
  const zoom = useBuilder((s) => s.zoom);
  const setZoom = useBuilder((s) => s.setZoom);
  const preview = useBuilder((s) => s.preview);
  const togglePreview = useBuilder((s) => s.togglePreview);
  const leftTab = useBuilder((s) => s.leftTab);
  const setLeftTab = useBuilder((s) => s.setLeftTab);
  const rightTab = useBuilder((s) => s.rightTab);
  const setRightTab = useBuilder((s) => s.setRightTab);
  const undo = useBuilder((s) => s.undo);
  const redo = useBuilder((s) => s.redo);
  const newProject = useBuilder((s) => s.newProject);
  const selectedId = useBuilder((s) => s.selectedId);
  const deleteNode = useBuilder((s) => s.deleteNode);
  const duplicateNode = useBuilder((s) => s.duplicateNode);

  const hydrated = useRef(false);
  const [mounted, setMounted] = React.useState(false);
  useEffect(() => {
    setMounted(true);
    if (hydrated.current) return;
    hydrated.current = true;
    hydrate();
  }, [hydrate]);

  // autosave (debounced)
  useEffect(() => {
    if (saved) return;
    const t = setTimeout(() => save(), 800);
    return () => clearTimeout(t);
  }, [project, saved, save]);

  // keyboard shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      const target = e.target as HTMLElement;
      const typing = /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName) || target.isContentEditable;
      if (mod && e.key.toLowerCase() === "z" && !typing) {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && e.key.toLowerCase() === "s") {
        e.preventDefault();
        save();
      } else if (mod && e.key.toLowerCase() === "d" && selectedId && !typing) {
        e.preventDefault();
        duplicateNode(selectedId);
      } else if ((e.key === "Delete" || e.key === "Backspace") && selectedId && !typing) {
        e.preventDefault();
        deleteNode(selectedId);
      } else if (e.key === "Escape") {
        useBuilder.getState().select(null);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, save, selectedId, deleteNode, duplicateNode]);

  const activePage = project.pages.find((p) => p.id === activePageId);

  if (!mounted) {
    return (
      <div className="flex h-screen items-center justify-center bg-ink-950 text-sm text-slate-500">
        Loading editor…
      </div>
    );
  }

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-ink-950 text-slate-200">
      {/* Top bar */}
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-ink-800 bg-ink-900 px-3">
        <Link href="/" className="flex items-center gap-2 pr-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-brand-400 to-brand-700 text-[11px] font-black text-white">K</div>
          <span className="text-sm font-bold text-white">OpenKil</span>
        </Link>

        <div className="h-5 w-px bg-ink-800" />

        <input
          value={project.settings.name}
          onChange={(e) => useBuilder.getState().updateSettings({ name: e.target.value })}
          className="w-44 rounded-md border border-transparent bg-transparent px-2 py-1 text-xs font-medium text-slate-200 outline-none hover:border-ink-700 focus:border-brand-500"
        />
        <span className="text-[10px] text-slate-600">{saved ? "Saved" : "Saving…"}</span>

        <div className="mx-auto flex items-center gap-1">
          <button onClick={undo} title="Undo (Ctrl+Z)" className="rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white">↶</button>
          <button onClick={redo} title="Redo (Ctrl+Shift+Z)" className="rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white">↷</button>
          <div className="mx-1 h-5 w-px bg-ink-800" />
          {(["desktop", "tablet", "mobile"] as Breakpoint[]).map((bp) => (
            <button
              key={bp}
              onClick={() => setBreakpoint(bp)}
              title={bp}
              className={cn(
                "rounded-md px-2 py-1.5 text-xs",
                breakpoint === bp ? "bg-brand-600 text-white" : "text-slate-400 hover:bg-ink-800 hover:text-white"
              )}
            >
              {bp === "desktop" ? "🖥" : bp === "tablet" ? "▯" : "▮"}
            </button>
          ))}
          <div className="mx-1 h-5 w-px bg-ink-800" />
          <button onClick={() => setZoom(zoom - 0.1)} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-ink-800">−</button>
          <span className="w-10 text-center text-[10px] text-slate-500">{Math.round(zoom * 100)}%</span>
          <button onClick={() => setZoom(zoom + 0.1)} className="rounded-md px-2 py-1 text-xs text-slate-400 hover:bg-ink-800">+</button>
        </div>

        <button
          onClick={newProject}
          className="rounded-md border border-ink-700 px-2 py-1.5 text-[11px] text-slate-400 hover:text-white"
        >
          New
        </button>
        <button
          onClick={togglePreview}
          className={cn(
            "rounded-md px-3 py-1.5 text-[11px] font-semibold",
            preview ? "bg-brand-600 text-white" : "border border-ink-700 text-slate-300 hover:text-white"
          )}
        >
          {preview ? "Exit preview" : "Preview"}
        </button>
        <button
          onClick={() => setRightTab("deploy")}
          className="rounded-md bg-brand-600 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-brand-500"
        >
          Deploy →
        </button>
      </header>

      {/* Page tabs */}
      <div className="flex h-9 shrink-0 items-center gap-1 overflow-x-auto border-b border-ink-800 bg-ink-900/60 px-3">
        {project.pages.map((p) => (
          <div
            key={p.id}
            className={cn(
              "group flex items-center gap-1 rounded-md px-2 py-1 text-[11px]",
              p.id === activePageId ? "bg-ink-800 text-white" : "text-slate-500 hover:text-slate-200"
            )}
          >
            <button onClick={() => selectPage(p.id)} className="max-w-[140px] truncate">{p.name}</button>
            {project.pages.length > 1 ? (
              <button onClick={() => deletePage(p.id)} className="hidden text-slate-600 hover:text-red-400 group-hover:block">✕</button>
            ) : null}
          </div>
        ))}
        <button onClick={addPage} className="rounded-md px-2 py-1 text-[11px] text-slate-500 hover:text-white">+ Page</button>
        {activePage ? (
          <input
            value={activePage.path}
            onChange={(e) => updatePage(activePage.id, { path: e.target.value })}
            className="ml-auto w-32 rounded-md border border-transparent bg-transparent px-2 py-1 font-mono text-[10px] text-slate-500 outline-none focus:border-ink-700"
            title="Page path"
          />
        ) : null}
      </div>

      {/* Main area */}
      <div className="flex min-h-0 flex-1">
        {/* Left panel */}
        <aside className="flex w-64 shrink-0 border-r border-ink-800 bg-ink-900">
          <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-r border-ink-800 py-2">
            {LEFT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setLeftTab(t.id)}
                title={t.label}
                className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-lg text-sm",
                  leftTab === t.id ? "bg-brand-600/20 text-brand-300" : "text-slate-500 hover:text-white"
                )}
              >
                <span>{t.icon}</span>
              </button>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            {leftTab === "insert" ? <InsertPanel /> : null}
            {leftTab === "layers" ? <LayersPanel /> : null}
            {leftTab === "assets" ? <AssetsPanel /> : null}
            {leftTab === "templates" ? <TemplatesPanel /> : null}
          </div>
        </aside>

        {/* Canvas */}
        <main className="min-w-0 flex-1">
          <Canvas />
        </main>

        {/* Right panel */}
        <aside className="flex w-80 shrink-0 border-l border-ink-800 bg-ink-900">
          <div className="min-w-0 flex-1">
            {rightTab === "design" ? <InspectorPanel /> : null}
            {rightTab === "ai" ? <AiPanel /> : null}
            {rightTab === "settings" ? <SettingsPanel /> : null}
            {rightTab === "deploy" ? <DeployPanel /> : null}
          </div>
          <div className="flex w-12 shrink-0 flex-col items-center gap-1 border-l border-ink-800 py-2">
            {RIGHT_TABS.map((t) => (
              <button
                key={t.id}
                onClick={() => setRightTab(t.id)}
                title={t.label}
                className={cn(
                  "flex h-10 w-10 flex-col items-center justify-center rounded-lg text-sm",
                  rightTab === t.id ? "bg-brand-600/20 text-brand-300" : "text-slate-500 hover:text-white"
                )}
              >
                <span>{t.icon}</span>
              </button>
            ))}
          </div>
        </aside>
      </div>
    </div>
  );
}
