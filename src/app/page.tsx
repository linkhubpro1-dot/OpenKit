import Link from "next/link";

export default function Home() {
  return (
    <main className="min-h-screen bg-ink-950 text-slate-200">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-brand-400 to-brand-700 font-black text-white">
            K
          </div>
          <span className="text-lg font-bold tracking-tight text-white">OpenKil</span>
        </div>
        <nav className="flex items-center gap-6 text-sm text-slate-400">
          <a href="#features" className="hover:text-white">Features</a>
          <a href="#templates" className="hover:text-white">Templates</a>
          <a href="#deploy" className="hover:text-white">Deploy</a>
          <Link
            href="/editor"
            className="rounded-lg bg-brand-600 px-4 py-2 font-semibold text-white hover:bg-brand-500"
          >
            Open Editor
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 text-center">
        <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-ink-700 bg-ink-900 px-4 py-1.5 text-xs text-brand-300">
          <span className="ai-dot inline-block h-2 w-2 rounded-full bg-brand-400" />
          AI-powered visual builder
        </div>
        <h1 className="mx-auto max-w-4xl text-5xl font-extrabold leading-[1.1] tracking-tight text-white md:text-6xl">
          Build apps & websites
          <br />
          <span className="bg-gradient-to-r from-brand-300 via-brand-400 to-cyan-400 bg-clip-text text-transparent">
            without writing code
          </span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-400">
          Drag & drop your design, add images, audio and video, let AI do the heavy lifting,
          then export clean code or deploy straight to Vercel or Firebase.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/editor"
            className="rounded-xl bg-brand-600 px-6 py-3 text-base font-semibold text-white shadow-panel hover:bg-brand-500"
          >
            Start building — it&apos;s free
          </Link>
          <a
            href="#features"
            className="rounded-xl border border-ink-700 bg-ink-900 px-6 py-3 text-base font-semibold text-slate-200 hover:border-ink-600"
          >
            See how it works
          </a>
        </div>

        {/* Mock editor preview */}
        <div className="mx-auto mt-16 max-w-5xl overflow-hidden rounded-2xl border border-ink-700 bg-ink-900 shadow-panel">
          <div className="flex items-center gap-2 border-b border-ink-800 bg-ink-850 px-4 py-2.5">
            <span className="h-3 w-3 rounded-full bg-red-500/70" />
            <span className="h-3 w-3 rounded-full bg-yellow-500/70" />
            <span className="h-3 w-3 rounded-full bg-green-500/70" />
            <span className="ml-3 text-xs text-slate-500">openkil.app/editor</span>
          </div>
          <div className="grid grid-cols-12 gap-0 text-left">
            <div className="col-span-2 border-r border-ink-800 p-3">
              {["Section", "Hero", "Cards", "Image", "Button", "Form"].map((i) => (
                <div key={i} className="mb-2 rounded-md bg-ink-800 px-2 py-2 text-[11px] text-slate-400">
                  {i}
                </div>
              ))}
            </div>
            <div className="col-span-7 bg-white p-6">
              <div className="mb-3 h-4 w-24 rounded bg-slate-200" />
              <div className="mb-2 h-8 w-3/4 rounded bg-slate-800" />
              <div className="mb-4 h-4 w-2/3 rounded bg-slate-300" />
              <div className="h-9 w-32 rounded-lg bg-brand-600" />
              <div className="mt-6 grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 rounded-lg border border-slate-200 bg-slate-50" />
                ))}
              </div>
            </div>
            <div className="col-span-3 border-l border-ink-800 p-3">
              <div className="mb-2 text-[10px] uppercase tracking-wider text-slate-500">AI Copilot</div>
              <div className="rounded-lg bg-ink-800 p-2 text-[11px] text-slate-300">
                “Make the hero darker and add a signup form”
              </div>
              <div className="mt-2 rounded-lg bg-brand-600/20 p-2 text-[11px] text-brand-300">
                ✓ Hero updated, form added
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="border-t border-ink-800 bg-ink-900/40 py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-white">Everything you need, nothing you don&apos;t</h2>
          <p className="mt-3 text-center text-slate-400">Like Lovable and Bubble — but open, exportable and yours.</p>
          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {[
              { icon: "🧩", title: "Drag & drop canvas", body: "Sections, heroes, cards, forms, galleries — drop them in and arrange visually." },
              { icon: "🤖", title: "AI copilot", body: "Describe what you want. AI builds sections, rewrites copy and restyles elements." },
              { icon: "🖼️", title: "Screenshot to design", body: "Upload any screenshot, remove its background, recolor it and reposition layers." },
              { icon: "🎨", title: "Pro templates", body: "Start from dozens of production-ready designs for SaaS, portfolios, stores and more." },
              { icon: "📦", title: "Export real code", body: "Download clean React + Tailwind or plain HTML/CSS. No lock-in, ever." },
              { icon: "🚀", title: "One-click deploy", body: "Ship to Vercel or Firebase Hosting directly from the editor." },
            ].map((f) => (
              <div key={f.title} className="rounded-2xl border border-ink-800 bg-ink-900 p-6">
                <div className="text-3xl">{f.icon}</div>
                <h3 className="mt-3 font-semibold text-white">{f.title}</h3>
                <p className="mt-1.5 text-sm text-slate-400">{f.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Templates strip */}
      <section id="templates" className="py-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-bold text-white">Start from a pro template</h2>
          <p className="mt-3 text-center text-slate-400">SaaS, agency, portfolio, restaurant, store, event — all editable.</p>
          <div className="mt-10 grid grid-cols-2 gap-4 md:grid-cols-4">
            {["SaaS Landing", "Agency", "Portfolio", "Restaurant", "Online Store", "Event", "Blog", "Mobile App"].map((t) => (
              <div key={t} className="group overflow-hidden rounded-xl border border-ink-800 bg-ink-900">
                <div className="flex h-28 items-center justify-center bg-gradient-to-br from-ink-800 to-ink-850 text-2xl transition group-hover:from-brand-700/40">
                  ✦
                </div>
                <div className="p-3 text-sm font-medium text-slate-300">{t}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Deploy */}
      <section id="deploy" className="border-t border-ink-800 py-20">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-white">From idea to live URL in minutes</h2>
          <p className="mt-3 text-slate-400">Export the code, or deploy straight to your favorite host.</p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm">
            {["Vercel", "Firebase Hosting", "Netlify", "GitHub Pages", "Any static host"].map((h) => (
              <span key={h} className="rounded-full border border-ink-700 bg-ink-900 px-4 py-2 text-slate-300">
                {h}
              </span>
            ))}
          </div>
          <Link
            href="/editor"
            className="mt-10 inline-block rounded-xl bg-brand-600 px-8 py-3 font-semibold text-white hover:bg-brand-500"
          >
            Open the editor →
          </Link>
        </div>
      </section>

      <footer className="border-t border-ink-800 py-8 text-center text-sm text-slate-500">
        © 2026 OpenKil. Built with OpenKil.
      </footer>
    </main>
  );
}