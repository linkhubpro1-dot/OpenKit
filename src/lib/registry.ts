import type { DesignNode, ElementKind, NodeContent, StyleModel } from "@/lib/types";
import { uid } from "@/lib/utils";

export interface FieldDef {
  key: string;
  label: string;
  type: "text" | "textarea" | "number" | "color" | "select" | "url" | "items";
  options?: { value: string; label: string }[];
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  target?: "content" | "data";
}

export type StyleSection =
  | "layout"
  | "spacing"
  | "appearance"
  | "typography"
  | "position"
  | "effects";

export interface ComponentDef {
  kind: ElementKind;
  label: string;
  icon: string;
  group: "Layout" | "Basic" | "Media" | "Forms" | "Blocks" | "Advanced";
  description: string;
  container: boolean;
  defaultStyle: StyleModel;
  defaultContent: NodeContent;
  defaultChildren?: () => DesignNode[];
  fields: FieldDef[];
  styleSections: StyleSection[];
}

function n(
  kind: ElementKind,
  name: string,
  content: NodeContent,
  style: StyleModel,
  children: DesignNode[] = []
): DesignNode {
  return { id: uid(), kind, name, content, style, children };
}

const ALL_STYLE: StyleSection[] = [
  "layout",
  "spacing",
  "typography",
  "appearance",
  "effects",
  "position",
];

export const COMPONENTS: ComponentDef[] = [
  /* ------------------------------- Layout ------------------------------- */
  {
    kind: "section",
    label: "Section",
    icon: "▭",
    group: "Layout",
    description: "Full width vertical block. The main page building unit.",
    container: true,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 16,
      padding: { top: 72, right: 32, bottom: 72, left: 32 },
      width: "100%",
      alignItems: "stretch",
    },
    defaultContent: {},
    defaultChildren: () => [
      n("heading", "Heading", { text: "New section" }, { fontSize: 34, fontWeight: 700 }),
    ],
    fields: [],
    styleSections: ALL_STYLE,
  },
  {
    kind: "container",
    label: "Container",
    icon: "▢",
    group: "Layout",
    description: "Generic wrapper for grouping elements.",
    container: true,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: { top: 16, right: 16, bottom: 16, left: 16 },
      width: "100%",
    },
    defaultContent: {},
    defaultChildren: () => [],
    fields: [],
    styleSections: ALL_STYLE,
  },

  /* -------------------------------- Basic ------------------------------- */
  {
    kind: "heading",
    label: "Heading",
    icon: "H",
    group: "Basic",
    description: "Title text with size and weight controls.",
    container: false,
    defaultStyle: {
      fontSize: 32,
      fontWeight: 700,
      lineHeight: 1.2,
      color: "#0f172a",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    defaultContent: { text: "Your headline goes here" },
    fields: [
      { key: "text", label: "Text", type: "textarea" },
      { key: "href", label: "Link (optional)", type: "text" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "text",
    label: "Text",
    icon: "¶",
    group: "Basic",
    description: "Paragraph of body copy.",
    container: false,
    defaultStyle: {
      fontSize: 16,
      lineHeight: 1.6,
      color: "#475569",
      margin: { top: 0, right: 0, bottom: 0, left: 0 },
    },
    defaultContent: {
      text: "Write something meaningful here. Select this element to edit the copy.",
    },
    fields: [{ key: "text", label: "Text", type: "textarea" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "button",
    label: "Button",
    icon: "⬭",
    group: "Basic",
    description: "Call to action button with link support.",
    container: false,
    defaultStyle: {
      display: "inline-flex",
      alignItems: "center",
      justifyContent: "center",
      padding: { top: 12, right: 22, bottom: 12, left: 22 },
      radius: 10,
      background: "#4f46e5",
      color: "#ffffff",
      fontSize: 15,
      fontWeight: 600,
      width: "auto",
    },
    defaultContent: { text: "Get started", href: "#" },
    fields: [
      { key: "text", label: "Label", type: "text" },
      { key: "href", label: "Link", type: "text" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "divider",
    label: "Divider",
    icon: "―",
    group: "Basic",
    description: "Horizontal rule to separate content.",
    container: false,
    defaultStyle: {
      width: "100%",
      height: "1px",
      background: "#e2e8f0",
      margin: { top: 8, right: 0, bottom: 8, left: 0 },
    },
    defaultContent: {},
    fields: [],
    styleSections: ["appearance", "spacing", "position"],
  },
  {
    kind: "spacer",
    label: "Spacer",
    icon: "↕",
    group: "Basic",
    description: "Empty vertical space.",
    container: false,
    defaultStyle: { width: "100%", height: "48px" },
    defaultContent: {},
    fields: [],
    styleSections: ["layout", "spacing", "position"],
  },
  {
    kind: "list",
    label: "List",
    icon: "≡",
    group: "Basic",
    description: "Bulleted list of items.",
    container: false,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 8,
      fontSize: 16,
      color: "#334155",
    },
    defaultContent: { items: ["First point", "Second point", "Third point"] },
    fields: [{ key: "items", label: "Items (one per line)", type: "items" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "badge",
    label: "Badge",
    icon: "◆",
    group: "Basic",
    description: "Small pill label.",
    container: false,
    defaultStyle: {
      display: "inline-flex",
      padding: { top: 5, right: 12, bottom: 5, left: 12 },
      radius: 999,
      background: "#eef2ff",
      color: "#4338ca",
      fontSize: 12,
      fontWeight: 600,
      width: "auto",
    },
    defaultContent: { text: "New" },
    fields: [{ key: "text", label: "Label", type: "text" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "icon",
    label: "Icon",
    icon: "★",
    group: "Basic",
    description: "Emoji or glyph used as an icon.",
    container: false,
    defaultStyle: { fontSize: 32, width: "auto" },
    defaultContent: { text: "🚀" },
    fields: [{ key: "text", label: "Glyph / emoji", type: "text" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "avatar",
    label: "Avatar",
    icon: "◉",
    group: "Basic",
    description: "Round profile image.",
    container: false,
    defaultStyle: {
      width: "64px",
      height: "64px",
      radius: 999,
      background: "#e2e8f0",
      backgroundImage: "",
      backgroundSize: "cover",
    },
    defaultContent: { src: "", alt: "Avatar" },
    fields: [
      { key: "src", label: "Image URL", type: "url" },
      { key: "alt", label: "Alt text", type: "text" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "progress",
    label: "Progress",
    icon: "▰",
    group: "Basic",
    description: "Progress bar with a percentage.",
    container: false,
    defaultStyle: { width: "100%", height: "10px", radius: 999, background: "#e2e8f0" },
    defaultContent: { data: { value: 65, bar: "#4f46e5" } },
    fields: [
      { key: "value", label: "Value %", type: "number", min: 0, max: 100, target: "data" },
      { key: "bar", label: "Bar color", type: "color", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },

  /* -------------------------------- Media ------------------------------- */
  {
    kind: "image",
    label: "Image",
    icon: "▣",
    group: "Media",
    description: "Image from URL or your asset library.",
    container: false,
    defaultStyle: {
      width: "100%",
      height: "auto",
      radius: 12,
      background: "#f1f5f9",
      aspectRatio: "16 / 9",
    },
    defaultContent: {
      src: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
      alt: "Placeholder image",
    },
    fields: [
      { key: "src", label: "Image URL", type: "url" },
      { key: "alt", label: "Alt text", type: "text" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "video",
    label: "Video",
    icon: "▶",
    group: "Media",
    description: "MP4 or WebM video player.",
    container: false,
    defaultStyle: { width: "100%", aspectRatio: "16 / 9", radius: 12 },
    defaultContent: {
      src: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerJoyrides.mp4",
    },
    fields: [{ key: "src", label: "Video URL", type: "url" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "audio",
    label: "Audio",
    icon: "♪",
    group: "Media",
    description: "Audio player for music or voice notes.",
    container: false,
    defaultStyle: { width: "100%" },
    defaultContent: { src: "" },
    fields: [{ key: "src", label: "Audio URL", type: "url" }],
    styleSections: ["layout", "spacing", "position"],
  },
  {
    kind: "gallery",
    label: "Gallery",
    icon: "❏",
    group: "Media",
    description: "Image grid gallery.",
    container: false,
    defaultStyle: { display: "grid", columns: 3, gap: 12, width: "100%" },
    defaultContent: {
      items: [
        "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800&q=80",
        "https://images.unsplash.com/photo-1470770841072-f978cf4d019e?w=800&q=80",
        "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&q=80",
      ],
    },
    fields: [{ key: "items", label: "Image URLs (one per line)", type: "items" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "embed",
    label: "Embed",
    icon: "◫",
    group: "Media",
    description: "Embed a YouTube video or other iframe content.",
    container: false,
    defaultStyle: { width: "100%", aspectRatio: "16 / 9", radius: 12 },
    defaultContent: { src: "https://www.youtube.com/embed/aqz-KE-bpKQ" },
    fields: [{ key: "src", label: "Embed URL", type: "url" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "map",
    label: "Map",
    icon: "◎",
    group: "Media",
    description: "OpenStreetMap embed for a location.",
    container: false,
    defaultStyle: { width: "100%", height: "320px", radius: 12 },
    defaultContent: { data: { lat: 24.8607, lng: 67.0011, label: "Karachi" } },
    fields: [
      { key: "lat", label: "Latitude", type: "number", step: 0.0001, target: "data" },
      { key: "lng", label: "Longitude", type: "number", step: 0.0001, target: "data" },
      { key: "label", label: "Label", type: "text", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },

  /* -------------------------------- Forms ------------------------------- */
  {
    kind: "form",
    label: "Form",
    icon: "▤",
    group: "Forms",
    description: "Contact or signup form container.",
    container: true,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: { top: 24, right: 24, bottom: 24, left: 24 },
      radius: 14,
      background: "#ffffff",
      width: "100%",
      maxWidth: "480px",
    },
    defaultContent: { data: { action: "", method: "post" } },
    defaultChildren: () => [
      n("input", "Name field", { placeholder: "Your name" }, { width: "100%" }),
      n("input", "Email field", { placeholder: "you@email.com" }, { width: "100%" }),
      n("textarea", "Message", { placeholder: "Message" }, { width: "100%" }),
      n(
        "button",
        "Submit",
        { text: "Send" },
        {
          background: "#4f46e5",
          color: "#ffffff",
          radius: 10,
          padding: { top: 12, right: 20, bottom: 12, left: 20 },
          width: "100%",
        }
      ),
    ],
    fields: [
      { key: "action", label: "Action URL", type: "text", target: "data" },
      {
        key: "method",
        label: "Method",
        type: "select",
        target: "data",
        options: [
          { value: "post", label: "POST" },
          { value: "get", label: "GET" },
        ],
      },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "input",
    label: "Input",
    icon: "⌶",
    group: "Forms",
    description: "Single line text input.",
    container: false,
    defaultStyle: {
      width: "100%",
      padding: { top: 11, right: 14, bottom: 11, left: 14 },
      radius: 10,
      borderWidth: 1,
      borderColor: "#d7dce5",
      borderStyle: "solid",
      fontSize: 15,
      background: "#ffffff",
      color: "#0f172a",
    },
    defaultContent: { placeholder: "Type here…" },
    fields: [{ key: "placeholder", label: "Placeholder", type: "text" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "textarea",
    label: "Textarea",
    icon: "▬",
    group: "Forms",
    description: "Multi line text input.",
    container: false,
    defaultStyle: {
      width: "100%",
      height: "120px",
      padding: { top: 11, right: 14, bottom: 11, left: 14 },
      radius: 10,
      borderWidth: 1,
      borderColor: "#d7dce5",
      borderStyle: "solid",
      fontSize: 15,
      background: "#ffffff",
    },
    defaultContent: { placeholder: "Longer text…" },
    fields: [{ key: "placeholder", label: "Placeholder", type: "text" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "select",
    label: "Select",
    icon: "⌄",
    group: "Forms",
    description: "Dropdown select.",
    container: false,
    defaultStyle: {
      width: "100%",
      padding: { top: 11, right: 14, bottom: 11, left: 14 },
      radius: 10,
      borderWidth: 1,
      borderColor: "#d7dce5",
      borderStyle: "solid",
      background: "#ffffff",
      fontSize: 15,
    },
    defaultContent: { items: ["Option one", "Option two", "Option three"] },
    fields: [{ key: "items", label: "Options (one per line)", type: "items" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "checkbox",
    label: "Checkbox",
    icon: "☑",
    group: "Forms",
    description: "Checkbox with a label.",
    container: false,
    defaultStyle: {
      display: "inline-flex",
      alignItems: "center",
      gap: 8,
      fontSize: 15,
      color: "#334155",
      width: "auto",
    },
    defaultContent: { text: "I agree to the terms" },
    fields: [{ key: "text", label: "Label", type: "text" }],
    styleSections: ALL_STYLE,
  },

  /* ------------------------------- Blocks ------------------------------- */
  {
    kind: "navbar",
    label: "Navbar",
    icon: "☰",
    group: "Blocks",
    description: "Top navigation bar with logo and links.",
    container: false,
    defaultStyle: {
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: { top: 16, right: 32, bottom: 16, left: 32 },
      width: "100%",
      background: "#ffffff",
      borderWidth: 0,
      borderColor: "#eef1f6",
      borderStyle: "solid",
    },
    defaultContent: { text: "Brand", items: ["Home", "Features", "Pricing", "Contact"] },
    fields: [
      { key: "text", label: "Brand name", type: "text" },
      { key: "items", label: "Links (one per line)", type: "items" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "hero",
    label: "Hero",
    icon: "☆",
    group: "Blocks",
    description: "Landing hero with headline, copy and CTA.",
    container: false,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 18,
      padding: { top: 96, right: 32, bottom: 96, left: 32 },
      width: "100%",
      background: "linear-gradient(180deg,#f8fafc 0%,#eef2ff 100%)",
      textAlign: "center",
    },
    defaultContent: {
      text: "Build ideas at the speed of thought",
      data: {
        sub: "Describe what you want, drop in your media, and ship a real website or app — no code required.",
        cta: "Start building",
      },
    },
    fields: [
      { key: "text", label: "Headline", type: "textarea" },
      { key: "sub", label: "Sub headline", type: "textarea", target: "data" },
      { key: "cta", label: "Button label", type: "text", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "card",
    label: "Card",
    icon: "▭",
    group: "Blocks",
    description: "Single content card with image, title and text.",
    container: false,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      padding: { top: 20, right: 20, bottom: 20, left: 20 },
      radius: 16,
      background: "#ffffff",
      borderWidth: 1,
      borderColor: "#eef1f6",
      borderStyle: "solid",
      width: "100%",
      maxWidth: "340px",
      shadow: "0 12px 30px -18px rgba(15,23,42,0.35)",
    },
    defaultContent: {
      text: "Card title",
      src: "https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=800&q=80",
      data: { body: "Short supporting copy that explains the value of this card." },
    },
    fields: [
      { key: "text", label: "Title", type: "text" },
      { key: "body", label: "Body", type: "textarea", target: "data" },
      { key: "src", label: "Image URL", type: "url" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "cards",
    label: "Card grid",
    icon: "❏",
    group: "Blocks",
    description: "Responsive grid of cards.",
    container: false,
    defaultStyle: {
      display: "grid",
      columns: 3,
      gap: 20,
      width: "100%",
      padding: { top: 48, right: 32, bottom: 48, left: 32 },
    },
    defaultContent: {
      items: ["Design", "Build", "Ship"],
      data: { body: "Everything you need to go from an idea to a live product." },
    },
    fields: [
      { key: "items", label: "Card titles (one per line)", type: "items" },
      { key: "body", label: "Card body", type: "textarea", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "features",
    label: "Features",
    icon: "⁙",
    group: "Blocks",
    description: "Column feature list with icons.",
    container: false,
    defaultStyle: {
      display: "grid",
      columns: 3,
      gap: 24,
      width: "100%",
      padding: { top: 56, right: 32, bottom: 56, left: 32 },
    },
    defaultContent: {
      items: ["Drag & drop", "AI assist", "One click deploy"],
      data: { icons: "🧩,🤖,🚀", body: "Everything is visual, everything is editable." },
    },
    fields: [
      { key: "items", label: "Feature titles (one per line)", type: "items" },
      { key: "icons", label: "Icons (comma separated)", type: "text", target: "data" },
      { key: "body", label: "Shared body", type: "textarea", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "testimonial",
    label: "Testimonial",
    icon: "❝",
    group: "Blocks",
    description: "Quote block with author.",
    container: false,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 12,
      padding: { top: 28, right: 28, bottom: 28, left: 28 },
      radius: 16,
      background: "#0f172a",
      color: "#e2e8f0",
      width: "100%",
      maxWidth: "560px",
    },
    defaultContent: {
      text: "“This replaced three tools for us. We ship landing pages in an afternoon.”",
      data: { author: "Ayesha Khan, Founder" },
    },
    fields: [
      { key: "text", label: "Quote", type: "textarea" },
      { key: "author", label: "Author", type: "text", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "pricing",
    label: "Pricing",
    icon: "◈",
    group: "Blocks",
    description: "Three tier pricing table.",
    container: false,
    defaultStyle: {
      display: "grid",
      columns: 3,
      gap: 20,
      width: "100%",
      padding: { top: 56, right: 32, bottom: 56, left: 32 },
    },
    defaultContent: {
      items: ["Starter", "Pro", "Studio"],
      data: { prices: "$0,$19,$49", note: "Billed monthly. Cancel anytime." },
    },
    fields: [
      { key: "items", label: "Plan names (one per line)", type: "items" },
      { key: "prices", label: "Prices (comma separated)", type: "text", target: "data" },
      { key: "note", label: "Footnote", type: "text", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "stats",
    label: "Stats",
    icon: "▥",
    group: "Blocks",
    description: "Row of key numbers.",
    container: false,
    defaultStyle: {
      display: "grid",
      columns: 3,
      gap: 20,
      width: "100%",
      padding: { top: 40, right: 32, bottom: 40, left: 32 },
      textAlign: "center",
    },
    defaultContent: {
      items: ["12k+", "99.9%", "4.9/5"],
      data: { labels: "Makers, Uptime, Rating" },
    },
    fields: [
      { key: "items", label: "Values (one per line)", type: "items" },
      { key: "labels", label: "Labels (comma separated)", type: "text", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "faq",
    label: "FAQ",
    icon: "?",
    group: "Blocks",
    description: "Question and answer list.",
    container: false,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      gap: 10,
      width: "100%",
      padding: { top: 48, right: 32, bottom: 48, left: 32 },
    },
    defaultContent: {
      items: [
        "Do I need to know how to code?",
        "Can I export the source?",
        "Where can I deploy?",
      ],
      data: {
        answers:
          "No, everything is visual.|Yes, download React or plain HTML.|Vercel, Firebase, or any static host.",
      },
    },
    fields: [
      { key: "items", label: "Questions (one per line)", type: "items" },
      { key: "answers", label: "Answers (separate with |)", type: "textarea", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "footer",
    label: "Footer",
    icon: "▁",
    group: "Blocks",
    description: "Site footer with links and copyright.",
    container: false,
    defaultStyle: {
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      gap: 10,
      padding: { top: 40, right: 32, bottom: 40, left: 32 },
      width: "100%",
      background: "#0f172a",
      color: "#94a3b8",
      textAlign: "center",
    },
    defaultContent: {
      text: "Brand",
      items: ["Privacy", "Terms", "Twitter"],
      data: { note: "© 2026 Brand. All rights reserved." },
    },
    fields: [
      { key: "text", label: "Brand", type: "text" },
      { key: "items", label: "Links (one per line)", type: "items" },
      { key: "note", label: "Copyright", type: "text", target: "data" },
    ],
    styleSections: ALL_STYLE,
  },
  {
    kind: "table",
    label: "Table",
    icon: "▦",
    group: "Blocks",
    description: "Simple data table.",
    container: false,
    defaultStyle: { width: "100%", fontSize: 15 },
    defaultContent: {
      items: ["Name,Role,Location", "Ali,Designer,Lahore", "Sara,Dev,Karachi"],
    },
    fields: [{ key: "items", label: "Rows (comma separated)", type: "items" }],
    styleSections: ALL_STYLE,
  },

  /* ------------------------------ Advanced ------------------------------ */
  {
    kind: "shape",
    label: "Shape",
    icon: "●",
    group: "Advanced",
    description: "Decorative shape or blob.",
    container: false,
    defaultStyle: {
      width: "160px",
      height: "160px",
      radius: 40,
      background: "linear-gradient(135deg,#818cf8,#4f46e5)",
    },
    defaultContent: {},
    fields: [],
    styleSections: ALL_STYLE,
  },
  {
    kind: "code",
    label: "Code block",
    icon: "❯",
    group: "Advanced",
    description: "Monospaced code sample.",
    container: false,
    defaultStyle: {
      width: "100%",
      padding: { top: 16, right: 18, bottom: 16, left: 18 },
      radius: 12,
      background: "#0f172a",
      color: "#e2e8f0",
      fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      fontSize: 14,
    },
    defaultContent: { text: "npm run build" },
    fields: [{ key: "text", label: "Code", type: "textarea" }],
    styleSections: ALL_STYLE,
  },
  {
    kind: "html",
    label: "Custom HTML",
    icon: "⟨⟩",
    group: "Advanced",
    description: "Raw HTML for advanced use cases.",
    container: false,
    defaultStyle: { width: "100%" },
    defaultContent: { html: "<div>Custom HTML</div>" },
    fields: [{ key: "html", label: "HTML", type: "textarea" }],
    styleSections: ["layout", "spacing", "position"],
  },
  {
    kind: "screenshot",
    label: "Screenshot",
    icon: "◱",
    group: "Advanced",
    description: "Uploaded screenshot with background removed.",
    container: false,
    defaultStyle: { width: "100%", height: "auto", radius: 12, background: "transparent" },
    defaultContent: { src: "", alt: "Screenshot" },
    fields: [
      { key: "src", label: "Image", type: "url" },
      { key: "alt", label: "Alt text", type: "text" },
    ],
    styleSections: ALL_STYLE,
  },
];

export const COMPONENT_MAP: Record<ElementKind, ComponentDef> = COMPONENTS.reduce(
  (acc, def) => {
    acc[def.kind] = def;
    return acc;
  },
  {} as Record<ElementKind, ComponentDef>
);

export const GROUPS = ["Layout", "Basic", "Media", "Forms", "Blocks", "Advanced"] as const;

function cloneStyle(style: StyleModel): StyleModel {
  return JSON.parse(JSON.stringify(style)) as StyleModel;
}

function cloneContent(content: NodeContent): NodeContent {
  return JSON.parse(JSON.stringify(content)) as NodeContent;
}

export function createNode(kind: ElementKind, overrides?: Partial<DesignNode>): DesignNode {
  const def = COMPONENT_MAP[kind];
  const node: DesignNode = {
    id: uid(),
    kind,
    name: def.label,
    content: cloneContent(def.defaultContent),
    style: cloneStyle(def.defaultStyle),
    children: def.defaultChildren ? def.defaultChildren() : [],
  };
  return { ...node, ...overrides };
}

export function isContainerKind(kind: ElementKind) {
  return COMPONENT_MAP[kind]?.container ?? false;
}