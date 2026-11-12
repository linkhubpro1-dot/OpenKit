import type { DesignNode, Page, Project } from "@/lib/types";
import { styleToCss } from "@/lib/tree";
import { slugify } from "@/lib/utils";

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function styleAttr(node: DesignNode): string {
  const css = styleToCss(node.style);
  return css ? ` style="${esc(css)}"` : "";
}

function splitCsv(v?: string): string[] {
  if (!v) return [];
  return v.split(/[,\n]/).map((s) => s.trim()).filter(Boolean);
}

function nodeToHtml(node: DesignNode, indent = 0): string {
  const pad = "  ".repeat(indent);
  const s = styleAttr(node);
  const c = node.content;
  const data = c.data ?? {};
  const children = node.children.map((ch) => nodeToHtml(ch, indent + 1)).join("\n");

  switch (node.kind) {
    case "section":
    case "container":
      return `${pad}<section${s}>\n${children}\n${pad}</section>`;
    case "heading":
      return c.href
        ? `${pad}<a href="${esc(c.href)}"><h2${s}>${esc(c.text ?? "")}</h2></a>`
        : `${pad}<h2${s}>${esc(c.text ?? "")}</h2>`;
    case "text":
      return `${pad}<p${s}>${esc(c.text ?? "")}</p>`;
    case "button":
      return `${pad}<a${s} href="${esc(c.href ?? "#")}">${esc(c.text ?? "Button")}</a>`;
    case "divider":
      return `${pad}<hr${s} />`;
    case "spacer":
      return `${pad}<div${s}></div>`;
    case "list":
      return `${pad}<ul${s}>\n${(c.items ?? []).map((i) => `${pad}  <li>${esc(i)}</li>`).join("\n")}\n${pad}</ul>`;
    case "badge":
      return `${pad}<span${s}>${esc(c.text ?? "")}</span>`;
    case "icon":
      return `${pad}<span${s}>${esc(c.text ?? "")}</span>`;
    case "avatar":
      return `${pad}<div${s} role="img" aria-label="${esc(c.alt ?? "")}"></div>`;
    case "progress": {
      const value = Math.max(0, Math.min(100, Number(data.value ?? 0)));
      return `${pad}<div${s}><div style="width:${value}%;height:100%;background:${esc(String(data.bar ?? "#4f46e5"))};border-radius:inherit"></div></div>`;
    }
    case "image":
      return `${pad}<img${s} src="${esc(c.src ?? "")}" alt="${esc(c.alt ?? "")}" />`;
    case "video":
      return `${pad}<video${s} src="${esc(c.src ?? "")}" controls playsinline></video>`;
    case "audio":
      return `${pad}<audio${s} src="${esc(c.src ?? "")}" controls></audio>`;
    case "gallery":
      return `${pad}<div${s}>\n${(c.items ?? []).map((src) => `${pad}  <img src="${esc(src)}" alt="" style="width:100%;height:140px;object-fit:cover;border-radius:10px" />`).join("\n")}\n${pad}</div>`;
    case "embed":
      return `${pad}<iframe${s} src="${esc(c.src ?? "")}" allowfullscreen></iframe>`;
    case "map": {
      const lat = Number(data.lat ?? 24.8607);
      const lng = Number(data.lng ?? 67.0011);
      const src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05}%2C${lat - 0.03}%2C${lng + 0.05}%2C${lat + 0.03}&layer=mapnik&marker=${lat}%2C${lng}`;
      return `${pad}<iframe${s} src="${src}"></iframe>`;
    }
    case "form":
      return `${pad}<form${s} action="${esc(String(data.action ?? ""))}" method="${esc(String(data.method ?? "post"))}">\n${children}\n${pad}</form>`;
    case "input":
      return `${pad}<input${s} placeholder="${esc(c.placeholder ?? "")}" />`;
    case "textarea":
      return `${pad}<textarea${s} placeholder="${esc(c.placeholder ?? "")}"></textarea>`;
    case "select":
      return `${pad}<select${s}>\n${(c.items ?? []).map((o) => `${pad}  <option>${esc(o)}</option>`).join("\n")}\n${pad}</select>`;
    case "checkbox":
      return `${pad}<label${s}><input type="checkbox" /> ${esc(c.text ?? "")}</label>`;
    case "navbar":
      return `${pad}<nav${s}><span style="font-weight:700;font-size:18px">${esc(c.text ?? "")}</span><div style="display:flex;gap:18px">${(c.items ?? []).map((i) => `<a href="#" style="color:inherit;text-decoration:none">${esc(i)}</a>`).join("")}</div></nav>`;
    case "hero":
      return `${pad}<section${s}><h1 style="font-size:52px;font-weight:800;margin:0;line-height:1.1">${esc(c.text ?? "")}</h1><p style="font-size:18px;opacity:.75;margin:0;max-width:620px">${esc(String(data.sub ?? ""))}</p><a href="#" style="display:inline-flex;padding:13px 26px;border-radius:10px;background:#4f46e5;color:#fff;text-decoration:none;font-weight:600">${esc(String(data.cta ?? "Get started"))}</a></section>`;
    case "card":
      return `${pad}<article${s}>${c.src ? `<img src="${esc(c.src)}" alt="" style="width:100%;height:150px;object-fit:cover;border-radius:10px" />` : ""}<h3 style="margin:0;font-size:19px;font-weight:700">${esc(c.text ?? "")}</h3><p style="margin:0;font-size:15px;opacity:.75">${esc(String(data.body ?? ""))}</p></article>`;
    case "cards":
      return `${pad}<div${s}>\n${(c.items ?? []).map((t) => `${pad}  <article style="display:flex;flex-direction:column;gap:8px;padding:20px;border-radius:14px;background:#fff;border:1px solid #eef1f6"><h3 style="margin:0;font-size:18px;font-weight:700">${esc(t)}</h3><p style="margin:0;font-size:14px;opacity:.7">${esc(String(data.body ?? ""))}</p></article>`).join("\n")}\n${pad}</div>`;
    case "features": {
      const icons = splitCsv(String(data.icons ?? ""));
      return `${pad}<div${s}>\n${(c.items ?? []).map((t, i) => `${pad}  <div style="display:flex;flex-direction:column;gap:8px"><span style="font-size:30px">${esc(icons[i] ?? "•")}</span><h3 style="margin:0;font-size:18px;font-weight:700">${esc(t)}</h3><p style="margin:0;font-size:14px;opacity:.7">${esc(String(data.body ?? ""))}</p></div>`).join("\n")}\n${pad}</div>`;
    }
    case "testimonial":
      return `${pad}<blockquote${s}><p style="margin:0;font-size:19px;line-height:1.5">${esc(c.text ?? "")}</p><footer style="font-size:14px;opacity:.7">— ${esc(String(data.author ?? ""))}</footer></blockquote>`;
    case "pricing": {
      const prices = splitCsv(String(data.prices ?? ""));
      return `${pad}<div${s}>\n${(c.items ?? []).map((plan, i) => `${pad}  <div style="display:flex;flex-direction:column;gap:10px;padding:24px;border-radius:16px;background:${i === 1 ? "#0f172a" : "#fff"};color:${i === 1 ? "#e2e8f0" : "#0f172a"};border:1px solid #eef1f6"><span style="font-size:14px;text-transform:uppercase;letter-spacing:1px">${esc(plan)}</span><strong style="font-size:34px">${esc(prices[i] ?? "$0")}</strong><span style="font-size:14px;opacity:.7">per month</span></div>`).join("\n")}\n${pad}</div>`;
    }
    case "stats": {
      const labels = splitCsv(String(data.labels ?? ""));
      return `${pad}<div${s}>\n${(c.items ?? []).map((v, i) => `${pad}  <div style="display:flex;flex-direction:column;gap:4px"><strong style="font-size:34px;font-weight:800">${esc(v)}</strong><span style="font-size:14px;opacity:.65">${esc(labels[i] ?? "")}</span></div>`).join("\n")}\n${pad}</div>`;
    }
    case "faq": {
      const answers = String(data.answers ?? "").split("|").map((x) => x.trim());
      return `${pad}<div${s}>\n${(c.items ?? []).map((q, i) => `${pad}  <details style="padding:14px 18px;border-radius:12px;background:#f8fafc;border:1px solid #eef1f6"><summary style="cursor:pointer;font-weight:600">${esc(q)}</summary><p style="margin:10px 0 0;font-size:15px;opacity:.75">${esc(answers[i] ?? "")}</p></details>`).join("\n")}\n${pad}</div>`;
    }
    case "footer":
      return `${pad}<footer${s}><strong style="font-size:17px">${esc(c.text ?? "")}</strong><div style="display:flex;gap:16px">${(c.items ?? []).map((i) => `<a href="#" style="color:inherit;text-decoration:none;font-size:14px">${esc(i)}</a>`).join("")}</div><span style="font-size:13px;opacity:.7">${esc(String(data.note ?? ""))}</span></footer>`;
    case "table": {
      const rows = (c.items ?? []).map((r) => r.split(",").map((x) => x.trim()));
      const [head, ...body] = rows;
      return `${pad}<table${s} style="border-collapse:collapse"><thead><tr>${(head ?? []).map((h) => `<th style="text-align:left;padding:10px 14px;border-bottom:1px solid #e2e8f0">${esc(h)}</th>`).join("")}</tr></thead><tbody>${body.map((r) => `<tr>${r.map((cell) => `<td style="padding:10px 14px;border-bottom:1px solid #f1f5f9">${esc(cell)}</td>`).join("")}</tr>`).join("")}</tbody></table>`;
    }
    case "shape":
      return `${pad}<div${s}></div>`;
    case "code":
      return `${pad}<pre${s}><code>${esc(c.text ?? "")}</code></pre>`;
    case "html":
      return `${pad}${c.html ?? ""}`;
    case "screenshot":
      return `${pad}<img${s} src="${esc(c.src ?? "")}" alt="${esc(c.alt ?? "")}" />`;
    default:
      return `${pad}<div${s}>${esc(node.name)}</div>`;
  }
}

export function pageToHtml(page: Page, project: Project): string {
  const body = nodeToHtml(page.root, 2);
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(project.settings.name)} — ${esc(page.name)}</title>
  <meta name="description" content="${esc(project.settings.description)}" />
  <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>⚡</text></svg>" />
  <style>
    * { box-sizing: border-box; }
    body { margin: 0; font-family: ${esc(project.settings.fontBody)}, system-ui, sans-serif; background: ${esc(page.background)}; }
    img { max-width: 100%; }
    a { color: inherit; }
  </style>
</head>
<body>
${body}
</body>
</html>
`;
}

export function projectToHtmlFiles(project: Project): Record<string, string> {
  const files: Record<string, string> = {};
  for (const page of project.pages) {
    const name = page.path === "/" ? "index" : slugify(page.name);
    files[`${name}.html`] = pageToHtml(page, project);
  }
  return files;
}

/* ------------------------------ React export ----------------------------- */

function nodeToJsx(node: DesignNode, indent = 0): string {
  const pad = "  ".repeat(indent);
  const css = styleToCss(node.style);
  const styleProp = css ? ` style={{ ${cssToJsx(css)} }}` : "";
  const c = node.content;
  const data = c.data ?? {};
  const children = node.children.map((ch) => nodeToJsx(ch, indent + 1)).join("\n");

  switch (node.kind) {
    case "section":
    case "container":
      return `${pad}<section${styleProp}>\n${children}\n${pad}</section>`;
    case "heading":
      return `${pad}<h2${styleProp}>${esc(c.text ?? "")}</h2>`;
    case "text":
      return `${pad}<p${styleProp}>${esc(c.text ?? "")}</p>`;
    case "button":
      return `${pad}<a${styleProp} href="${esc(c.href ?? "#")}">${esc(c.text ?? "Button")}</a>`;
    case "image":
      return `${pad}<img${styleProp} src="${esc(c.src ?? "")}" alt="${esc(c.alt ?? "")}" />`;
    case "video":
      return `${pad}<video${styleProp} src="${esc(c.src ?? "")}" controls />`;
    case "audio":
      return `${pad}<audio${styleProp} src="${esc(c.src ?? "")}" controls />`;
    case "divider":
      return `${pad}<hr${styleProp} />`;
    case "spacer":
      return `${pad}<div${styleProp} />`;
    case "list":
      return `${pad}<ul${styleProp}>{${JSON.stringify(c.items ?? [])}.map((item, i) => <li key={i}>{item}</li>)}</ul>`;
    case "badge":
      return `${pad}<span${styleProp}>${esc(c.text ?? "")}</span>`;
    case "icon":
      return `${pad}<span${styleProp}>${esc(c.text ?? "")}</span>`;
    case "hero":
      return `${pad}<section${styleProp}><h1 style={{ fontSize: 52, fontWeight: 800, margin: 0 }}>${esc(c.text ?? "")}</h1><p style={{ fontSize: 18, opacity: 0.75 }}>${esc(String(data.sub ?? ""))}</p><a href="#" style={{ padding: "13px 26px", borderRadius: 10, background: "#4f46e5", color: "#fff", textDecoration: "none" }}>${esc(String(data.cta ?? "Get started"))}</a></section>`;
    case "navbar":
      return `${pad}<nav${styleProp}><span style={{ fontWeight: 700 }}>${esc(c.text ?? "")}</span><div style={{ display: "flex", gap: 18 }}>{${JSON.stringify(c.items ?? [])}.map((item, i) => <a key={i} href="#" style={{ color: "inherit", textDecoration: "none" }}>{item}</a>)}</div></nav>`;
    case "footer":
      return `${pad}<footer${styleProp}><strong>${esc(c.text ?? "")}</strong><span>${esc(String(data.note ?? ""))}</span></footer>`;
    case "form":
      return `${pad}<form${styleProp}>\n${children}\n${pad}</form>`;
    case "input":
      return `${pad}<input${styleProp} placeholder="${esc(c.placeholder ?? "")}" />`;
    case "textarea":
      return `${pad}<textarea${styleProp} placeholder="${esc(c.placeholder ?? "")}" />`;
    case "select":
      return `${pad}<select${styleProp}>{${JSON.stringify(c.items ?? [])}.map((o, i) => <option key={i}>{o}</option>)}</select>`;
    case "checkbox":
      return `${pad}<label${styleProp}><input type="checkbox" /> ${esc(c.text ?? "")}</label>`;
    case "code":
      return `${pad}<pre${styleProp}><code>{${JSON.stringify(c.text ?? "")}}</code></pre>`;
    case "html":
      return `${pad}<div dangerouslySetInnerHTML={{ __html: ${JSON.stringify(c.html ?? "")} }} />`;
    default:
      return `${pad}<div${styleProp}>{/* ${esc(node.kind)} */}</div>`;
  }
}

function cssToJsx(css: string): string {
  return css
    .split(";")
    .map((d) => d.trim())
    .filter(Boolean)
    .map((d) => {
      const idx = d.indexOf(":");
      const prop = d.slice(0, idx).trim().replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
      const value = d.slice(idx + 1).trim();
      const numeric = /^-?\d+(\.\d+)?$/.test(value);
      return `${prop}: ${numeric ? value : JSON.stringify(value)}`;
    })
    .join(", ");
}

export function pageToReact(page: Page, project: Project): string {
  const body = nodeToJsx(page.root, 2);
  const componentName = slugify(page.name).replace(/(^|-)([a-z])/g, (_, __, c: string) => c.toUpperCase()) || "Page";
  return `export default function ${componentName}() {
  return (
    <main style={{ background: ${JSON.stringify(page.background)}, minHeight: "100vh", fontFamily: ${JSON.stringify(project.settings.fontBody)} }}>
${body}
    </main>
  );
}
`;
}

export function projectToReactFiles(project: Project): Record<string, string> {
  const files: Record<string, string> = {};
  for (const page of project.pages) {
    const name = slugify(page.name);
    files[`src/pages/${name}.tsx`] = pageToReact(page, project);
  }
  files["package.json"] = JSON.stringify(
    {
      name: slugify(project.settings.name),
      version: "0.1.0",
      private: true,
      scripts: { dev: "next dev", build: "next build", start: "next start" },
      dependencies: { next: "15.5.29", react: "19.0.0", "react-dom": "19.0.0" },
    },
    null,
    2
  );
  files["README.md"] = `# ${project.settings.name}\n\nExported from OpenKil.\n\n\`\`\`bash\nnpm install\nnpm run dev\n\`\`\`\n`;
  return files;
}

/* ------------------------------ Deploy configs --------------------------- */

export function vercelConfig(): string {
  return JSON.stringify(
    {
      $schema: "https://openapi.vercel.sh/vercel.json",
      framework: "nextjs",
      buildCommand: "npm run build",
      outputDirectory: ".next",
    },
    null,
    2
  );
}

export function firebaseJson(): string {
  return JSON.stringify(
    {
      hosting: {
        public: "out",
        ignore: ["firebase.json", "**/.*", "**/node_modules/**"],
        rewrites: [{ source: "**", destination: "/index.html" }],
      },
    },
    null,
    2
  );
}

export function firebaseRc(projectId: string): string {
  return JSON.stringify({ projects: { default: projectId || "your-firebase-project" } }, null, 2);
}

export function deployReadme(project: Project): string {
  return `# Deploy ${project.settings.name}

## Vercel
1. Push this folder to a GitHub repo.
2. Import it at https://vercel.com/new
3. Framework preset: Next.js — no extra config needed (vercel.json included).

Or with the CLI:
\`\`\`bash
npm i -g vercel
vercel
\`\`\`

## Firebase Hosting
\`\`\`bash
npm i -g firebase-tools
npm run build   # or export static HTML from OpenKil
firebase login
firebase init hosting   # choose "out" as public dir, single-page app: yes
firebase deploy
\`\`\`

firebase.json and .firebaserc are included. Set your project id in .firebaserc.
`;
}
