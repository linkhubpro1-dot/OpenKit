import type { DesignNode, Page, StyleModel } from "@/lib/types";
import { isContainerKind } from "@/lib/registry";

export function walk(
  node: DesignNode,
  visit: (node: DesignNode, parent: DesignNode | null, depth: number) => void,
  parent: DesignNode | null = null,
  depth = 0
) {
  visit(node, parent, depth);
  for (const child of node.children) walk(child, visit, node, depth + 1);
}

export function findNode(root: DesignNode, id: string): DesignNode | null {
  let found: DesignNode | null = null;
  walk(root, (n) => {
    if (n.id === id) found = n;
  });
  return found;
}

export function findParent(root: DesignNode, id: string): DesignNode | null {
  let found: DesignNode | null = null;
  walk(root, (n) => {
    for (const c of n.children) if (c.id === id) found = n;
  });
  return found;
}

export function findPath(root: DesignNode, id: string): DesignNode[] {
  const path: DesignNode[] = [];
  const search = (node: DesignNode, trail: DesignNode[]): boolean => {
    const next = [...trail, node];
    if (node.id === id) {
      path.push(...next);
      return true;
    }
    return node.children.some((c) => search(c, next));
  };
  search(root, []);
  return path;
}

export function removeNode(root: DesignNode, id: string): DesignNode {
  return {
    ...root,
    children: root.children
      .filter((c) => c.id !== id)
      .map((c) => removeNode(c, id)),
  };
}

export function insertNode(
  root: DesignNode,
  parentId: string,
  node: DesignNode,
  index?: number
): DesignNode {
  if (root.id === parentId) {
    const children = [...root.children];
    const at = index === undefined ? children.length : Math.max(0, Math.min(index, children.length));
    children.splice(at, 0, node);
    return { ...root, children };
  }
  return {
    ...root,
    children: root.children.map((c) => insertNode(c, parentId, node, index)),
  };
}

export function updateNode(
  root: DesignNode,
  id: string,
  patch: (node: DesignNode) => DesignNode
): DesignNode {
  if (root.id === id) return patch(root);
  return { ...root, children: root.children.map((c) => updateNode(c, id, patch)) };
}

export function moveNode(
  root: DesignNode,
  dragId: string,
  targetParentId: string,
  index: number
): DesignNode {
  if (dragId === targetParentId) return root;
  const dragged = findNode(root, dragId);
  if (!dragged) return root;
  // prevent dropping a node into its own subtree
  if (findNode(dragged, targetParentId)) return root;

  const without = removeNode(root, dragId);
  return insertNode(without, targetParentId, dragged, index);
}

export function countNodes(node: DesignNode): number {
  let total = 1;
  for (const c of node.children) total += countNodes(c);
  return total;
}

export function styleToCss(style: StyleModel): string {
  const out: string[] = [];
  const push = (k: string, v: string | number | undefined | null) => {
    if (v === undefined || v === null || v === "") return;
    out.push(`${k}:${typeof v === "number" ? `${v}` : v}`);
  };

  push("display", style.display);
  push("flex-direction", style.flexDirection);
  push("justify-content", style.justifyContent);
  push("align-items", style.alignItems);
  push("gap", style.gap !== undefined ? `${style.gap}px` : undefined);
  push("width", style.width);
  push("height", style.height);
  push("min-height", style.minHeight);
  push("max-width", style.maxWidth);
  push("aspect-ratio", style.aspectRatio);
  push("overflow", style.overflow);

  if (style.padding) {
    const p = style.padding;
    push("padding", `${p.top}px ${p.right}px ${p.bottom}px ${p.left}px`);
  }
  if (style.margin) {
    const m = style.margin;
    push("margin", `${m.top}px ${m.right}px ${m.bottom}px ${m.left}px`);
  }

  push("background", style.background);
  push("background-image", style.backgroundImage || undefined);
  push("background-size", style.backgroundSize);
  push("background-position", style.backgroundPosition);
  push("color", style.color);

  if (style.borderWidth && style.borderStyle && style.borderStyle !== "none") {
    push("border", `${style.borderWidth}px ${style.borderStyle} ${style.borderColor ?? "#e2e8f0"}`);
  }
  push("border-radius", style.radius !== undefined ? `${style.radius}px` : undefined);
  push("opacity", style.opacity);
  push("box-shadow", style.shadow);
  push("backdrop-filter", style.blur ? `blur(${style.blur}px)` : undefined);

  push("font-family", style.fontFamily);
  push("font-size", style.fontSize !== undefined ? `${style.fontSize}px` : undefined);
  push("font-weight", style.fontWeight);
  push("line-height", style.lineHeight);
  push("letter-spacing", style.letterSpacing !== undefined ? `${style.letterSpacing}px` : undefined);
  push("text-align", style.textAlign);
  push("text-transform", style.textTransform);
  push("text-decoration", style.textDecoration);

  push("position", style.position && style.position !== "static" ? style.position : undefined);
  push("top", style.top !== undefined ? `${style.top}px` : undefined);
  push("right", style.right !== undefined ? `${style.right}px` : undefined);
  push("bottom", style.bottom !== undefined ? `${style.bottom}px` : undefined);
  push("left", style.left !== undefined ? `${style.left}px` : undefined);
  push("z-index", style.zIndex);
  push("rotate", style.rotate ? `${style.rotate}deg` : undefined);

  return out.join(";");
}

/** Convert the style model into a React.CSSProperties object. */
export function styleToReactStyle(style: StyleModel): Record<string, string | number> {
  const result: Record<string, string | number> = {};
  for (const decl of styleToCss(style).split(";")) {
    if (!decl.trim()) continue;
    const idx = decl.indexOf(":");
    if (idx === -1) continue;
    const prop = decl.slice(0, idx).trim();
    const value = decl.slice(idx + 1).trim();
    const camel = prop.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
    result[camel] = /^-?\d+(\.\d+)?$/.test(value) ? Number(value) : value;
  }
  return result;
}

export function canAcceptDrop(parent: DesignNode, childId: string) {
  if (!isContainerKind(parent.kind)) return false;
  if (parent.id === childId) return false;
  return true;
}

export function flatten(node: DesignNode, depth = 0): { node: DesignNode; depth: number }[] {
  const out: { node: DesignNode; depth: number }[] = [{ node, depth }];
  for (const c of node.children) out.push(...flatten(c, depth + 1));
  return out;
}

export function pageStats(page: Page) {
  const all = flatten(page.root);
  return {
    total: all.length,
    containers: all.filter((i) => isContainerKind(i.node.kind)).length,
  };
}