import type { DesignNode, Page, TemplateItem } from "@/lib/types";
import { createNode } from "@/lib/registry";
import { uid } from "@/lib/utils";

function page(name: string, path: string, children: DesignNode[], background = "#ffffff"): Page {
  const root = createNode("section", {
    name: "Page root",
    style: {
      display: "flex",
      flexDirection: "column",
      gap: 0,
      width: "100%",
      minHeight: "100vh",
      padding: { top: 0, right: 0, bottom: 0, left: 0 },
      background,
    },
    children,
  });
  return { id: uid("p"), name, path, background, root };
}

const nav = (brand: string, links: string[]) =>
  createNode("navbar", { content: { text: brand, items: links } });

const hero = (headline: string, sub: string, cta: string, bg?: string) =>
  createNode("hero", {
    content: { text: headline, data: { sub, cta } },
    ...(bg ? { style: { ...createNode("hero").style, background: bg } } : {}),
  });

const footer = (brand: string, note: string) =>
  createNode("footer", {
    content: { text: brand, items: ["Privacy", "Terms", "Contact"], data: { note } },
  });

function saas(): Page[] {
  return [
    page("Home", "/", [
      nav("Nimbus", ["Product", "Pricing", "Docs", "Sign in"]),
      hero(
        "Ship your SaaS 10x faster",
        "The complete toolkit for modern teams — auth, billing, analytics and deploys in one place.",
        "Start free trial",
        "linear-gradient(160deg,#0f172a 0%,#1e1b4b 100%)"
      ),
      createNode("stats", {
        content: { items: ["8k+", "99.99%", "<50ms"], data: { labels: "Teams, Uptime, Latency" } },
      }),
      createNode("features", {
        content: {
          items: ["Auth & SSO", "Usage billing", "Realtime analytics"],
          data: { icons: "🔐,💳,📈", body: "Everything wired up and production-ready from day one." },
        },
      }),
      createNode("pricing", {
        content: {
          items: ["Hobby", "Team", "Enterprise"],
          data: { prices: "$0,$49,Custom", note: "14-day free trial on all plans." },
        },
      }),
      footer("Nimbus", "© 2026 Nimbus Inc. All rights reserved."),
    ]),
  ];
}

function agency(): Page[] {
  return [
    page("Home", "/", [
      nav("Studio North", ["Work", "Studio", "Journal", "Contact"]),
      hero(
        "We craft brands that move people",
        "Strategy, identity and digital experiences for ambitious companies.",
        "See our work",
        "#0c0a09"
      ),
      createNode("gallery", {
        content: {
          items: [
            "https://images.unsplash.com/photo-1467232004584-a385e8f8b0c8?w=800&q=80",
            "https://images.unsplash.com/photo-1558655146-9f40138edfeb?w=800&q=80",
            "https://images.unsplash.com/photo-1561070791-2526d30994b5?w=800&q=80",
          ],
        },
      }),
      createNode("testimonial", {
        content: {
          text: "“Studio North rebranded us in six weeks. Inbound leads doubled.”",
          data: { author: "Maya Chen, CEO of Lumen" },
        },
      }),
      footer("Studio North", "© 2026 Studio North. hello@studionorth.co"),
    ], "#0c0a09"),
  ];
}

function portfolio(): Page[] {
  return [
    page("Home", "/", [
      nav("Ali Raza", ["Work", "About", "Contact"]),
      createNode("hero", {
        content: {
          text: "Ali Raza — Product Designer",
          data: {
            sub: "I design calm, useful interfaces. Previously at Careem and Systems Ltd.",
            cta: "Download résumé",
          },
        },
        style: {
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          gap: 16,
          padding: { top: 110, right: 48, bottom: 110, left: 48 },
          width: "100%",
          background: "#fafaf9",
          textAlign: "left",
        },
      }),
      createNode("cards", {
        content: {
          items: ["Fintech dashboard", "Health app", "Design system"],
          data: { body: "Case study — research, flows, UI and shipped product." },
        },
      }),
      footer("Ali Raza", "© 2026 Ali Raza. Karachi, Pakistan."),
    ]),
  ];
}

function restaurant(): Page[] {
  return [
    page("Home", "/", [
      nav("Zaiqa", ["Menu", "Reservations", "Location"]),
      hero(
        "Authentic desi flavors, modern table",
        "Slow-cooked karahi, fresh naan and chai that hits different. Dine in or order online.",
        "Reserve a table",
        "linear-gradient(160deg,#1c0a00 0%,#431407 100%)"
      ),
      createNode("features", {
        content: {
          items: ["Dine in", "Takeaway", "Catering"],
          data: { icons: "🍽️,🥡,🎉", body: "Open daily 12pm–11pm. G-9 Markaz, Islamabad." },
        },
      }),
      createNode("gallery", {
        content: {
          items: [
            "https://images.unsplash.com/photo-1585937421613-70a008356fbe?w=800&q=80",
            "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=800&q=80",
            "https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=800&q=80",
          ],
        },
      }),
      footer("Zaiqa", "© 2026 Zaiqa Restaurant. +92 300 1234567"),
    ], "#1c0a00"),
  ];
}

function store(): Page[] {
  return [
    page("Home", "/", [
      nav("Karkhana", ["Shop", "Collections", "About", "Cart"]),
      hero(
        "Handmade leather goods, made in Pakistan",
        "Bags, wallets and belts — full-grain leather, lifetime warranty.",
        "Shop the collection",
        "#f5f0e8"
      ),
      createNode("cards", {
        content: {
          items: ["The Voyager Bag — Rs 18,500", "Slim Wallet — Rs 4,200", "Heritage Belt — Rs 6,800"],
          data: { body: "Full-grain leather · Free shipping over Rs 10,000" },
        },
      }),
      createNode("testimonial", {
        content: {
          text: "“The Voyager is the only bag I've ever needed. Built like a tank.”",
          data: { author: "Omar Farooq, Lahore" },
        },
      }),
      footer("Karkhana", "© 2026 Karkhana Leather Co."),
    ], "#f5f0e8"),
  ];
}

function event(): Page[] {
  return [
    page("Home", "/", [
      nav("DevConf PK", ["Speakers", "Schedule", "Tickets"]),
      hero(
        "DevConf PK 2026",
        "Pakistan's biggest developer conference. 40+ speakers, 12 workshops, one day in Karachi.",
        "Get your ticket",
        "linear-gradient(160deg,#020617 0%,#0f172a 60%,#1e293b 100%)"
      ),
      createNode("stats", {
        content: { items: ["40+", "1200", "12"], data: { labels: "Speakers, Attendees, Workshops" } },
      }),
      createNode("features", {
        content: {
          items: ["AI & LLMs", "Cloud & DevOps", "Product & Design"],
          data: { icons: "🤖,☁️,🎨", body: "Three tracks, one stage, endless hallway track." },
        },
      }),
      footer("DevConf PK", "© 2026 DevConf PK. December 12, Karachi Expo Centre."),
    ], "#020617"),
  ];
}

function blog(): Page[] {
  return [
    page("Home", "/", [
      nav("The Changelog", ["Articles", "About", "RSS"]),
      createNode("heading", {
        content: { text: "Notes on building software" },
        style: { fontSize: 44, fontWeight: 800, padding: { top: 64, right: 48, bottom: 8, left: 48 } },
      }),
      createNode("text", {
        content: { text: "Essays on engineering, product and the craft of shipping." },
        style: { fontSize: 18, padding: { top: 0, right: 48, bottom: 32, left: 48 } },
      }),
      createNode("list", {
        content: {
          items: [
            "Why your roadmap is lying to you — Nov 2026",
            "The hidden cost of microservices — Oct 2026",
            "Designing for the 2am on-call — Sep 2026",
          ],
        },
        style: { padding: { top: 0, right: 48, bottom: 48, left: 48 }, fontSize: 17 },
      }),
      footer("The Changelog", "© 2026 The Changelog."),
    ]),
  ];
}

function mobileApp(): Page[] {
  return [
    page("Home", "/", [
      nav("Pulse", ["Features", "Download", "Support"]),
      hero(
        "Your health, in your pocket",
        "Pulse tracks sleep, heart rate and workouts — privately, on-device.",
        "Download for iOS & Android",
        "linear-gradient(160deg,#052e16 0%,#14532d 100%)"
      ),
      createNode("features", {
        content: {
          items: ["Sleep tracking", "Heart rate", "Workout plans"],
          data: { icons: "😴,❤️,🏋️", body: "No account required. Your data never leaves your phone." },
        },
      }),
      createNode("stats", {
        content: { items: ["4.9★", "250k", "0"], data: { labels: "App Store, Downloads, Data sold" } },
      }),
      footer("Pulse", "© 2026 Pulse Health Inc."),
    ], "#052e16"),
  ];
}

export const TEMPLATES: TemplateItem[] = [
  { id: "saas", name: "SaaS Landing", category: "Business", description: "Dark hero, stats, features and pricing for a software product.", accent: "#6366f1", build: saas },
  { id: "agency", name: "Agency / Studio", category: "Business", description: "Bold dark portfolio-style site for creative studios.", accent: "#f59e0b", build: agency },
  { id: "portfolio", name: "Portfolio", category: "Personal", description: "Personal site for designers and developers.", accent: "#0ea5e9", build: portfolio },
  { id: "restaurant", name: "Restaurant", category: "Food", description: "Menu, reservations and gallery for a restaurant.", accent: "#f97316", build: restaurant },
  { id: "store", name: "Online Store", category: "Commerce", description: "Product showcase for a small brand or maker.", accent: "#a16207", build: store },
  { id: "event", name: "Event / Conference", category: "Events", description: "Conference landing with stats, tracks and tickets.", accent: "#22d3ee", build: event },
  { id: "blog", name: "Blog / Writing", category: "Personal", description: "Minimal blog index for essays and notes.", accent: "#64748b", build: blog },
  { id: "mobile-app", name: "Mobile App", category: "App", description: "App download page with features and ratings.", accent: "#22c55e", build: mobileApp },
];

export const TEMPLATE_CATEGORIES = ["All", ...Array.from(new Set(TEMPLATES.map((t) => t.category)))];