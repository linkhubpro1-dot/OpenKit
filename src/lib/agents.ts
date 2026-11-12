import type { DesignNode, Page, Project } from "@/lib/types";
import { flatten } from "@/lib/tree";

export type AgentId =
  | "project-starter"
  | "layout-engineer"
  | "copilot"
  | "security"
  | "deploy"
  | "realism";

export interface AgentDef {
  id: AgentId;
  name: string;
  icon: string;
  tagline: string;
  description: string;
  /** system prompt used when chatting with this agent */
  systemPrompt: string;
  /** quick one-shot actions shown as buttons */
  quickActions: { label: string; prompt: string }[];
  /** accent color for the UI */
  accent: string;
}

const NODE_SCHEMA = `DesignNode shape:
{
  "id": "unique string",
  "kind": one of: section, container, heading, text, button, image, video, audio, input, textarea, select, checkbox, form, navbar, hero, card, cards, features, testimonial, pricing, stats, faq, footer, divider, spacer, shape, badge, icon, list, table, code, html,
  "name": "short label",
  "content": { "text"?: string, "src"?: string, "href"?: string, "placeholder"?: string, "items"?: string[], "data"?: object },
  "style": { "display"?: "flex"|"grid"|"block", "flexDirection"?: "row"|"column", "gap"?: number, "padding"?: {"top":number,"right":number,"bottom":number,"left":number}, "background"?: string, "color"?: string, "fontSize"?: number, "fontWeight"?: number, "radius"?: number, "width"?: string, "maxWidth"?: string, "textAlign"?: "left"|"center"|"right", "columns"?: number },
  "children": []
}`;

export const AGENTS: AgentDef[] = [
  {
    id: "project-starter",
    name: "Project Starter",
    icon: "🚀",
    tagline: "New project, done right",
    description:
      "Activates when you want to start something new. Asks the right questions (business, audience, style, pages) and generates a complete, real starter project — not a blank canvas.",
    accent: "#22d3ee",
    systemPrompt: `You are the OpenKil Project Starter agent. Your job: turn a vague idea into a complete, real website/app project.

When the user describes what they want, output ONLY valid JSON (no markdown fences):
{
  "reply": "short message describing what you built and what to do next",
  "mode": "replace",
  "nodes": [ <DesignNode>, ... ]
}

${NODE_SCHEMA}

Rules:
- ALWAYS generate a full page: navbar + hero + at least 3 content sections + footer. Never output a single section unless explicitly asked.
- Use realistic, specific copy for the user's actual business — never lorem ipsum, never "Your Company".
- Pick a coherent color palette and apply it via style.background / style.color on sections.
- Use Unsplash image URLs (https://images.unsplash.com/photo-...?w=1200&q=80) that match the business.
- If the user's request is too vague, ask ONE clarifying question in "reply" and set "nodes": [].
- mode is always "replace" for a new project.`,
    quickActions: [
      { label: "Coffee shop site", prompt: "Create a complete website for a specialty coffee shop in Karachi called 'Bean & Co' — menu, story, location, contact." },
      { label: "SaaS landing", prompt: "Create a complete SaaS landing page for an AI meeting-notes tool called 'Notely' — hero, features, pricing, FAQ, footer." },
      { label: "Portfolio", prompt: "Create a complete portfolio site for a freelance photographer named Sara — hero, gallery, about, contact." },
      { label: "Restaurant", prompt: "Create a complete restaurant website for 'Zaiqa' — desi cuisine, menu highlights, reservations, location." },
    ],
  },
  {
    id: "layout-engineer",
    name: "Layout Engineer",
    icon: "🧩",
    tagline: "Drag, drop, layers — perfected",
    description:
      "Analyzes your page structure and fixes layout problems: broken grids, inconsistent spacing, misaligned elements, messy layer order. Can rebuild sections cleanly.",
    accent: "#a78bfa",
    systemPrompt: `You are the OpenKil Layout Engineer agent. You fix structure and layout.

Output ONLY valid JSON (no markdown fences):
{
  "reply": "what you fixed and why",
  "mode": "append" | "replace",
  "nodes": [ <DesignNode>, ... ]
}

${NODE_SCHEMA}

Rules:
- If the user asks to fix/improve the current page, return the IMPROVED full set of top-level nodes with mode "replace".
- Fix: inconsistent padding (use 64-96px vertical for sections), misaligned grids, missing max-width on text blocks, poor contrast.
- Keep the user's content and intent — improve structure, don't rewrite their copy unless asked.
- If asked a question, answer in "reply" with "nodes": [].`,
    quickActions: [
      { label: "Fix my layout", prompt: "Analyze the current page and fix all layout issues: spacing, alignment, grid consistency, max-widths. Return the improved page." },
      { label: "Make it responsive", prompt: "Review the current page for mobile/tablet issues and return an improved version with better responsive structure." },
      { label: "Clean up layers", prompt: "Reorganize the current page into a clean, logical section order: nav → hero → content → social proof → CTA → footer." },
    ],
  },
  {
    id: "copilot",
    name: "AI Copilot",
    icon: "🤖",
    tagline: "Remembers everything you say",
    description:
      "Your always-on pair programmer. Remembers the whole conversation and your project context, so you can say 'make it darker' or 'add pricing like before' and it just works.",
    accent: "#6366f1",
    systemPrompt: `You are the OpenKil AI Copilot — the user's always-on builder assistant with full memory of this conversation and the current project.

Output ONLY valid JSON (no markdown fences):
{
  "reply": "short human message",
  "mode": "append" | "replace",
  "nodes": [ <DesignNode>, ... ]
}

${NODE_SCHEMA}

Rules:
- Use the conversation history and project context to resolve references like "it", "that section", "like before".
- Prefer "append" for additions, "replace" only when rebuilding.
- Realistic copy always. Unsplash images. No lorem ipsum.
- If the user asks a question or for advice, set "nodes": [] and answer in "reply".`,
    quickActions: [
      { label: "What can you do?", prompt: "What can you help me with on this project? Give me 5 concrete suggestions based on the current page." },
      { label: "Improve copy", prompt: "Rewrite all the copy on the current page to be more compelling and specific. Keep the structure." },
      { label: "Add social proof", prompt: "Add a testimonials section and a stats bar to the current page." },
    ],
  },
  {
    id: "security",
    name: "Security Auditor",
    icon: "🛡️",
    tagline: "Finds bugs before your users do",
    description:
      "Scans your project for real issues: XSS in custom HTML, missing alt text, empty links, broken images, accessibility gaps, insecure patterns. Reports with severity and fixes them.",
    accent: "#f87171",
    systemPrompt: `You are the OpenKil Security Auditor agent. You review the project's node tree for security, accessibility and quality issues.

Output ONLY valid JSON (no markdown fences):
{
  "reply": "audit summary with findings and fixes applied",
  "mode": "append" | "replace",
  "nodes": [ <DesignNode>, ... ]
}

${NODE_SCHEMA}

Rules:
- If given scan results, explain each finding in plain language, ranked by severity (critical → low).
- If asked to fix, return the corrected nodes with mode "replace" (full page) or "append" (only if adding something).
- Fix: missing alt text, empty hrefs, javascript: URLs, unescaped custom HTML, missing form labels, poor contrast.
- Never invent issues that aren't in the scan data. If the scan is clean, say so.`,
    quickActions: [
      { label: "Run full audit", prompt: "Run a full security and accessibility audit on the current page. List every finding with severity, then fix them all and return the corrected page." },
      { label: "Fix critical only", prompt: "Fix only the critical and high severity issues from the audit. Return the corrected page." },
      { label: "Accessibility pass", prompt: "Do an accessibility pass: alt text, labels, contrast, heading order, keyboard focus. Fix everything and return the corrected page." },
    ],
  },
  {
    id: "deploy",
    name: "Deploy Helper",
    icon: "🚢",
    tagline: "From editor to live URL",
    description:
      "Knows which page you're on and what's missing before deploy. Checks export readiness, generates Vercel/Firebase configs, and walks you through shipping — step by step.",
    accent: "#34d399",
    systemPrompt: `You are the OpenKil Deploy Helper agent. You get the user's project live.

Output ONLY valid JSON (no markdown fences):
{
  "reply": "clear step-by-step guidance or answers",
  "mode": "append",
  "nodes": []
}

Rules:
- You do NOT generate page nodes — you give deployment guidance. Always "nodes": [].
- Be specific: exact commands, exact file names, exact URLs.
- Cover: static HTML export, React/Next.js export, Vercel (import repo or CLI), Firebase Hosting (firebase.json, .firebaserc, firebase deploy), custom domains, environment variables.
- If the user is on a specific page, tailor advice to that page (e.g. multi-page sites need rewrites).
- Warn about common mistakes: forgetting to build, wrong public dir, SPA rewrites, missing 404.html.`,
    quickActions: [
      { label: "Deploy to Vercel", prompt: "Walk me through deploying this exact project to Vercel, step by step, with the exact commands." },
      { label: "Deploy to Firebase", prompt: "Walk me through deploying this exact project to Firebase Hosting, step by step, with the exact commands." },
      { label: "Pre-flight check", prompt: "Do a pre-flight check of this project for deployment. What's missing or broken before I ship?" },
      { label: "Custom domain", prompt: "How do I connect a custom domain to my deployed site? Cover both Vercel and Firebase." },
    ],
  },
  {
    id: "realism",
    name: "Realism Checker",
    icon: "✨",
    tagline: "Makes it look human-made",
    description:
      "Detects the 'AI prototype' smell: lorem ipsum, generic copy, placeholder images, inconsistent spacing, dead buttons. Rewrites and restyles until it looks like a real, working product.",
    accent: "#fbbf24",
    systemPrompt: `You are the OpenKil Realism Checker agent. You make AI-generated pages look like real, human-designed, production websites.

Output ONLY valid JSON (no markdown fences):
{
  "reply": "what you changed to make it real",
  "mode": "append" | "replace",
  "nodes": [ <DesignNode>, ... ]
}

${NODE_SCHEMA}

Rules:
- Hunt for: lorem ipsum, "Your Company", "Lorem", placeholder text, generic Unsplash mismatches, dead "#" links, inconsistent spacing, missing hover states, empty sections.
- Replace generic copy with specific, believable copy for the user's actual business.
- Ensure every button has a real-looking label and every link has a plausible href.
- Ensure images match the business context.
- Return the full improved page with mode "replace".
- If asked a question, answer in "reply" with "nodes": [].`,
    quickActions: [
      { label: "Make it real", prompt: "Scan the current page for everything that looks AI-generated or like a prototype. Fix all of it and return the improved page." },
      { label: "Fix placeholder copy", prompt: "Find and replace all placeholder/generic copy with specific, believable copy for this business. Return the improved page." },
      { label: "Polish pass", prompt: "Do a final polish pass: spacing rhythm, type scale, color consistency, button hierarchy. Return the improved page." },
    ],
  },
];

export const AGENT_MAP: Record<AgentId, AgentDef> = AGENTS.reduce(
  (acc, a) => {
    acc[a.id] = a;
    return acc;
  },
  {} as Record<AgentId, AgentDef>
);

/* ------------------------------------------------------------------ */
/* Real static security/quality scanner — runs client-side, no AI      */
/* ------------------------------------------------------------------ */

export type Severity = "critical" | "high" | "medium" | "low";

export interface ScanFinding {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  nodeId?: string;
  nodeName?: string;
  fix?: string;
}

const LOREM = /lorem ipsum|dolor sit amet|your company|your name|placeholder text|example\.com|test@test/i;
const JS_URL = /^\s*javascript:/i;
const DATA_URL_HTML = /^\s*data:text\/html/i;

export function scanProject(project: Project): ScanFinding[] {
  const findings: ScanFinding[] = [];
  let counter = 0;
  const add = (f: Omit<ScanFinding, "id">) => {
    counter += 1;
    findings.push({ ...f, id: `f${counter}` });
  };

  for (const page of project.pages) {
    const items = flatten(page.root);

    for (const { node } of items) {
      const c = node.content;
      const data = c.data ?? {};

      // 1. Custom HTML — potential XSS surface
      if (node.kind === "html" && c.html) {
        const html = c.html;
        if (/<script/i.test(html)) {
          add({
            severity: "critical",
            title: "Inline <script> in custom HTML",
            detail: `Node "${node.name}" on page "${page.name}" contains a <script> tag. This executes arbitrary JS and is an XSS risk if the content is ever user-supplied.`,
            nodeId: node.id,
            nodeName: node.name,
            fix: "Remove the <script> tag or move the logic into a vetted component.",
          });
        }
        if (/on\w+\s*=/i.test(html)) {
          add({
            severity: "high",
            title: "Inline event handler in custom HTML",
            detail: `Node "${node.name}" uses an inline handler (onclick/onerror/…). Inline handlers bypass CSP and are an XSS vector.`,
            nodeId: node.id,
            nodeName: node.name,
            fix: "Remove inline handlers; use addEventListener in a module instead.",
          });
        }
        if (/javascript:/i.test(html)) {
          add({
            severity: "high",
            title: "javascript: URL in custom HTML",
            detail: `Node "${node.name}" contains a javascript: URL.`,
            nodeId: node.id,
            nodeName: node.name,
            fix: "Replace with a real https: link or a button with a handler.",
          });
        }
      }

      // 2. javascript: / data:text/html hrefs
      if (c.href) {
        if (JS_URL.test(c.href)) {
          add({
            severity: "critical",
            title: "javascript: link",
            detail: `Node "${node.name}" links to a javascript: URL.`,
            nodeId: node.id,
            nodeName: node.name,
            fix: "Use a real URL or a button.",
          });
        } else if (DATA_URL_HTML.test(c.href)) {
          add({
            severity: "high",
            title: "data:text/html link",
            detail: `Node "${node.name}" links to a data:text/html URL — a known phishing/XSS vector.`,
            nodeId: node.id,
            nodeName: node.name,
            fix: "Remove the data: URL.",
          });
        } else if (c.href === "#" || c.href.trim() === "") {
          add({
            severity: "low",
            title: "Dead link (#)",
            detail: `Node "${node.name}" links to "#". Users clicking it go nowhere.`,
            nodeId: node.id,
            nodeName: node.name,
            fix: "Point it at a real section (e.g. #pricing) or a real URL.",
          });
        }
      }

      // 3. Images without alt text
      if ((node.kind === "image" || node.kind === "screenshot" || node.kind === "avatar") && !c.alt?.trim()) {
        add({
          severity: "medium",
          title: "Image missing alt text",
          detail: `Node "${node.name}" on page "${page.name}" has no alt attribute — screen readers can't describe it.`,
          nodeId: node.id,
          nodeName: node.name,
          fix: "Add a short, descriptive alt text.",
        });
      }

      // 4. Placeholder / lorem ipsum copy
      const textBlob = [c.text, c.placeholder, ...(c.items ?? []), String(data.sub ?? ""), String(data.body ?? "")]
        .filter(Boolean)
        .join(" ");
      if (LOREM.test(textBlob)) {
        add({
          severity: "medium",
          title: "Placeholder copy detected",
          detail: `Node "${node.name}" contains lorem ipsum or placeholder text.`,
          nodeId: node.id,
          nodeName: node.name,
          fix: "Replace with real, specific copy for the business.",
        });
      }

      // 5. Empty image src
      if ((node.kind === "image" || node.kind === "screenshot") && !c.src?.trim()) {
        add({
          severity: "low",
          title: "Empty image source",
          detail: `Node "${node.name}" has no image URL — it renders as a broken/empty box.`,
          nodeId: node.id,
          nodeName: node.name,
          fix: "Set an image URL or remove the node.",
        });
      }

      // 6. Form without action
      if (node.kind === "form" && !String(data.action ?? "").trim()) {
        add({
          severity: "low",
          title: "Form has no action URL",
          detail: `Form "${node.name}" submits nowhere — user input is lost.`,
          nodeId: node.id,
          nodeName: node.name,
          fix: "Set an action URL (e.g. Formspree, Basin, or your API endpoint).",
        });
      }

      // 7. iframe embeds — check for http (not https)
      if (node.kind === "embed" && c.src && /^http:\/\//i.test(c.src)) {
        add({
          severity: "medium",
          title: "Insecure embed (http://)",
          detail: `Embed "${node.name}" loads over plain HTTP — mixed content will be blocked or intercepted.`,
          nodeId: node.id,
          nodeName: node.name,
          fix: "Use the https:// version of the embed URL.",
        });
      }
    }

    // 8. Page-level checks
    const headings = items.filter((i) => i.node.kind === "heading");
    if (headings.length === 0 && page.root.children.length > 0) {
      add({
        severity: "low",
        title: "Page has no heading",
        detail: `Page "${page.name}" has no heading element — bad for SEO and screen readers.`,
        fix: "Add a clear H1/H2 heading.",
      });
    }
  }

  const order: Record<Severity, number> = { critical: 0, high: 1, medium: 2, low: 3 };
  return findings.sort((a, b) => order[a.severity] - order[b.severity]);
}

export function severityColor(s: Severity): string {
  switch (s) {
    case "critical":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "high":
      return "text-orange-400 bg-orange-500/10 border-orange-500/30";
    case "medium":
      return "text-yellow-400 bg-yellow-500/10 border-yellow-500/30";
    case "low":
      return "text-slate-400 bg-slate-500/10 border-slate-500/30";
  }
}
