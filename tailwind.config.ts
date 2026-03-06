import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--bg-base)",
        foreground: "var(--text-primary)",
        glass: {
          DEFAULT: "var(--bg-surface)",
          hover: "var(--bg-surface-hover)",
          border: "var(--border-color)",
        },
        sing: {
          blue: "var(--accent-primary)",
          cyan: "#22d3ee",
          purple: "#a855f7",
          green: "var(--status-success)",
          yellow: "var(--status-warning)",
          red: "var(--status-error)",
          dark: "var(--bg-base)",
          slate: "var(--bg-surface)",
        },
        theme: {
          base: "var(--bg-base)",
          surface: "var(--bg-surface)",
          border: "var(--border-color)",
          text: "var(--text-primary)",
          muted: "var(--text-secondary)",
        }
      },
      backgroundImage: {
        // Using minimal patterns instead of heavy radials
        'grid-pattern': 'linear-gradient(to right, #1f2937 1px, transparent 1px), linear-gradient(to bottom, #1f2937 1px, transparent 1px)',
      },
      fontFamily: {
        sans: ['"Geist Sans"', 'system-ui', 'sans-serif'],
        mono: ['"Geist Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Monaco', 'Consolas', 'monospace'],
      },
      boxShadow: {
        'glow-sm': '0 0 10px rgba(59, 130, 246, 0.2)',
        'glow-md': '0 0 20px rgba(59, 130, 246, 0.3)',
      }
    },
  },
  plugins: [],
};
export default config;
