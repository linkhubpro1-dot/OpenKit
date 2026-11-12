import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OpenKil — Visual App & Website Builder",
  description:
    "Build apps and websites visually with drag & drop, AI assistance, and one-click deploy to Vercel or Firebase.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}