import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#ecfdf5",
          100: "#d1fae5",
          200: "#a7f3d0",
          300: "#6ee7b7",
          400: "#34d399",
          500: "#10b981",
          600: "#059669",
          700: "#047857",
          800: "#065f46",
          900: "#064e3b",
          950: "#022c22",
        },
        /* The ledger panel: a deep bottle green that reads as a bound
           account book rather than the usual dashboard navy. */
        ledger: {
          900: "#0B2B22",
          800: "#123A2E",
          700: "#1B4B3C",
          line: "rgba(255,255,255,0.10)",
        },
        /* Semantic money colours, used for figures only — never as
           decoration, so a colour on screen always means something. */
        money: {
          in: "#047857",
          out: "#B4341F",
          due: "#B45309",
          flat: "#475569",
        },
      },
      fontFamily: {
        sans: [
          "var(--font-inter)",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
        figure: [
          "var(--font-figure)",
          "ui-monospace",
          "SFMono-Regular",
          "monospace",
        ],
      },
      boxShadow: {
        card: "0 1px 2px 0 rgba(15, 23, 42, 0.04), 0 1px 3px 0 rgba(15, 23, 42, 0.06)",
        panel: "0 18px 40px -24px rgba(11, 43, 34, 0.55)",
      },
    },
  },
  plugins: [],
};

export default config;
