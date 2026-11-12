"use client";

import React, { createContext, useContext } from "react";
import type { Breakpoint, DesignNode } from "@/lib/types";
import { styleToReactStyle } from "@/lib/tree";
import { COMPONENT_MAP } from "@/lib/registry";

interface RenderCtx {
  mode: "canvas" | "preview" | "export";
  breakpoint: Breakpoint;
  selectedId?: string | null;
  onSelect?: (id: string) => void;
  interactive?: boolean;
  /** canvas mode: render children through the interactive wrapper */
  childrenRenderer?: (node: DesignNode) => React.ReactNode;
}

const Ctx = createContext<RenderCtx>({ mode: "canvas", breakpoint: "desktop" });

export function RenderProvider({
  value,
  children,
}: {
  value: RenderCtx;
  children: React.ReactNode;
}) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useRender() {
  return useContext(Ctx);
}

function splitList(value?: string): string[] {
  if (!value) return [];
  return value
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function mergeStyle(node: DesignNode, breakpoint: Breakpoint) {
  const responsive = breakpoint === "desktop" ? {} : node.responsive?.[breakpoint] ?? {};
  return { ...node.style, ...responsive };
}

function gridStyle(style: ReturnType<typeof mergeStyle>): React.CSSProperties {
  const cols = style.columns ?? 3;
  return {
    display: "grid",
    gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
    gap: style.gap ?? 16,
  };
}

export function NodeView({ node }: { node: DesignNode }) {
  const ctx = useRender();
  const style = mergeStyle(node, ctx.breakpoint);
  const css = styleToReactStyle(style);
  const def = COMPONENT_MAP[node.kind];
  const c = node.content;
  const data = c.data ?? {};

  if (node.hidden && ctx.mode === "canvas") {
    return (
      <div
        style={{
          ...css,
          outline: "1px dashed #f87171",
          opacity: 0.4,
          minHeight: 24,
        }}
      >
        <span style={{ fontSize: 11, color: "#ef4444" }}>hidden: {node.name}</span>
      </div>
    );
  }
  if (node.hidden) return null;

  const common = { style: css, "data-node-id": node.id } as Record<string, unknown>;

  switch (node.kind) {
    case "section":
    case "container": {
      const renderChild = ctx.childrenRenderer;
      const rendered = renderChild
        ? node.children.map((child) => (
            <React.Fragment key={child.id}>{renderChild(child)}</React.Fragment>
          ))
        : node.children.map((child) => <NodeView key={child.id} node={child} />);
      return (
        <div {...common}>
          {rendered}
          {ctx.mode === "canvas" && node.children.length === 0 && !ctx.childrenRenderer ? (
            <div style={{ padding: 24, color: "#94a3b8", fontSize: 13, textAlign: "center" }}>
              Drop elements here
            </div>
          ) : null}
        </div>
      );
    }

    case "heading": {
      const Tag = "h2";
      const content = c.text || "Heading";
      if (c.href) {
        return (
          <a href={c.href} style={{ textDecoration: "none", color: "inherit" }}>
            <Tag {...common}>{content}</Tag>
          </a>
        );
      }
      return <Tag {...common}>{content}</Tag>;
    }

    case "text":
      return <p {...common}>{c.text}</p>;

    case "button":
      return (
        <a
          {...common}
          href={c.href || "#"}
          style={{ ...css, cursor: ctx.mode === "canvas" ? "inherit" : "pointer" }}
        >
          {c.text || "Button"}
        </a>
      );

    case "divider":
      return <hr {...common} style={{ ...css, border: "none" }} />;

    case "spacer":
      return <div {...common} />;

    case "list":
      return (
        <ul {...common} style={{ ...css, paddingLeft: 20, listStyle: "disc" }}>
          {(c.items ?? []).map((item, i) => (
            <li key={i}>{item}</li>
          ))}
        </ul>
      );

    case "badge":
      return <span {...common}>{c.text}</span>;

    case "icon":
      return <span {...common}>{c.text}</span>;

    case "avatar":
      return (
        <div
          {...common}
          style={{
            ...css,
            backgroundImage: c.src ? `url(${c.src})` : undefined,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
          aria-label={c.alt}
        />
      );

    case "progress": {
      const value = Math.max(0, Math.min(100, Number(data.value ?? 0)));
      return (
        <div {...common} style={{ ...css, overflow: "hidden" }}>
          <div
            style={{
              width: `${value}%`,
              height: "100%",
              background: String(data.bar ?? "#4f46e5"),
              borderRadius: "inherit",
            }}
          />
        </div>
      );
    }

    case "image":
      return c.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...common} src={c.src} alt={c.alt ?? ""} crossOrigin="anonymous" />
      ) : (
        <div
          {...common}
          style={{
            ...css,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          No image selected
        </div>
      );

    case "video":
      return (
        <video
          {...common}
          src={c.src}
          controls={ctx.mode !== "canvas"}
          playsInline
          style={css}
        />
      );

    case "audio":
      return c.src ? (
        <audio {...common} src={c.src} controls style={css} />
      ) : (
        <div {...common} style={{ ...css, color: "#94a3b8", fontSize: 13 }}>
          No audio selected
        </div>
      );

    case "gallery":
      return (
        <div {...common} style={{ ...css, ...gridStyle(style) }}>
          {(c.items ?? []).map((src, i) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              key={i}
              src={src}
              alt=""
              crossOrigin="anonymous"
              style={{ width: "100%", height: 140, objectFit: "cover", borderRadius: 10 }}
            />
          ))}
        </div>
      );

    case "embed":
      return (
        <iframe
          {...common}
          src={c.src}
          title="embed"
          allowFullScreen
          style={{ ...css, border: "none" }}
        />
      );

    case "map": {
      const lat = Number(data.lat ?? 24.8607);
      const lng = Number(data.lng ?? 67.0011);
      const src = `https://www.openstreetmap.org/export/embed.html?bbox=${
        lng - 0.05
      }%2C${lat - 0.03}%2C${lng + 0.05}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`;
      return <iframe {...common} src={src} title={String(data.label ?? "Map")} style={css} />;
    }

    case "form": {
      const renderChild = ctx.childrenRenderer;
      const rendered = renderChild
        ? node.children.map((child) => (
            <React.Fragment key={child.id}>{renderChild(child)}</React.Fragment>
          ))
        : node.children.map((child) => <NodeView key={child.id} node={child} />);
      return (
        <form {...common} action={String(data.action || "")} method={String(data.method || "post")}>
          {rendered}
        </form>
      );
    }

    case "input":
      return <input {...common} placeholder={c.placeholder} style={css} readOnly={ctx.mode === "canvas"} />;

    case "textarea":
      return (
        <textarea {...common} placeholder={c.placeholder} style={css} readOnly={ctx.mode === "canvas"} />
      );

    case "select":
      return (
        <select {...common} style={css} defaultValue="">
          <option value="" disabled>
            Choose…
          </option>
          {(c.items ?? []).map((opt, i) => (
            <option key={i} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "checkbox":
      return (
        <label {...common} style={css}>
          <input type="checkbox" /> {c.text}
        </label>
      );

    case "navbar":
      return (
        <nav {...common}>
          <span style={{ fontWeight: 700, fontSize: 18 }}>{c.text}</span>
          <div style={{ display: "flex", gap: 18, alignItems: "center" }}>
            {(c.items ?? []).map((item, i) => (
              <a key={i} href="#" style={{ color: "inherit", textDecoration: "none", fontSize: 15 }}>
                {item}
              </a>
            ))}
          </div>
        </nav>
      );

    case "hero":
      return (
        <section {...common}>
          <h1 style={{ fontSize: 52, fontWeight: 800, margin: 0, lineHeight: 1.1 }}>
            {c.text}
          </h1>
          <p style={{ fontSize: 18, opacity: 0.75, margin: 0, maxWidth: 620 }}>
            {String(data.sub ?? "")}
          </p>
          <a
            href="#"
            style={{
              display: "inline-flex",
              padding: "13px 26px",
              borderRadius: 10,
              background: "#4f46e5",
              color: "#fff",
              textDecoration: "none",
              fontWeight: 600,
            }}
          >
            {String(data.cta ?? "Get started")}
          </a>
        </section>
      );

    case "card":
      return (
        <article {...common}>
          {c.src ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={c.src}
              alt=""
              crossOrigin="anonymous"
              style={{ width: "100%", height: 150, objectFit: "cover", borderRadius: 10 }}
            />
          ) : null}
          <h3 style={{ margin: 0, fontSize: 19, fontWeight: 700 }}>{c.text}</h3>
          <p style={{ margin: 0, fontSize: 15, opacity: 0.75 }}>{String(data.body ?? "")}</p>
        </article>
      );

    case "cards":
      return (
        <div {...common} style={{ ...css, ...gridStyle(style) }}>
          {(c.items ?? []).map((title, i) => (
            <article
              key={i}
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 8,
                padding: 20,
                borderRadius: 14,
                background: "#ffffff",
                border: "1px solid #eef1f6",
                boxShadow: "0 12px 30px -22px rgba(15,23,42,0.4)",
              }}
            >
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>{String(data.body ?? "")}</p>
            </article>
          ))}
        </div>
      );

    case "features": {
      const icons = splitList(String(data.icons ?? ""));
      return (
        <div {...common} style={{ ...css, ...gridStyle(style) }}>
          {(c.items ?? []).map((title, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              <span style={{ fontSize: 30 }}>{icons[i] ?? "•"}</span>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>{title}</h3>
              <p style={{ margin: 0, fontSize: 14, opacity: 0.7 }}>{String(data.body ?? "")}</p>
            </div>
          ))}
        </div>
      );
    }

    case "testimonial":
      return (
        <blockquote {...common}>
          <p style={{ margin: 0, fontSize: 19, lineHeight: 1.5 }}>{c.text}</p>
          <footer style={{ fontSize: 14, opacity: 0.7 }}>— {String(data.author ?? "")}</footer>
        </blockquote>
      );

    case "pricing": {
      const prices = splitList(String(data.prices ?? ""));
      return (
        <div {...common}>
          <div style={{ ...gridStyle(style) }}>
            {(c.items ?? []).map((plan, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 10,
                  padding: 24,
                  borderRadius: 16,
                  background: i === 1 ? "#0f172a" : "#ffffff",
                  color: i === 1 ? "#e2e8f0" : "#0f172a",
                  border: "1px solid #eef1f6",
                }}
              >
                <span style={{ fontSize: 14, textTransform: "uppercase", letterSpacing: 1 }}>
                  {plan}
                </span>
                <strong style={{ fontSize: 34 }}>{prices[i] ?? "$0"}</strong>
                <span style={{ fontSize: 14, opacity: 0.7 }}>per month</span>
                <a
                  href="#"
                  style={{
                    marginTop: 8,
                    display: "inline-flex",
                    justifyContent: "center",
                    padding: "10px 16px",
                    borderRadius: 10,
                    background: i === 1 ? "#6366f1" : "#0f172a",
                    color: "#fff",
                    textDecoration: "none",
                    fontWeight: 600,
                    fontSize: 14,
                  }}
                >
                  Choose {plan}
                </a>
              </div>
            ))}
          </div>
          <p style={{ textAlign: "center", fontSize: 13, opacity: 0.6, marginTop: 16 }}>
            {String(data.note ?? "")}
          </p>
        </div>
      );
    }

    case "stats": {
      const labels = splitList(String(data.labels ?? ""));
      return (
        <div {...common} style={{ ...css, ...gridStyle(style) }}>
          {(c.items ?? []).map((value, i) => (
            <div key={i} style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              <strong style={{ fontSize: 34, fontWeight: 800 }}>{value}</strong>
              <span style={{ fontSize: 14, opacity: 0.65 }}>{labels[i] ?? ""}</span>
            </div>
          ))}
        </div>
      );
    }

    case "faq": {
      const answers = String(data.answers ?? "")
        .split("|")
        .map((s) => s.trim());
      return (
        <div {...common}>
          {(c.items ?? []).map((q, i) => (
            <details
              key={i}
              style={{
                padding: "14px 18px",
                borderRadius: 12,
                background: "#f8fafc",
                border: "1px solid #eef1f6",
              }}
            >
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>{q}</summary>
              <p style={{ margin: "10px 0 0", fontSize: 15, opacity: 0.75 }}>{answers[i] ?? ""}</p>
            </details>
          ))}
        </div>
      );
    }

    case "footer":
      return (
        <footer {...common}>
          <strong style={{ fontSize: 17 }}>{c.text}</strong>
          <div style={{ display: "flex", gap: 16 }}>
            {(c.items ?? []).map((item, i) => (
              <a key={i} href="#" style={{ color: "inherit", textDecoration: "none", fontSize: 14 }}>
                {item}
              </a>
            ))}
          </div>
          <span style={{ fontSize: 13, opacity: 0.7 }}>{String(data.note ?? "")}</span>
        </footer>
      );

    case "table": {
      const rows = (c.items ?? []).map((r) => r.split(",").map((s) => s.trim()));
      const [head, ...body] = rows;
      return (
        <table {...common} style={{ ...css, borderCollapse: "collapse" }}>
          <thead>
            <tr>
              {(head ?? []).map((h, i) => (
                <th
                  key={i}
                  style={{ textAlign: "left", padding: "10px 14px", borderBottom: "1px solid #e2e8f0" }}
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {body.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} style={{ padding: "10px 14px", borderBottom: "1px solid #f1f5f9" }}>
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    case "shape":
      return <div {...common} />;

    case "code":
      return (
        <pre {...common} style={{ ...css, overflow: "auto" }}>
          <code>{c.text}</code>
        </pre>
      );

    case "html":
      return (
        <div
          {...common}
          dangerouslySetInnerHTML={{ __html: c.html ?? "" }}
        />
      );

    case "screenshot":
      return c.src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img {...common} src={c.src} alt={c.alt ?? ""} crossOrigin="anonymous" />
      ) : (
        <div
          {...common}
          style={{
            ...css,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 120,
            border: "1px dashed #cbd5e1",
            color: "#94a3b8",
            fontSize: 13,
          }}
        >
          Drop a screenshot here
        </div>
      );

    default:
      return (
        <div {...common} data-unknown={def?.kind}>
          {node.name}
        </div>
      );
  }
}

export function PageView({ page }: { page: { root: DesignNode; background: string } }) {
  return (
    <div style={{ background: page.background, minHeight: "100%" }}>
      <NodeView node={page.root} />
    </div>
  );
}