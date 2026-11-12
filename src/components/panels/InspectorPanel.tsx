"use client";

import React from "react";
import { useBuilder } from "@/store/builder";
import { COMPONENT_MAP } from "@/lib/registry";
import { findNode } from "@/lib/tree";
import type { StyleModel } from "@/lib/types";
import { cn } from "@/lib/utils";

const SPACING_KEYS = ["top", "right", "bottom", "left"] as const;

export function InspectorPanel() {
  const project = useBuilder((s) => s.project);
  const activePageId = useBuilder((s) => s.activePageId);
  const selectedId = useBuilder((s) => s.selectedId);
  const breakpoint = useBuilder((s) => s.breakpoint);
  const updateStyle = useBuilder((s) => s.updateStyle);
  const updateContent = useBuilder((s) => s.updateContent);
  const renameNode = useBuilder((s) => s.renameNode);
  const deleteNode = useBuilder((s) => s.deleteNode);
  const duplicateNode = useBuilder((s) => s.duplicateNode);
  const wrapInSection = useBuilder((s) => s.wrapInSection);

  const page = project.pages.find((p) => p.id === activePageId);
  const node = page && selectedId ? findNode(page.root, selectedId) : null;

  if (!node) {
    return (
      <div className="flex h-full flex-col items-center justify-center p-6 text-center">
        <div className="text-3xl">🎯</div>
        <p className="mt-3 text-sm font-medium text-slate-300">Nothing selected</p>
        <p className="mt-1 text-xs text-slate-500">Click any element on the canvas to edit its design.</p>
      </div>
    );
  }

  const def = COMPONENT_MAP[node.kind];
  const style = breakpoint === "desktop" ? node.style : { ...node.style, ...(node.responsive?.[breakpoint] ?? {}) };
  const set = (patch: StyleModel) => updateStyle(node.id, patch);
  const setData = (key: string, value: unknown) =>
    updateContent(node.id, { data: { ...(node.content.data ?? {}), [key]: value } });

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 p-3">
        <div className="flex items-center justify-between gap-2">
          <input
            value={node.name}
            onChange={(e) => renameNode(node.id, e.target.value)}
            className="w-full rounded-md border border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-white outline-none hover:border-ink-700 focus:border-brand-500"
          />
          <div className="flex shrink-0 gap-1">
            <button onClick={() => duplicateNode(node.id)} title="Duplicate" className="rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white">⧉</button>
            <button onClick={() => wrapInSection(node.id)} title="Wrap in section" className="rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-white">▭</button>
            <button onClick={() => deleteNode(node.id)} title="Delete" className="rounded-md p-1.5 text-slate-400 hover:bg-ink-800 hover:text-red-400">✕</button>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <button
            onClick={() => useBuilder.getState().select(null)}
            className="flex-1 rounded-lg border border-ink-700 px-3 py-2 text-xs font-medium text-slate-300 hover:border-ink-600 hover:text-white"
          >
            ← Back
          </button>
          <button
            onClick={() => deleteNode(node.id)}
            className="flex-1 rounded-lg border border-red-500/40 bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-400 hover:bg-red-500/20"
          >
            🗑 Delete element
          </button>
        </div>
        <p className="mt-1 px-1 text-[10px] uppercase tracking-wider text-slate-500">
          {def?.label ?? node.kind} · {breakpoint}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Content fields */}
        {def && def.fields.length > 0 ? (
          <Section title="Content">
            {def.fields.map((field) => {
              const target = field.target ?? "content";
              const value =
                target === "data"
                  ? String((node.content.data ?? {})[field.key] ?? "")
                  : String((node.content as Record<string, unknown>)[field.key] ?? "");
              const onChange = (v: string) => {
                if (target === "data") {
                  setData(field.key, field.type === "number" ? Number(v) : v);
                } else if (field.type === "items") {
                  updateContent(node.id, { [field.key]: v.split("\n").map((s) => s.trim()).filter(Boolean) });
                } else {
                  updateContent(node.id, { [field.key]: v });
                }
              };
              return (
                <Field key={field.key} label={field.label}>
                  {field.type === "textarea" ? (
                    <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3} className={inputCls} />
                  ) : field.type === "select" ? (
                    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
                      {field.options?.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                      ))}
                    </select>
                  ) : field.type === "color" ? (
                    <input type="color" value={value || "#000000"} onChange={(e) => onChange(e.target.value)} className="h-9 w-full rounded-md border border-ink-700 bg-ink-850" />
                  ) : field.type === "number" ? (
                    <input type="number" value={value} min={field.min} max={field.max} step={field.step ?? 1} onChange={(e) => onChange(e.target.value)} className={inputCls} />
                  ) : field.type === "items" ? (
                    <textarea value={(node.content.items ?? []).join("\n")} onChange={(e) => onChange(e.target.value)} rows={4} className={inputCls} placeholder="One per line" />
                  ) : (
                    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} placeholder={field.placeholder} />
                  )}
                </Field>
              );
            })}
          </Section>
        ) : null}

        {/* Layout */}
        <Section title="Layout">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Display">
              <select value={style.display ?? "block"} onChange={(e) => set({ display: e.target.value as StyleModel["display"] })} className={inputCls}>
                {["block", "flex", "grid", "inline-flex", "none"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Direction">
              <select value={style.flexDirection ?? "column"} onChange={(e) => set({ flexDirection: e.target.value as StyleModel["flexDirection"] })} className={inputCls}>
                {["row", "row-reverse", "column", "column-reverse"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Justify">
              <select value={style.justifyContent ?? "flex-start"} onChange={(e) => set({ justifyContent: e.target.value as StyleModel["justifyContent"] })} className={inputCls}>
                {["flex-start", "center", "flex-end", "space-between", "space-around", "space-evenly"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Align">
              <select value={style.alignItems ?? "stretch"} onChange={(e) => set({ alignItems: e.target.value as StyleModel["alignItems"] })} className={inputCls}>
                {["flex-start", "center", "flex-end", "stretch", "baseline"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Gap (px)">
              <input type="number" value={style.gap ?? 0} onChange={(e) => set({ gap: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Columns">
              <input type="number" min={1} max={12} value={style.columns ?? 3} onChange={(e) => set({ columns: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Width">
              <input type="text" value={style.width ?? ""} onChange={(e) => set({ width: e.target.value })} className={inputCls} placeholder="100%" />
            </Field>
            <Field label="Height">
              <input type="text" value={style.height ?? ""} onChange={(e) => set({ height: e.target.value })} className={inputCls} placeholder="auto" />
            </Field>
            <Field label="Min height">
              <input type="text" value={style.minHeight ?? ""} onChange={(e) => set({ minHeight: e.target.value })} className={inputCls} placeholder="100vh" />
            </Field>
            <Field label="Max width">
              <input type="text" value={style.maxWidth ?? ""} onChange={(e) => set({ maxWidth: e.target.value })} className={inputCls} placeholder="720px" />
            </Field>
          </div>
        </Section>

        {/* Spacing */}
        <Section title="Spacing">
          <SpacingEditor label="Padding" value={style.padding} onChange={(padding) => set({ padding })} />
          <SpacingEditor label="Margin" value={style.margin} onChange={(margin) => set({ margin })} />
        </Section>

        {/* Appearance */}
        <Section title="Appearance">
          <Field label="Background">
            <div className="flex gap-2">
              <input type="color" value={toHex(style.background) ?? "#ffffff"} onChange={(e) => set({ background: e.target.value })} className="h-9 w-12 shrink-0 rounded-md border border-ink-700 bg-ink-850" />
              <input type="text" value={style.background ?? ""} onChange={(e) => set({ background: e.target.value })} className={inputCls} placeholder="#fff or gradient" />
            </div>
          </Field>
          <Field label="Text color">
            <div className="flex gap-2">
              <input type="color" value={toHex(style.color) ?? "#0f172a"} onChange={(e) => set({ color: e.target.value })} className="h-9 w-12 shrink-0 rounded-md border border-ink-700 bg-ink-850" />
              <input type="text" value={style.color ?? ""} onChange={(e) => set({ color: e.target.value })} className={inputCls} placeholder="#0f172a" />
            </div>
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Radius (px)">
              <input type="number" min={0} value={style.radius ?? 0} onChange={(e) => set({ radius: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Opacity">
              <input type="number" min={0} max={1} step={0.05} value={style.opacity ?? 1} onChange={(e) => set({ opacity: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Border width">
              <input type="number" min={0} value={style.borderWidth ?? 0} onChange={(e) => set({ borderWidth: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Border color">
              <input type="color" value={toHex(style.borderColor) ?? "#e2e8f0"} onChange={(e) => set({ borderColor: e.target.value })} className="h-9 w-full rounded-md border border-ink-700 bg-ink-850" />
            </Field>
          </div>
          <Field label="Shadow">
            <input type="text" value={style.shadow ?? ""} onChange={(e) => set({ shadow: e.target.value })} className={inputCls} placeholder="0 12px 30px -18px rgba(0,0,0,.35)" />
          </Field>
        </Section>

        {/* Typography */}
        <Section title="Typography">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Font size">
              <input type="number" min={8} value={style.fontSize ?? 16} onChange={(e) => set({ fontSize: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Weight">
              <select value={style.fontWeight ?? 400} onChange={(e) => set({ fontWeight: Number(e.target.value) })} className={inputCls}>
                {[300, 400, 500, 600, 700, 800, 900].map((w) => <option key={w} value={w}>{w}</option>)}
              </select>
            </Field>
            <Field label="Line height">
              <input type="number" min={0.8} step={0.05} value={style.lineHeight ?? 1.5} onChange={(e) => set({ lineHeight: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Align">
              <select value={style.textAlign ?? "left"} onChange={(e) => set({ textAlign: e.target.value as StyleModel["textAlign"] })} className={inputCls}>
                {["left", "center", "right", "justify"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
          </div>
          <Field label="Font family">
            <input type="text" value={style.fontFamily ?? ""} onChange={(e) => set({ fontFamily: e.target.value })} className={inputCls} placeholder="Inter, system-ui" />
          </Field>
        </Section>

        {/* Position */}
        <Section title="Position">
          <div className="grid grid-cols-2 gap-2">
            <Field label="Position">
              <select value={style.position ?? "static"} onChange={(e) => set({ position: e.target.value as StyleModel["position"] })} className={inputCls}>
                {["static", "relative", "absolute"].map((v) => <option key={v} value={v}>{v}</option>)}
              </select>
            </Field>
            <Field label="Z-index">
              <input type="number" value={style.zIndex ?? 0} onChange={(e) => set({ zIndex: Number(e.target.value) })} className={inputCls} />
            </Field>
            <Field label="Top"><input type="number" value={style.top ?? 0} onChange={(e) => set({ top: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Right"><input type="number" value={style.right ?? 0} onChange={(e) => set({ right: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Bottom"><input type="number" value={style.bottom ?? 0} onChange={(e) => set({ bottom: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Left"><input type="number" value={style.left ?? 0} onChange={(e) => set({ left: Number(e.target.value) })} className={inputCls} /></Field>
            <Field label="Rotate (deg)"><input type="number" value={style.rotate ?? 0} onChange={(e) => set({ rotate: Number(e.target.value) })} className={inputCls} /></Field>
          </div>
        </Section>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-md border border-ink-700 bg-ink-850 px-2 py-1.5 text-xs text-slate-200 outline-none placeholder:text-slate-600 focus:border-brand-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(true);
  return (
    <div className="mb-3 overflow-hidden rounded-xl border border-ink-800">
      <button onClick={() => setOpen((v) => !v)} className="flex w-full items-center justify-between bg-ink-850 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-400 hover:text-white">
        {title}
        <span>{open ? "−" : "+"}</span>
      </button>
      {open ? <div className="space-y-2 p-3">{children}</div> : null}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1 block text-[10px] font-medium text-slate-500">{label}</span>
      {children}
    </label>
  );
}

function SpacingEditor({
  label,
  value,
  onChange,
}: {
  label: string;
  value?: { top: number; right: number; bottom: number; left: number };
  onChange: (v: { top: number; right: number; bottom: number; left: number }) => void;
}) {
  const v = value ?? { top: 0, right: 0, bottom: 0, left: 0 };
  return (
    <div>
      <span className="mb-1 block text-[10px] font-medium text-slate-500">{label}</span>
      <div className="grid grid-cols-4 gap-1.5">
        {SPACING_KEYS.map((k) => (
          <label key={k} className="block">
            <span className="mb-0.5 block text-center text-[9px] uppercase text-slate-600">{k[0]}</span>
            <input
              type="number"
              value={v[k]}
              onChange={(e) => onChange({ ...v, [k]: Number(e.target.value) })}
              className="w-full rounded-md border border-ink-700 bg-ink-850 px-1 py-1.5 text-center text-xs text-slate-200 outline-none focus:border-brand-500"
            />
          </label>
        ))}
      </div>
    </div>
  );
}

function toHex(color?: string): string | null {
  if (!color) return null;
  const m = color.trim().match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);
  if (!m) return null;
  const hex = m[1];
  if (hex.length === 3) {
    return "#" + hex.split("").map((c) => c + c).join("");
  }
  return "#" + hex;
}
