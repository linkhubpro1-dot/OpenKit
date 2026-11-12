import type { DesignNode, Page, Project } from "@/lib/types";
import { createNode } from "@/lib/registry";
import { uid } from "@/lib/utils";

export function blankPage(name = "Untitled"): Page {
  const root = createNode("section", {
    name: "Page root",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 0,
      width: "100%",
      minHeight: "100vh",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      background: "#ffffff",
    },
    children: [],
  });

  return {
    id: uid("p"),
    name,
    path: `/${name.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
    background: "#ffffff",
    root,
  };
}

export function starterProject(): Project {
  const home = landingPage();
  return {
    id: uid("proj"),
    name: "My first project",
    updatedAt: Date.now(),
    settings: {
      name: "My first project",
      description: "A visual website built with OpenKil",
      primary: "#4f46e5",
      accent: "#22d3ee",
      fontHeading: "Inter",
      fontBody: "Inter",
      radius: 12,
      mode: "website",
    },
    pages: [home],
    assets: [],
  };
}

export function landingPage(): Page {
  const root = createNode("section", {
    name: "Page root",
    style: {
      display: "flex",
      flexDirection: "column",
      width: "100%",
      minHeight: "100vh",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      background: "#ffffff",
    },
    children: [
      createNode("navbar", {
        content: { text: "OpenKil", items: ["Product", "Templates", "Pricing", "Sign in"] },
      }),
      createNode("hero", {
        content: {
          text: "Build a website without writing code",
          data: {
            sub: "Drag, drop, and let AI do the heavy lifting. Export clean code or ship it live in one click.",
            cta: "Start for free",
          },
        },
      }),
      createNode("cards", {
        content: {
          items: ["Visual canvas", "AI copilot", "Instant deploy"],
          data: { body: "Everything you need to go from an idea to a live product." },
        },
      }),
      createNode("features", {
        content: {
          items: ["Drag & drop", "AI assist", "Export code"],
          data: {
            icons: "🧩,🤖,🚀",
            body: "No lock-in. Your design, your code, your host.",
          },
        },
      }),
      createNode("testimonial", {
        content: {
          text: "“We replaced three tools with this. Our landing pages ship in an afternoon now.”",
          data: { author: "Ayesha Khan, Founder at Northline" },
        },
        style: { maxWidth: "720px" },
      }),
      createNode("pricing", {
        content: {
          items: ["Starter", "Pro", "Studio"],
          data: { prices: "$0,$19,$49", note: "Billed monthly. Cancel anytime." },
        },
      }),
      createNode("faq", {
        content: {
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
      }),
      createNode("footer", {
        content: {
          text: "OpenKil",
          items: ["Privacy", "Terms", "Contact"],
          data: { note: "© 2026 OpenKil. All rights reserved." },
        },
      }),
    ],
  });

  return {
    id: uid("p"),
    name: "Home",
    path: "/",
    background: "#ffffff",
    root,
  };
}

export function pageFromNodes(name: string, nodes: DesignNode[]): Page {
  const page = blankPage(name);
  page.root = {
    ...page.root,
    children: nodes,
  };
  return page;
}