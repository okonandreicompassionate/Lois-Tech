import type { Config } from "tailwindcss";

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      animation: {
        marquee: "marquee 25s linear infinite",
        "slow-zoom": "slowZoom 20s ease-out forwards",
        "fade-in-up": "fadeInUp 1s ease-out forwards",
      },
    },
  },
  plugins: [],
} satisfies Config;