"use client";

import React from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { useBuilder } from "@/store/builder";
import { NodeView, RenderProvider } from "@/components/NodeView";
import { findParent } from "@/lib/tree";
import { COMPONENT_MAP, isContainerKind } from "@/lib/registry";
import type { DesignNode } from "@/lib/types";
import { cn } from "@/lib/utils";

const BREAKPOINT_WIDTH = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

export function Canvas() {
  const project = useBuilder((s) => s.project);
  const activePageId = useBuilder((s) => s.activePageId);
  const breakpoint = useBuilder((s) => s.breakpoint);
  const zoom = useBuilder((s) => s.zoom);
  const preview = useBuilder((s) => s.preview);
  const selectedId = useBuilder((s) => s.selectedId);
  const select = useBuilder((s) => s.select);
  const addNode = useBuilder((s) => s.addNode);
  const move = useBuilder((s) => s.move);
  const [activeDrag, setActiveDrag] = React.useState<{ label: string } | null>(null);

  const page = project.pages.find((p) => p.id === activePageId) ?? project.pages[0];

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const onDragStart = (event: DragStartEvent) => {
    const data = event.active.data.current as { label?: string } | undefined;
    setActiveDrag({ label: data?.label ?? "Element" });
  };

  const onDragEnd = (event: DragEndEvent) => {
    setActiveDrag(null);
    const { active, over } = event;
    if (!over || !page) return;
    const activeData = active.data.current as
      | { type: "palette"; kind: DesignNode["kind"] }
      | { type: "node"; id: string }
      | undefined;
    const overData = over.data.current as
      | { type: "container" | "node" | "root"; id: string }
      | undefined;
    if (!activeData || !overData) return;

    const root = page.root;

    const resolveTarget = (): { parentId: string; index?: number } | null => {
      if (overData.type === "root") return { parentId: root.id };
      if (overData.type === "container") return { parentId: overData.id };
      // insert after the hovered node, inside its parent
      const parent = findParent(root, overData.id);
      if (!parent) return { parentId: root.id };
      const index = parent.children.findIndex((c) => c.id === overData.id) + 1;
      return { parentId: parent.id, index };
    };

    const target = resolveTarget();
    if (!target) return;

    if (activeData.type === "palette") {
      addNode(activeData.kind, target.parentId, target.index);
    } else {
      if (activeData.id === target.parentId) return;
      move(activeData.id, target.parentId, target.index ?? Number.MAX_SAFE_INTEGER);
    }
  };

  if (!page) {
    return <div className="flex h-full items-center justify-center text-slate-500">No page</div>;
  }

  if (preview) {
    return (
      <div className="h-full overflow-auto bg-ink-950">
        <div className="mx-auto min-h-full bg-white" style={{ width: BREAKPOINT_WIDTH[breakpoint] }}>
          <RenderProvider value={{ mode: "preview", breakpoint }}>
            <NodeView node={page.root} />
          </RenderProvider>
        </div>
      </div>
    );
  }

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div
        className="h-full overflow-auto bg-ink-950 p-6"
        onClick={() => select(null)}
        role="presentation"
      >
        <div
          className="mx-auto origin-top transition-transform"
          style={{ width: BREAKPOINT_WIDTH[breakpoint], transform: `scale(${zoom})` }}
        >
          <div
            className="overflow-hidden rounded-xl border border-ink-700 bg-white shadow-panel"
            onClick={(e) => e.stopPropagation()}
            role="presentation"
          >
            <RenderProvider
              value={{
                mode: "canvas",
                breakpoint,
                selectedId,
                onSelect: select,
                childrenRenderer: (child) => <CanvasNode node={child} />,
              }}
            >
              <CanvasNode node={page.root} isRoot />
            </RenderProvider>
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeDrag ? (
          <div className="rounded-lg border border-brand-500 bg-ink-800 px-3 py-2 text-xs font-medium text-brand-300 shadow-panel">
            {activeDrag.label}
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

function CanvasNode({ node, isRoot = false }: { node: DesignNode; isRoot?: boolean }) {
  const selectedId = useBuilder((s) => s.selectedId);
  const select = useBuilder((s) => s.select);
  const hover = useBuilder((s) => s.hover);
  const isContainer = isContainerKind(node.kind);
  const selected = selectedId === node.id;

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { type: isRoot ? "root" : isContainer ? "container" : "node", id: node.id },
  });

  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({
    id: `drag-${node.id}`,
    data: { type: "node", id: node.id, label: node.name },
    disabled: isRoot || node.locked,
  });

  const setRefs = (el: HTMLElement | null) => {
    setDropRef(el);
    setDragRef(el);
  };

  const def = COMPONENT_MAP[node.kind];

  return (
    <div
      ref={setRefs}
      {...attributes}
      {...listeners}
      data-node-id={node.id}
      className={cn(
        "canvas-node",
        selected && "selected",
        node.locked && "locked",
        isDragging && "opacity-40"
      )}
      style={{ position: "relative" }}
      onClick={(e) => {
        e.stopPropagation();
        select(node.id);
      }}
      onMouseEnter={() => hover(node.id)}
      onMouseLeave={() => hover(null)}
    >
      {/* selection label */}
      {selected && !isRoot ? (
        <div className="pointer-events-none absolute -top-5 left-0 z-20 rounded-t-md bg-brand-600 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">
          {def?.label ?? node.kind}
        </div>
      ) : null}

      {/* drop indicator line (before this node) */}
      {isOver && !isContainer && !isRoot ? (
        <div className="pointer-events-none absolute -top-[2px] left-0 right-0 z-20 h-[3px] rounded-full bg-brand-500 shadow-[0_0_8px_rgba(99,102,241,0.8)]" />
      ) : null}

      {/* render the actual node content (children are rendered via childrenRenderer) */}
      <NodeView node={node} />

      {isOver && (isContainer || isRoot) ? (
        <div className="pointer-events-none absolute inset-0 z-10 rounded-md border-2 border-dashed border-brand-500 bg-brand-500/5" />
      ) : null}
    </div>
  );
}
