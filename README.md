# OpenKil

Visual drag & drop builder for websites and apps — like Lovable / Bubble, but open, exportable and yours.

## Features

- **Drag & drop canvas** — sections, heroes, cards, forms, galleries, navbars, footers and more (38 element types)
- **6 AI agents** — Project Starter, Layout Engineer, AI Copilot, Security Auditor, Deploy Helper, Realism Checker
- **AI Copilot** — describe what you want in plain language; AI generates real, editable sections via OpenRouter (473+ models, incl. free ones)
- **Security Auditor** — real local scanner: XSS in custom HTML, `javascript:` links, missing alt text, placeholder copy, dead links, insecure embeds — with severity ratings and one-click AI fix
- **Screenshot tools** — upload any screenshot, remove its background, replace colors, hue-rotate, adjust brightness/contrast/saturation, flip, resize
- **Pro templates** — SaaS, agency, portfolio, restaurant, store, event, blog, mobile app
- **Layers panel** — drag-to-reorder, hide, lock, duplicate, delete
- **Responsive** — desktop / tablet / mobile breakpoints with per-breakpoint style overrides
- **Undo / redo** — full history (Ctrl+Z / Ctrl+Shift+Z)
- **Export code** — static HTML/CSS or React + Next.js source as a ZIP
- **Deploy** — generates `vercel.json`, `firebase.json`, `.firebaserc` and a deploy guide; Deploy Helper agent walks you through it
- **Autosave** — project persists in your browser (localStorage)

## Getting started

```bash
npm install
npm run dev
```

Open http://localhost:3000 — click **Open Editor**.

## AI setup

1. Get an API key at https://openrouter.ai/keys
2. In the editor, open **Settings → AI Provider** and paste the key
3. Pick a model — the full live OpenRouter catalog (473+ models) is searchable, with a **FREE** filter for zero-cost models. Default is `openrouter/free`.
4. Open the **AI** tab and pick an agent:
   - 🚀 **Project Starter** — new project from a one-line idea
   - 🧩 **Layout Engineer** — fixes structure, spacing, grids
   - 🤖 **AI Copilot** — general assistant with full conversation memory
   - 🛡️ **Security Auditor** — real local scan + AI fix
   - 🚢 **Deploy Helper** — step-by-step shipping guidance
   - ✨ **Realism Checker** — removes the "AI prototype" smell

The key is stored only in your browser and sent to OpenRouter through the local `/api/ai` route. You can also set `OPENROUTER_API_KEY` in `.env.local` to provide a server-side default.

## Keyboard shortcuts

| Shortcut | Action |
| --- | --- |
| Ctrl/Cmd + Z | Undo |
| Ctrl/Cmd + Shift + Z | Redo |
| Ctrl/Cmd + S | Save |
| Ctrl/Cmd + D | Duplicate selected |
| Delete / Backspace | Delete selected |
| Escape | Deselect |

## Export & deploy

Open **Deploy** in the right panel:

- **Static HTML + CSS** — plain files, host anywhere
- **React + Next.js** — component source you can keep building on
- **Deploy bundle** — HTML + `vercel.json` + `firebase.json` + `.firebaserc` + `DEPLOY.md`

Direct one-click deploy from the browser requires a Vercel/Firebase OAuth app registered by the site owner; the bundle achieves the same result with two commands.

## Tech stack

Next.js 15 · React 19 · TypeScript · Tailwind CSS · Zustand · dnd-kit · JSZip

## Project structure

```
src/
  app/            landing page, editor route, /api/ai proxy
  components/     NodeView (renderer), canvas, panels
  lib/            types, registry, tree ops, codegen, image tools, templates
  store/          Zustand builder store (history, persistence)
```
