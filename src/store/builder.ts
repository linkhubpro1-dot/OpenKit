import { create } from "zustand";
import type {
  AiMessage,
  AiSettings,
  AssetItem,
  Breakpoint,
  DesignNode,
  Page,
  Project,
  ProjectSettings,
  StyleModel,
} from "@/lib/types";
import { createNode } from "@/lib/registry";
import { findNode, findParent, insertNode, moveNode, removeNode, updateNode } from "@/lib/tree";
import { isContainerKind } from "@/lib/registry";
import { deepClone, uid } from "@/lib/utils";
import { blankPage, starterProject } from "@/lib/project";

const STORAGE_KEY = "openkil.project.v1";
const AI_KEY = "openkil.ai.v1";

interface HistoryEntry {
  pages: Page[];
  activePageId: string;
  label: string;
}

export interface BuilderState {
  project: Project;
  activePageId: string;
  selectedId: string | null;
  hoverId: string | null;
  breakpoint: Breakpoint;
  zoom: number;
  preview: boolean;
  leftTab: "insert" | "layers" | "assets" | "templates";
  rightTab: "design" | "ai" | "settings" | "deploy";
  activeAgent: "project-starter" | "layout-engineer" | "copilot" | "security" | "deploy" | "realism";
  aiSettings: AiSettings;
  aiMessages: AiMessage[];
  aiBusy: boolean;
  history: HistoryEntry[];
  future: HistoryEntry[];
  saved: boolean;

  /* project */
  setProject: (project: Project) => void;
  updateSettings: (patch: Partial<ProjectSettings>) => void;
  newProject: () => void;
  loadProject: (project: Project) => void;

  /* pages */
  addPage: () => void;
  selectPage: (id: string) => void;
  updatePage: (id: string, patch: Partial<Page>) => void;
  deletePage: (id: string) => void;

  /* selection */
  select: (id: string | null) => void;
  hover: (id: string | null) => void;
  setBreakpoint: (bp: Breakpoint) => void;
  setZoom: (z: number) => void;
  togglePreview: () => void;
  setLeftTab: (t: BuilderState["leftTab"]) => void;
  setRightTab: (t: BuilderState["rightTab"]) => void;
  setActiveAgent: (a: BuilderState["activeAgent"]) => void;

  /* nodes */
  addNode: (kind: DesignNode["kind"], parentId?: string, index?: number) => string | null;
  addNodeRaw: (node: DesignNode, parentId?: string, index?: number) => void;
  updateStyle: (id: string, patch: StyleModel, transient?: boolean) => void;
  updateContent: (id: string, patch: Record<string, unknown>) => void;
  renameNode: (id: string, name: string) => void;
  deleteNode: (id: string) => void;
  duplicateNode: (id: string) => void;
  toggleHidden: (id: string) => void;
  toggleLocked: (id: string) => void;
  move: (dragId: string, targetParentId: string, index: number) => void;
  reorder: (parentId: string, from: number, to: number) => void;
  wrapInSection: (id: string) => void;

  /* history */
  commit: (label: string) => void;
  undo: () => void;
  redo: () => void;

  /* assets */
  addAsset: (asset: Omit<AssetItem, "id" | "createdAt">) => AssetItem;
  deleteAsset: (id: string) => void;

  /* ai */
  setAiSettings: (patch: Partial<AiSettings>) => void;
  pushAiMessage: (msg: Omit<AiMessage, "id" | "createdAt">) => void;
  setAiBusy: (busy: boolean) => void;
  clearAiMessages: () => void;
  applyAiNodes: (nodes: DesignNode[], mode: "replace" | "append") => void;

  /* persistence */
  save: () => void;
  hydrate: () => void;
}

function snapshot(state: BuilderState): HistoryEntry {
  return {
    pages: deepClone(state.project.pages),
    activePageId: state.activePageId,
    label: "",
  };
}

export const useBuilder = create<BuilderState>((set, get) => ({
  project: starterProject(),
  activePageId: "",
  selectedId: null,
  hoverId: null,
  breakpoint: "desktop",
  zoom: 1,
  preview: false,
  leftTab: "insert",
  rightTab: "design",
  activeAgent: "copilot",
  aiSettings: {
    apiKey: "",
    model: "openrouter/free",
    baseUrl: "https://openrouter.ai/api/v1",
    temperature: 0.4,
  },
  aiMessages: [],
  aiBusy: false,
  history: [],
  future: [],
  saved: true,

  setProject: (project) =>
    set({ project, activePageId: project.pages[0]?.id ?? "", selectedId: null, saved: true }),

  updateSettings: (patch) => {
    get().commit("Update settings");
    set((s) => ({
      project: {
        ...s.project,
        settings: { ...s.project.settings, ...patch },
        updatedAt: Date.now(),
      },
      saved: false,
    }));
  },

  newProject: () => {
    const page = blankPage("Home");
    const project: Project = {
      id: uid("proj"),
      name: "Untitled project",
      updatedAt: Date.now(),
      settings: {
        name: "Untitled project",
        description: "",
        primary: "#4f46e5",
        accent: "#22d3ee",
        fontHeading: "Inter",
        fontBody: "Inter",
        radius: 12,
        mode: "website",
      },
      pages: [page],
      assets: [],
    };
    set({
      project,
      activePageId: page.id,
      selectedId: null,
      history: [],
      future: [],
      saved: true,
    });
  },

  loadProject: (project) =>
    set({
      project,
      activePageId: project.pages[0]?.id ?? "",
      selectedId: null,
      history: [],
      future: [],
      saved: true,
    }),

  addPage: () => {
    get().commit("Add page");
    const page = blankPage(`Page ${get().project.pages.length + 1}`);
    set((s) => ({
      project: { ...s.project, pages: [...s.project.pages, page], updatedAt: Date.now() },
      activePageId: page.id,
      selectedId: null,
      saved: false,
    }));
  },

  selectPage: (id) => set({ activePageId: id, selectedId: null }),

  updatePage: (id, patch) =>
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) => (p.id === id ? { ...p, ...patch } : p)),
        updatedAt: Date.now(),
      },
      saved: false,
    })),

  deletePage: (id) =>
    set((s) => {
      if (s.project.pages.length <= 1) return s;
      const pages = s.project.pages.filter((p) => p.id !== id);
      return {
        project: { ...s.project, pages, updatedAt: Date.now() },
        activePageId: s.activePageId === id ? pages[0].id : s.activePageId,
        selectedId: null,
        saved: false,
      };
    }),

  select: (id) => set({ selectedId: id }),
  hover: (id) => set({ hoverId: id }),
  setBreakpoint: (bp) => set({ breakpoint: bp }),
  setZoom: (z) => set({ zoom: Math.min(1.5, Math.max(0.3, z)) }),
  togglePreview: () => set((s) => ({ preview: !s.preview, selectedId: null })),
  setLeftTab: (t) => set({ leftTab: t }),
  setRightTab: (t) => set({ rightTab: t }),
  setActiveAgent: (a) => set({ activeAgent: a, rightTab: "ai" }),

  addNode: (kind, parentId, index) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page) return null;
    const targetParent = parentId ?? state.selectedId ?? page.root.id;
    let parentNode = findNode(page.root, targetParent);
    if (!parentNode) return null;
    // if the selected node can't hold children, insert after it inside its parent
    if (!isContainerKind(parentNode.kind)) {
      const currentId = parentNode.id;
      const parent = findParent(page.root, currentId);
      if (parent) {
        const afterIndex = parent.children.findIndex((c) => c.id === currentId) + 1;
        return get().addNode(kind, parent.id, afterIndex);
      }
      parentNode = page.root;
    }
    const resolvedParentId = parentNode.id;
    const node = createNode(kind);
    get().commit("Add element");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: insertNode(p.root, resolvedParentId, node, index) }
            : p
        ),
        updatedAt: Date.now(),
      },
      selectedId: node.id,
      saved: false,
    }));
    return node.id;
  },

  addNodeRaw: (node, parentId, index) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page) return;
    const targetParent = parentId ?? page.root.id;
    get().commit("Add element");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: insertNode(p.root, targetParent, node, index) }
            : p
        ),
        updatedAt: Date.now(),
      },
      selectedId: node.id,
      saved: false,
    }));
  },

  updateStyle: (id, patch, transient) => {
    if (!transient) get().commit("Style change");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) => {
          if (p.id !== s.activePageId) return p;
          const bp = s.breakpoint;
          return {
            ...p,
            root: updateNode(p.root, id, (n) => {
              if (bp === "desktop") {
                return { ...n, style: { ...n.style, ...patch } };
              }
              return {
                ...n,
                responsive: {
                  ...n.responsive,
                  [bp]: { ...(n.responsive?.[bp] ?? {}), ...patch },
                },
              };
            }),
          };
        }),
        updatedAt: Date.now(),
      },
      saved: false,
    }));
  },

  updateContent: (id, patch) => {
    get().commit("Content change");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? {
                ...p,
                root: updateNode(p.root, id, (n) => ({
                  ...n,
                  content: { ...n.content, ...patch },
                })),
              }
            : p
        ),
        updatedAt: Date.now(),
      },
      saved: false,
    }));
  },

  renameNode: (id, name) =>
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: updateNode(p.root, id, (n) => ({ ...n, name })) }
            : p
        ),
      },
    })),

  deleteNode: (id) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page || page.root.id === id) return;
    get().commit("Delete element");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId ? { ...p, root: removeNode(p.root, id) } : p
        ),
        updatedAt: Date.now(),
      },
      selectedId: null,
      saved: false,
    }));
  },

  duplicateNode: (id) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page) return;
    const node = findNode(page.root, id);
    const parent = findParent(page.root, id);
    if (!node || !parent) return;
    const copy = deepClone(node);
    const reid = (n: DesignNode) => {
      n.id = uid();
      n.children.forEach(reid);
    };
    reid(copy);
    copy.name = `${node.name} copy`;
    get().commit("Duplicate element");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: insertNode(p.root, parent.id, copy) }
            : p
        ),
        updatedAt: Date.now(),
      },
      selectedId: copy.id,
      saved: false,
    }));
  },

  toggleHidden: (id) => {
    get().commit("Toggle visibility");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: updateNode(p.root, id, (n) => ({ ...n, hidden: !n.hidden })) }
            : p
        ),
      },
      saved: false,
    }));
  },

  toggleLocked: (id) =>
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: updateNode(p.root, id, (n) => ({ ...n, locked: !n.locked })) }
            : p
        ),
      },
    })),

  move: (dragId, targetParentId, index) => {
    get().commit("Move element");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId ? { ...p, root: moveNode(p.root, dragId, targetParentId, index) } : p
        ),
        updatedAt: Date.now(),
      },
      saved: false,
    }));
  },

  reorder: (parentId, from, to) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page) return;
    const parent = findNode(page.root, parentId);
    if (!parent) return;
    const children = [...parent.children];
    const [moved] = children.splice(from, 1);
    if (!moved) return;
    children.splice(to, 0, moved);
    get().commit("Reorder");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) =>
          p.id === s.activePageId
            ? { ...p, root: updateNode(p.root, parentId, (n) => ({ ...n, children })) }
            : p
        ),
        updatedAt: Date.now(),
      },
      saved: false,
    }));
  },

  wrapInSection: (id) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page) return;
    const node = findNode(page.root, id);
    const parent = findParent(page.root, id);
    if (!node || !parent) return;
    const index = parent.children.findIndex((c) => c.id === id);
    const section = createNode("section", { children: [deepClone(node)] });
    section.children[0].id = node.id;
    get().commit("Wrap in section");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) => {
          if (p.id !== s.activePageId) return p;
          const without = removeNode(p.root, id);
          return { ...p, root: insertNode(without, parent.id, section, index) };
        }),
        updatedAt: Date.now(),
      },
      selectedId: section.id,
      saved: false,
    }));
  },

  commit: (label) =>
    set((s) => ({
      history: [...s.history.slice(-49), { ...snapshot(s), label }],
      future: [],
    })),

  undo: () =>
    set((s) => {
      const prev = s.history[s.history.length - 1];
      if (!prev) return s;
      return {
        project: { ...s.project, pages: deepClone(prev.pages) },
        activePageId: prev.activePageId,
        history: s.history.slice(0, -1),
        future: [{ ...snapshot(s), label: prev.label }, ...s.future].slice(0, 50),
        selectedId: null,
        saved: false,
      };
    }),

  redo: () =>
    set((s) => {
      const next = s.future[0];
      if (!next) return s;
      return {
        project: { ...s.project, pages: deepClone(next.pages) },
        activePageId: next.activePageId,
        history: [...s.history, { ...snapshot(s), label: next.label }],
        future: s.future.slice(1),
        selectedId: null,
        saved: false,
      };
    }),

  addAsset: (asset) => {
    const item: AssetItem = { ...asset, id: uid("a"), createdAt: Date.now() };
    set((s) => ({
      project: { ...s.project, assets: [item, ...s.project.assets], updatedAt: Date.now() },
      saved: false,
    }));
    return item;
  },

  deleteAsset: (id) =>
    set((s) => ({
      project: { ...s.project, assets: s.project.assets.filter((a) => a.id !== id) },
      saved: false,
    })),

  setAiSettings: (patch) => {
    const next = { ...get().aiSettings, ...patch };
    set({ aiSettings: next });
    if (typeof window !== "undefined") {
      localStorage.setItem(AI_KEY, JSON.stringify(next));
    }
  },

  pushAiMessage: (msg) =>
    set((s) => ({
      aiMessages: [
        ...s.aiMessages,
        { ...msg, id: uid("m"), createdAt: Date.now() },
      ].slice(-60),
    })),

  setAiBusy: (busy) => set({ aiBusy: busy }),
  clearAiMessages: () => set({ aiMessages: [] }),

  applyAiNodes: (nodes, mode) => {
    const state = get();
    const page = state.project.pages.find((p) => p.id === state.activePageId);
    if (!page) return;
    get().commit("AI edit");
    set((s) => ({
      project: {
        ...s.project,
        pages: s.project.pages.map((p) => {
          if (p.id !== s.activePageId) return p;
          if (mode === "replace") {
            return { ...p, root: { ...p.root, children: nodes } };
          }
          let root = p.root;
          let index = root.children.length;
          for (const n of nodes) {
            root = insertNode(root, root.id, n, index);
            index += 1;
          }
          return { ...p, root };
        }),
        updatedAt: Date.now(),
      },
      selectedId: nodes[0]?.id ?? null,
      saved: false,
    }));
  },

  save: () => {
    const { project } = get();
    if (typeof window === "undefined") return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(project));
    set({ saved: true });
  },

  hydrate: () => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const aiRaw = localStorage.getItem(AI_KEY);
      if (aiRaw) {
        const ai = JSON.parse(aiRaw) as AiSettings;
        set({ aiSettings: { ...get().aiSettings, ...ai } });
      }
      if (raw) {
        const project = JSON.parse(raw) as Project;
        if (project?.pages?.length) {
          set({
            project,
            activePageId: project.pages[0].id,
            history: [],
            future: [],
            saved: true,
          });
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
  },
}));