"use client";

import React, { useRef, useState } from "react";
import { useBuilder } from "@/store/builder";
import { readFileAsDataUrl, formatBytes, cn } from "@/lib/utils";
import {
  removeBackground,
  replaceColor,
  hueRotate,
  adjustImage,
  flipImage,
  resizeImage,
} from "@/lib/imageTools";

export function AssetsPanel() {
  const assets = useBuilder((s) => s.project.assets);
  const addAsset = useBuilder((s) => s.addAsset);
  const deleteAsset = useBuilder((s) => s.deleteAsset);
  const addNodeRaw = useBuilder((s) => s.addNodeRaw);
  const updateContent = useBuilder((s) => s.updateContent);
  const selectedId = useBuilder((s) => s.selectedId);
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [tolerance, setTolerance] = useState(32);
  const [fromColor, setFromColor] = useState("#ffffff");
  const [toColor, setToColor] = useState("#000000");
  const [hue, setHue] = useState(0);
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturate, setSaturate] = useState(100);
  const [activeAsset, setActiveAsset] = useState<string | null>(null);

  const onFiles = async (files: FileList | null) => {
    if (!files) return;
    for (const file of Array.from(files)) {
      const url = await readFileAsDataUrl(file);
      const kind = file.type.startsWith("image/")
        ? "image"
        : file.type.startsWith("audio/")
        ? "audio"
        : file.type.startsWith("video/")
        ? "video"
        : "other";
      addAsset({ name: file.name, url, kind, size: file.size });
    }
  };

  const insertAsset = (url: string, kind: string) => {
    if (kind === "image") {
      if (selectedId) {
        updateContent(selectedId, { src: url });
      } else {
        addNodeRaw({
          id: `n_${Math.random().toString(36).slice(2, 9)}`,
          kind: "image",
          name: "Image",
          content: { src: url, alt: "" },
          style: { width: "100%", radius: 12 },
          children: [],
        });
      }
    } else if (kind === "audio") {
      addNodeRaw({
        id: `n_${Math.random().toString(36).slice(2, 9)}`,
        kind: "audio",
        name: "Audio",
        content: { src: url },
        style: { width: "100%" },
        children: [],
      });
    } else if (kind === "video") {
      addNodeRaw({
        id: `n_${Math.random().toString(36).slice(2, 9)}`,
        kind: "video",
        name: "Video",
        content: { src: url },
        style: { width: "100%", aspectRatio: "16 / 9", radius: 12 },
        children: [],
      });
    }
  };

  const applyTool = async (tool: string, assetId: string, url: string) => {
    setBusy(tool);
    try {
      let result: string | null = null;
      if (tool === "remove-bg") result = await removeBackground(url, { tolerance, sampleSize: 12 });
      else if (tool === "replace-color") result = await replaceColor(url, fromColor, toColor, 40);
      else if (tool === "hue") result = await hueRotate(url, hue);
      else if (tool === "adjust") result = await adjustImage(url, { brightness, contrast, saturate });
      else if (tool === "flip-h") result = await flipImage(url, "horizontal");
      else if (tool === "flip-v") result = await flipImage(url, "vertical");
      else if (tool === "resize") result = await resizeImage(url, 1600);
      if (result) {
        addAsset({ name: `edited-${tool}.png`, url: result, kind: "image" });
      }
    } catch (err) {
      console.error(err);
      alert("Image tool failed. If the image is from another site, it may be blocked by CORS — upload it instead.");
    } finally {
      setBusy(null);
    }
  };

  const active = assets.find((a) => a.id === activeAsset);

  return (
    <div className="flex h-full flex-col">
      <div className="border-b border-ink-800 p-3">
        <input
          ref={fileRef}
          type="file"
          accept="image/*,audio/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
        <button
          onClick={() => fileRef.current?.click()}
          className="w-full rounded-lg border border-dashed border-ink-600 bg-ink-850 px-3 py-3 text-xs font-medium text-slate-300 hover:border-brand-500 hover:text-white"
        >
          + Upload images, audio or video
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3">
        {/* Image tools */}
        {active && active.kind === "image" ? (
          <div className="mb-4 rounded-xl border border-ink-800 bg-ink-850 p-3">
            <div className="mb-2 flex items-center justify-between">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Image tools
              </span>
              <button onClick={() => setActiveAsset(null)} className="text-xs text-slate-500 hover:text-white">
                ✕
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={active.url} alt={active.name} className="mb-3 max-h-32 w-full rounded-lg object-contain bg-ink-900" />

            <label className="mb-1 block text-[10px] text-slate-500">Background tolerance: {tolerance}</label>
            <input type="range" min={8} max={80} value={tolerance} onChange={(e) => setTolerance(Number(e.target.value))} className="mb-2 w-full" />
            <button
              disabled={busy !== null}
              onClick={() => applyTool("remove-bg", active.id, active.url)}
              className="mb-3 w-full rounded-lg bg-brand-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-50"
            >
              {busy === "remove-bg" ? "Removing…" : "Remove background"}
            </button>

            <div className="mb-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[10px] text-slate-500">From</label>
                <input type="color" value={fromColor} onChange={(e) => setFromColor(e.target.value)} className="h-8 w-full rounded border border-ink-700 bg-ink-900" />
              </div>
              <div>
                <label className="mb-1 block text-[10px] text-slate-500">To</label>
                <input type="color" value={toColor} onChange={(e) => setToColor(e.target.value)} className="h-8 w-full rounded border border-ink-700 bg-ink-900" />
              </div>
            </div>
            <button
              disabled={busy !== null}
              onClick={() => applyTool("replace-color", active.id, active.url)}
              className="mb-3 w-full rounded-lg border border-ink-700 px-2 py-1.5 text-xs text-slate-200 hover:border-brand-500 disabled:opacity-50"
            >
              {busy === "replace-color" ? "Recoloring…" : "Replace color"}
            </button>

            <label className="mb-1 block text-[10px] text-slate-500">Hue rotate: {hue}°</label>
            <input type="range" min={0} max={360} value={hue} onChange={(e) => setHue(Number(e.target.value))} className="mb-2 w-full" />
            <button
              disabled={busy !== null}
              onClick={() => applyTool("hue", active.id, active.url)}
              className="mb-3 w-full rounded-lg border border-ink-700 px-2 py-1.5 text-xs text-slate-200 hover:border-brand-500 disabled:opacity-50"
            >
              Apply hue
            </button>

            <div className="mb-2 grid grid-cols-3 gap-2 text-[10px] text-slate-500">
              <label>Bright {brightness}<input type="range" min={20} max={200} value={brightness} onChange={(e) => setBrightness(Number(e.target.value))} className="w-full" /></label>
              <label>Contrast {contrast}<input type="range" min={20} max={200} value={contrast} onChange={(e) => setContrast(Number(e.target.value))} className="w-full" /></label>
              <label>Saturate {saturate}<input type="range" min={0} max={200} value={saturate} onChange={(e) => setSaturate(Number(e.target.value))} className="w-full" /></label>
            </div>
            <button
              disabled={busy !== null}
              onClick={() => applyTool("adjust", active.id, active.url)}
              className="mb-3 w-full rounded-lg border border-ink-700 px-2 py-1.5 text-xs text-slate-200 hover:border-brand-500 disabled:opacity-50"
            >
              Apply adjustments
            </button>

            <div className="grid grid-cols-3 gap-1.5">
              <button onClick={() => applyTool("flip-h", active.id, active.url)} className="rounded-lg border border-ink-700 px-2 py-1.5 text-[11px] text-slate-300 hover:border-brand-500">Flip H</button>
              <button onClick={() => applyTool("flip-v", active.id, active.url)} className="rounded-lg border border-ink-700 px-2 py-1.5 text-[11px] text-slate-300 hover:border-brand-500">Flip V</button>
              <button onClick={() => applyTool("resize", active.id, active.url)} className="rounded-lg border border-ink-700 px-2 py-1.5 text-[11px] text-slate-300 hover:border-brand-500">Resize 1600</button>
            </div>
          </div>
        ) : null}

        {/* Asset grid */}
        <div className="grid grid-cols-3 gap-2">
          {assets.map((asset) => (
            <div
              key={asset.id}
              className={cn(
                "group relative overflow-hidden rounded-lg border border-ink-800 bg-ink-850",
                activeAsset === asset.id && "border-brand-500"
              )}
            >
              {asset.kind === "image" ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={asset.url} alt={asset.name} className="h-20 w-full object-cover" />
              ) : (
                <div className="flex h-20 w-full items-center justify-center text-2xl text-slate-500">
                  {asset.kind === "audio" ? "♪" : asset.kind === "video" ? "▶" : "📄"}
                </div>
              )}
              <div className="p-1.5">
                <p className="truncate text-[10px] text-slate-400" title={asset.name}>{asset.name}</p>
                <p className="text-[9px] text-slate-600">{formatBytes(asset.size)}</p>
                <div className="mt-1 flex gap-1">
                  <button onClick={() => insertAsset(asset.url, asset.kind)} className="flex-1 rounded bg-ink-800 px-1 py-1 text-[9px] text-slate-300 hover:text-white">Insert</button>
                  {asset.kind === "image" ? (
                    <button onClick={() => setActiveAsset(asset.id)} className="flex-1 rounded bg-ink-800 px-1 py-1 text-[9px] text-brand-300 hover:text-white">Edit</button>
                  ) : null}
                  <button onClick={() => deleteAsset(asset.id)} className="rounded bg-ink-800 px-1 py-1 text-[9px] text-slate-500 hover:text-red-400">✕</button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {assets.length === 0 ? (
          <p className="mt-8 text-center text-xs text-slate-500">No assets yet. Upload something above.</p>
        ) : null}
      </div>
    </div>
  );
}
