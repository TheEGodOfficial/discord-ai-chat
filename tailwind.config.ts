import type { Config } from "tailwindcss"

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        "discord-darkest": "#020204",
        "discord-darker": "#0a0a12",
        "discord-dark": "#12121f",
        "neon-purple": "#8b5cf6",
        "neon-blue": "#3b82f6",
        "neon-pink": "#ec4899",
        "neon-red": "#ef4444",
      },
      animation: {
        "pulse-glow": "pulse-glow 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fade-in 0.4s ease-out",
        "slide-up": "slide-up 0.3s ease-out",
        "shimmer": "shimmer 2s linear infinite",
        "float": "float 6s ease-in-out infinite",
      },
      keyframes: {
        "pulse-glow": {
          "0%, 100%": { opacity: "1", boxShadow: "0 0 16px rgba(139, 92, 246, 0.3)" },
          "50%": { opacity: "0.85", boxShadow: "0 0 32px rgba(139, 92, 246, 0.6)" },
        },
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "slide-up": {
          "0%": { opacity: "0", transform: "translateY(16px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "shimmer": {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "float": {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-20px)" },
        },
      },
    },
  },
  plugins: [],
}
export default config
