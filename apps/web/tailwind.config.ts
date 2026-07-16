import type { Config } from "tailwindcss";

const config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./app/**/*.{ts,tsx}",
    "./src/**/*.{ts,tsx}",
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        sidebar: {
          DEFAULT: "hsl(var(--sidebar-background))",
          foreground: "hsl(var(--sidebar-foreground))",
          primary: "hsl(var(--sidebar-primary))",
          "primary-foreground": "hsl(var(--sidebar-primary-foreground))",
          accent: "hsl(var(--sidebar-accent))",
          "accent-foreground": "hsl(var(--sidebar-accent-foreground))",
          border: "hsl(var(--sidebar-border))",
          ring: "hsl(var(--sidebar-ring))",
        },
        canvas: "hsl(var(--canvas))",
        "surface-1": "hsl(var(--surface-1))",
        "surface-2": "hsl(var(--surface-2))",
        "surface-3": "hsl(var(--surface-3))",
        hairline: "hsl(var(--hairline))",
        "hairline-strong": "hsl(var(--hairline-strong))",
        ink: "hsl(var(--ink))",
        "ink-muted": "hsl(var(--ink-muted))",
        "ink-subtle": "hsl(var(--ink-subtle))",
        "ink-tertiary": "hsl(var(--ink-tertiary))",
        success: "hsl(var(--success))",
        warning: "hsl(var(--warning))",
        error: "hsl(var(--error))",
        "in-active": "#545454",
        connector: "#F0F1F6",
        "keyword-yellow": "#E1CE26",
        "keyword-purple": "#7C21D6",
        "keyword-red": "#EB441F",
        "keyword-green": "#2FE699",
        "light-blue": "#5B6AF0",
        "background-90": "hsl(var(--card))",
        "background-80": "hsl(var(--muted))",
        slate: {
          primary: "#5B6AF0",
          "primary-dark": "#4F5DE0",
          secondary: "#7B88F5",
          accent: "#5B6AF0",
          "bg-primary": "#0B0F19",
          "bg-secondary": "#12171F",
          "bg-tertiary": "#1A212C",
          "text-primary": "#F1F5F9",
          "text-secondary": "#94A3B8",
          "text-tertiary": "#64748B",
          success: "#22C55E",
          warning: "#F59E0B",
          error: "#EF4444",
          info: "#5B6AF0",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        xl: "12px",
        "2xl": "16px",
      },
      boxShadow: {
        soft: "0 4px 12px rgba(0, 0, 0, 0.06)",
        "soft-dark": "0 4px 12px rgba(0, 0, 0, 0.25)",
        focus: "0 0 0 2px hsl(var(--ring) / 0.4)",
      },
      transitionTimingFunction: {
        quiet: "cubic-bezier(0.2, 0, 0, 1)",
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
      transitionDuration: {
        quiet: "140ms",
        "quiet-fast": "110ms",
        "quiet-slow": "200ms",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        marquee: "marquee 40s linear infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;

export default config;
