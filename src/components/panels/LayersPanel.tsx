"use client";

import React from "react";
import {
  DndContext,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useBuilder } from "@/store/builder";
import { flatten, findParent } from "@/lib/tree";
import { COMPONENT_MAP } from "@/lib/registry";
import { cn } from "@/lib/utils";

export function LayersPanel() {
  const project = useBuilder((s) => s.project);
  const activePageId = useBuilder((s) => s.activePageId);
  const selectedId = useBuilder((s) => s.selectedId);
  const select = useBuilder((s) => s.select);
  const toggleHidden = useBuilder((s) => s.toggleHidden);
  const toggleLocked = useBuilder((s) => s.toggleLocked);
  const deleteNode = useBuilder((s) => s.deleteNode);
  const duplicateNode = useBuilder((s) => s.duplicateNode);
  const move = useBuilder((s) => s.move);

  const page = project.pages.find((p) => p.id === activePageId);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  if (!page) return null;

  const items = flatten(page.root).filter(({ node }) => node.id !== page.root.id);
  const ids = items.map(({ node }) => node.id);

  const onDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const dragId = String(active.id);
    const overId = String(over.id);
    const parent = findParent(page.root, overId);
    if (!parent) return;
    const overIndex = parent.children.findIndex((c) => c.id === overId);
    move(dragId, parent.id, overIndex);
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-ink-800 px-3 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Layers · {items.length}
        </span>
        <span className="text-[9px] text-slate-600">drag ⠿ to reorder</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2">
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={ids} strategy={verticalListSortingStrategy}>
            {items.map(({ node, depth }) => (
              <SortableLayerRow
                key={node.id}
                id={node.id}
                depth={depth}
                name={node.name}
                kind={node.kind}
                hidden={!!node.hidden}
                locked={!!node.locked}
                selected={node.id === selectedId}
                onSelect={() => select(node.id)}
                onToggleHidden={() => toggleHidden(node.id)}
                onToggleLocked={() => toggleLocked(node.id)}
                onDuplicate={() => duplicateNode(node.id)}
                onDelete={() => deleteNode(node.id)}
              />
            ))}
          </SortableContext>
        </DndContext>
        {items.length === 0 ? (
          <p className="mt-8 text-center text-xs text-slate-500">Empty page — add elements from Insert.</p>
        ) : null}
      </div>
    </div>
  );
}

function SortableLayerRow({
  id,
  depth,
  name,
  kind,
  hidden,
  locked,
  selected,
  onSelect,
  onToggleHidden,
  onToggleLocked,
  onDuplicate,
  onDelete,
}: {
  id: string;
  depth: number;
  name: string;
  kind: string;
  hidden: boolean;
  locked: boolean;
  selected: boolean;
  onSelect: () => void;
  onToggleHidden: () => void;
  onToggleLocked: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id });
  const def = COMPONENT_MAP[kind as keyof typeof COMPONENT_MAP];

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        paddingLeft: `${4 + depth * 14}px`,
      }}
      className={cn(
        "group flex items-center gap-1 rounded-md py-1 pr-1 text-xs",
        selected ? "bg-brand-600/20 text-brand-300" : "text-slate-300 hover:bg-ink-800",
        isDragging && "z-10 opacity-70 shadow-panel"
      )}
    >
      {/* drag handle */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none rounded p-1 text-slate-600 hover:text-slate-300 active:cursor-grabbing"
        title="Drag to reorder"
        aria-label="Drag to reorder"
      >
        ⠿
      </button>
      <button onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-1.5 text-left">
        <span className="w-4 text-center text-[11px] text-slate-500">{def?.icon ?? "•"}</span>
        <span className={cn("flex-1 truncate", hidden && "opacity-40 line-through")}>{name}</span>
      </button>
      <button
        className="rounded p-0.5 text-slate-500 hover:text-white"
        title={hidden ? "Show" : "Hide"}
        onClick={onToggleHidden}
      >
        {hidden ? "🙈" : "👁"}
      </button>
      <button
        className="rounded p-0.5 text-slate-500 hover:text-white"
        title={locked ? "Unlock" : "Lock"}
        onClick={onToggleLocked}
      >
        {locked ? "🔒" : "🔓"}
      </button>
      <button
        className="hidden rounded p-0.5 text-slate-500 hover:text-white group-hover:block"
        title="Duplicate"
        onClick={onDuplicate}
      >
        ⧉
      </button>
      <button
        className="hidden rounded p-0.5 text-slate-500 hover:text-red-400 group-hover:block"
        title="Delete"
        onClick={onDelete}
      >
        ✕
      </button>
    </div>
  );
}
