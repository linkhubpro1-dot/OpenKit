import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: {
          950: "#0a0a0f",
          900: "#101018",
          850: "#16161f",
          800: "#1c1c27",
          700: "#262633",
          600: "#33334a",
        },
        brand: {
          50: "#eef2ff",
          300: "#a5b4fc",
          400: "#818cf8",
          500: "#6366f1",
          600: "#4f46e5",
          700: "#4338ca",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
      },
      boxShadow: {
        panel: "0 10px 40px -12px rgba(0,0,0,0.55)",
      },
    },
  },
  plugins: [],
};

export default config;