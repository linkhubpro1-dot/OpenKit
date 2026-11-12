"use client";

import React, { useState } from "react";
import JSZip from "jszip";
import { useBuilder } from "@/store/builder";
import {
  projectToHtmlFiles,
  projectToReactFiles,
  vercelConfig,
  firebaseJson,
  firebaseRc,
  deployReadme,
} from "@/lib/codegen";
import { downloadBlob, downloadText, slugify } from "@/lib/utils";

export function DeployPanel() {
  const project = useBuilder((s) => s.project);
  const activePageId = useBuilder((s) => s.activePageId);
  const setActiveAgent = useBuilder((s) => s.setActiveAgent);
  const [firebaseProject, setFirebaseProject] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const activePage = project.pages.find((p) => p.id === activePageId);
  const base = slugify(project.settings.name) || "openkil-site";

  const downloadZip = async (kind: "html" | "react" | "deploy") => {
    setBusy(kind);
    try {
      const zip = new JSZip();
      if (kind === "html") {
        const files = projectToHtmlFiles(project);
        for (const [name, content] of Object.entries(files)) zip.file(name, content);
        zip.file("README.md", `# ${project.settings.name}\n\nStatic export from OpenKil. Open index.html in a browser.\n`);
      } else if (kind === "react") {
        const files = projectToReactFiles(project);
        for (const [name, content] of Object.entries(files)) zip.file(name, content);
      } else {
        const files = projectToHtmlFiles(project);
        for (const [name, content] of Object.entries(files)) zip.file(`public/${name}`, content);
        zip.file("vercel.json", vercelConfig());
        zip.file("firebase.json", firebaseJson());
        zip.file(".firebaserc", firebaseRc(firebaseProject));
        zip.file("DEPLOY.md", deployReadme(project));
      }
      const blob = await zip.generateAsync({ type: "blob" });
      downloadBlob(blob, `${base}-${kind}.zip`);
    } finally {
      setBusy(null);
    }
  };

  const downloadSingleHtml = () => {
    const files = projectToHtmlFiles(project);
    const first = Object.entries(files)[0];
    if (first) downloadText(first[1], first[0], "text/html");
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      {/* Deploy Helper agent banner */}
      <button
        onClick={() => setActiveAgent("deploy")}
        className="mb-4 flex items-center gap-3 rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-3 text-left hover:border-emerald-500/50"
      >
        <span className="text-xl">🚢</span>
        <span className="flex-1">
          <span className="block text-xs font-semibold text-emerald-300">Deploy Helper agent is ready</span>
          <span className="block text-[10px] text-emerald-500/80">
            You&apos;re on page “{activePage?.name ?? "Home"}”. Ask the agent for step-by-step help shipping this exact page.
          </span>
        </span>
        <span className="text-[10px] text-emerald-400">Open →</span>
      </button>

      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Export code</h3>
      <p className="mb-3 text-[11px] text-slate-500">Download your project as real, editable source code.</p>

      <div className="mb-4 space-y-2">
        <button
          onClick={() => downloadZip("html")}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-xl border border-ink-800 bg-ink-850 p-3 text-left hover:border-brand-600 disabled:opacity-50"
        >
          <span className="text-xl">🌐</span>
          <span className="flex-1">
            <span className="block text-xs font-semibold text-slate-100">Static HTML + CSS</span>
            <span className="block text-[10px] text-slate-500">Plain files, works anywhere. Best for simple sites.</span>
          </span>
          <span className="text-[10px] text-brand-300">{busy === "html" ? "…" : "ZIP"}</span>
        </button>

        <button
          onClick={() => downloadZip("react")}
          disabled={busy !== null}
          className="flex w-full items-center gap-3 rounded-xl border border-ink-800 bg-ink-850 p-3 text-left hover:border-brand-600 disabled:opacity-50"
        >
          <span className="text-xl">⚛️</span>
          <span className="flex-1">
            <span className="block text-xs font-semibold text-slate-100">React + Next.js</span>
            <span className="block text-[10px] text-slate-500">Component source you can keep building on.</span>
          </span>
          <span className="text-[10px] text-brand-300">{busy === "react" ? "…" : "ZIP"}</span>
        </button>

        <button
          onClick={downloadSingleHtml}
          className="flex w-full items-center gap-3 rounded-xl border border-ink-800 bg-ink-850 p-3 text-left hover:border-brand-600"
        >
          <span className="text-xl">📄</span>
          <span className="flex-1">
            <span className="block text-xs font-semibold text-slate-100">Single HTML file</span>
            <span className="block text-[10px] text-slate-500">Just the current page, one file.</span>
          </span>
          <span className="text-[10px] text-brand-300">HTML</span>
        </button>
      </div>

      <h3 className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-slate-500">Deploy</h3>
      <p className="mb-3 text-[11px] text-slate-500">
        OpenKil generates the config files — you run one command. No lock-in, your account, your host.
      </p>

      <div className="mb-3 rounded-xl border border-ink-800 bg-ink-850 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">▲</span>
          <span className="text-xs font-semibold text-slate-100">Vercel</span>
        </div>
        <ol className="mb-2 list-decimal space-y-1 pl-4 text-[10px] leading-snug text-slate-400">
          <li>Download the deploy bundle below</li>
          <li>Push it to a GitHub repo</li>
          <li>Import at vercel.com/new — framework auto-detected</li>
        </ol>
        <code className="block rounded-md bg-ink-900 px-2 py-1.5 font-mono text-[10px] text-brand-300">npm i -g vercel && vercel</code>
      </div>

      <div className="mb-3 rounded-xl border border-ink-800 bg-ink-850 p-3">
        <div className="mb-2 flex items-center gap-2">
          <span className="text-lg">🔥</span>
          <span className="text-xs font-semibold text-slate-100">Firebase Hosting</span>
        </div>
        <label className="mb-1 block text-[10px] font-medium text-slate-500">Firebase project id</label>
        <input
          value={firebaseProject}
          onChange={(e) => setFirebaseProject(e.target.value)}
          placeholder="my-app-12345"
          className="mb-2 w-full rounded-md border border-ink-700 bg-ink-900 px-2 py-1.5 font-mono text-[11px] text-slate-200 outline-none focus:border-brand-500"
        />
        <ol className="mb-2 list-decimal space-y-1 pl-4 text-[10px] leading-snug text-slate-400">
          <li>Download the deploy bundle</li>
          <li><code className="text-brand-300">firebase login</code></li>
          <li><code className="text-brand-300">firebase deploy</code></li>
        </ol>
        <code className="block rounded-md bg-ink-900 px-2 py-1.5 font-mono text-[10px] text-brand-300">npm i -g firebase-tools && firebase deploy</code>
      </div>

      <button
        onClick={() => downloadZip("deploy")}
        disabled={busy !== null}
        className="w-full rounded-xl bg-brand-600 px-4 py-3 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
      >
        {busy === "deploy" ? "Building bundle…" : "⬇ Download deploy bundle (HTML + vercel.json + firebase.json)"}
      </button>

      <p className="mt-3 text-center text-[9px] leading-snug text-slate-600">
        Direct one-click deploy from the browser needs a Vercel/Firebase OAuth app registered by the site owner.
        The bundle above is the same result with two commands.
      </p>
    </div>
  );
}
