export type ElementKind =
  | "section"
  | "container"
  | "heading"
  | "text"
  | "button"
  | "image"
  | "video"
  | "audio"
  | "input"
  | "textarea"
  | "select"
  | "checkbox"
  | "form"
  | "navbar"
  | "hero"
  | "card"
  | "cards"
  | "gallery"
  | "features"
  | "testimonial"
  | "pricing"
  | "stats"
  | "faq"
  | "footer"
  | "divider"
  | "spacer"
  | "shape"
  | "icon"
  | "badge"
  | "avatar"
  | "progress"
  | "embed"
  | "map"
  | "list"
  | "table"
  | "code"
  | "html"
  | "screenshot";

export type Breakpoint = "desktop" | "tablet" | "mobile";

export interface Spacing {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

export interface StyleModel {
  display?: "block" | "flex" | "grid" | "inline-flex" | "none";
  flexDirection?: "row" | "row-reverse" | "column" | "column-reverse";
  justifyContent?:
    | "flex-start"
    | "center"
    | "flex-end"
    | "space-between"
    | "space-around"
    | "space-evenly";
  alignItems?: "flex-start" | "center" | "flex-end" | "stretch" | "baseline";
  gap?: number;
  columns?: number;
  width?: string;
  height?: string;
  minHeight?: string;
  maxWidth?: string;
  aspectRatio?: string;
  overflow?: "visible" | "hidden" | "auto";

  padding?: Spacing;
  margin?: Spacing;

  background?: string;
  backgroundImage?: string;
  backgroundSize?: "cover" | "contain" | "auto";
  backgroundPosition?: string;
  color?: string;
  borderWidth?: number;
  borderColor?: string;
  borderStyle?: "none" | "solid" | "dashed" | "dotted";
  radius?: number;
  opacity?: number;
  shadow?: string;
  blur?: number;

  fontFamily?: string;
  fontSize?: number;
  fontWeight?: number;
  lineHeight?: number;
  letterSpacing?: number;
  textAlign?: "left" | "center" | "right" | "justify";
  textTransform?: "none" | "uppercase" | "lowercase" | "capitalize";
  textDecoration?: "none" | "underline" | "line-through";

  position?: "static" | "relative" | "absolute";
  top?: number;
  right?: number;
  bottom?: number;
  left?: number;
  zIndex?: number;
  rotate?: number;
}

export interface NodeContent {
  text?: string;
  html?: string;
  src?: string;
  alt?: string;
  href?: string;
  placeholder?: string;
  items?: string[];
  data?: Record<string, unknown>;
}

export interface DesignNode {
  id: string;
  kind: ElementKind;
  name: string;
  content: NodeContent;
  style: StyleModel;
  responsive?: Partial<Record<Breakpoint, StyleModel>>;
  children: DesignNode[];
  hidden?: boolean;
  locked?: boolean;
}

export interface Page {
  id: string;
  name: string;
  path: string;
  background: string;
  root: DesignNode;
}

export interface ProjectSettings {
  name: string;
  description: string;
  primary: string;
  accent: string;
  fontHeading: string;
  fontBody: string;
  radius: number;
  mode: "website" | "app";
}

export interface AssetItem {
  id: string;
  name: string;
  url: string;
  kind: "image" | "audio" | "video" | "font" | "other";
  size?: number;
  createdAt: number;
}

export interface Project {
  id: string;
  name: string;
  updatedAt: number;
  settings: ProjectSettings;
  pages: Page[];
  assets: AssetItem[];
}

export interface TemplateItem {
  id: string;
  name: string;
  category: string;
  description: string;
  accent: string;
  build: () => Page[];
}

export interface AiMessage {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  createdAt: number;
  nodeIds?: string[];
}

export interface AiSettings {
  apiKey: string;
  model: string;
  baseUrl: string;
  temperature: number;
}