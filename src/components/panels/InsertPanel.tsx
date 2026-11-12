"use client";

import React, { useState } from "react";
import { useDraggable } from "@dnd-kit/core";
import { COMPONENTS, GROUPS } from "@/lib/registry";
import { useBuilder } from "@/store/builder";
import type { ElementKind } from "@/lib/types";
import { cn } from "@/lib/utils";

export function InsertPanel() {
  const [query, setQuery] = useState("");
  const addNode = useBuilder((s) => s.addNode);

  const filtered = COMPONENTS.filter(
    (c) =>
      !query ||
      c.label.toLowerCase().includes(query.toLowerCase()) ||
      c.description.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 p-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search elements…"
          className="w-full rounded-lg border border-ink-700 bg-ink-850 px-3 py-2 text-sm text-slate-200 outline-none placeholder:text-slate-500 focus:border-brand-500"
        />
      </div>
      <div className="flex-1 overflow-y-auto p-3">
        {GROUPS.map((group) => {
          const items = filtered.filter((c) => c.group === group);
          if (items.length === 0) return null;
          return (
            <div key={group} className="mb-4">
              <div className="mb-1.5 px-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                {group}
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {items.map((def) => (
                  <PaletteItem key={def.kind} kind={def.kind} label={def.label} icon={def.icon} onAdd={() => addNode(def.kind)} />
                ))}
              </div>
            </div>
          );
        })}
        {filtered.length === 0 ? (
          <p className="mt-8 text-center text-sm text-slate-500">No elements match “{query}”</p>
        ) : null}
      </div>
    </div>
  );
}

function PaletteItem({
  kind,
  label,
  icon,
  onAdd,
}: {
  kind: ElementKind;
  label: string;
  icon: string;
  onAdd: () => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${kind}`,
    data: { type: "palette", kind, label },
  });

  return (
    <button
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      onClick={onAdd}
      title={`Drag or click to add ${label}`}
      className={cn(
        "flex cursor-grab flex-col items-center gap-1 rounded-lg border border-ink-800 bg-ink-850 px-2 py-3 text-slate-300 transition hover:border-brand-600 hover:bg-ink-800 hover:text-white active:cursor-grabbing",
        isDragging && "opacity-40"
      )}
    >
      <span className="text-lg leading-none">{icon}</span>
      <span className="text-[11px] font-medium">{label}</span>
    </button>
  );
}
