"use client";

import React, { useState } from "react";
import { TEMPLATES, TEMPLATE_CATEGORIES } from "@/lib/templates";
import { useBuilder } from "@/store/builder";
import { cn } from "@/lib/utils";

export function TemplatesPanel() {
  const [category, setCategory] = useState("All");
  const loadProject = useBuilder((s) => s.loadProject);
  const project = useBuilder((s) => s.project);

  const filtered = TEMPLATES.filter((t) => category === "All" || t.category === category);

  const apply = (templateId: string) => {
    const template = TEMPLATES.find((t) => t.id === templateId);
    if (!template) return;
    if (!confirm(`Replace current project with the “${template.name}” template?`)) return;
    const pages = template.build();
    loadProject({
      ...project,
      name: template.name,
      settings: { ...project.settings, name: template.name },
      pages,
      updatedAt: Date.now(),
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 p-3">
        <div className="flex flex-wrap gap-1.5">
          {TEMPLATE_CATEGORIES.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={cn(
                "rounded-full border px-2.5 py-1 text-[10px] font-medium transition",
                category === c
                  ? "border-brand-500 bg-brand-600/20 text-brand-300"
                  : "border-ink-700 text-slate-400 hover:text-white"
              )}
            >
              {c}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        <div className="grid grid-cols-2 gap-2">
          {filtered.map((t) => (
            <button
              key={t.id}
              onClick={() => apply(t.id)}
              className="group overflow-hidden rounded-xl border border-ink-800 bg-ink-850 text-left transition hover:border-brand-600"
            >
              <div
                className="flex h-24 items-center justify-center text-2xl"
                style={{ background: `linear-gradient(140deg, ${t.accent}33, ${t.accent}11)` }}
              >
                <span style={{ color: t.accent }}>✦</span>
              </div>
              <div className="p-2">
                <p className="text-[11px] font-semibold text-slate-200 group-hover:text-white">{t.name}</p>
                <p className="mt-0.5 line-clamp-2 text-[9px] leading-snug text-slate-500">{t.description}</p>
              </div>
            </button>
          ))}
        </div>
        <p className="mt-4 text-center text-[10px] text-slate-600">
          Applying a template replaces the current pages.
        </p>
      </div>
    </div>
  );
}
