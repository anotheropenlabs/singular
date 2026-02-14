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
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Surge-style glassmorphism colors
        glass: {
          light: "rgba(255, 255, 255, 0.1)",
          medium: "rgba(255, 255, 255, 0.15)",
          dark: "rgba(0, 0, 0, 0.2)",
          border: "rgba(255, 255, 255, 0.2)",
        },
        surge: {
          primary: "#007AFF",
          secondary: "#5856D6",
          accent: "#00C7BE",
          success: "#34C759",
          warning: "#FF9500",
          danger: "#FF3B30",
          bg: {
            dark: "#1C1C1E",
            card: "rgba(44, 44, 46, 0.8)",
            elevated: "rgba(58, 58, 60, 0.6)",
          },
          text: {
            primary: "#FFFFFF",
            secondary: "rgba(255, 255, 255, 0.7)",
            tertiary: "rgba(255, 255, 255, 0.5)",
          },
        },
      },
      backdropBlur: {
        xs: "2px",
      },
      boxShadow: {
        glass: "0 8px 32px 0 rgba(0, 0, 0, 0.37)",
        "glass-sm": "0 4px 16px 0 rgba(0, 0, 0, 0.2)",
        "glass-lg": "0 16px 48px 0 rgba(0, 0, 0, 0.45)",
      },
      borderRadius: {
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
    },
  },
  plugins: [],
};
export default config;
