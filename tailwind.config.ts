import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        storax: {
          bg: "#020617",
          card: "#020617",
          accent: "#4f46e5",
          accentSoft: "#1d2538",
          border: "#1f2937",
          text: "#e5e7eb",
          muted: "#9ca3af",
        },
      },
      boxShadow: {
        "glow-accent": "0 0 40px rgba(79,70,229,0.35)",
      },
      backgroundImage: {
        "radial-grid":
          "radial-gradient(circle at top, rgba(79,70,229,0.25), transparent 55%), radial-gradient(circle at bottom, rgba(56,189,248,0.18), transparent 55%)",
      },
    },
  },
  plugins: [],
};

export default config;


