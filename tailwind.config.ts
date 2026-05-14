import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./lib/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        border: "var(--border)",
        background: "var(--bg)",
        foreground: "var(--text)",
        muted: "var(--muted)",
        surface: "var(--panel)",
        primary: "var(--accent)",
        "primary-foreground": "var(--accent-contrast)"
      }
    }
  },
  plugins: []
};

export default config;
