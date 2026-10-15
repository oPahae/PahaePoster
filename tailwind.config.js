function themeColor(variable) {
  return `rgb(var(${variable}) / <alpha-value>)`;
}

module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}"
  ],
  theme: {
    extend: {
      colors: {
        base: {
          950: themeColor("--base-950"),
          900: themeColor("--base-900"),
          850: themeColor("--base-850"),
          800: themeColor("--base-800"),
          700: themeColor("--base-700"),
          600: themeColor("--base-600"),
          500: themeColor("--base-500"),
          400: themeColor("--base-400"),
          300: themeColor("--base-300"),
          200: themeColor("--base-200"),
          100: themeColor("--base-100")
        },
        accent: {
          DEFAULT: themeColor("--accent"),
          soft: themeColor("--accent-soft"),
          strong: themeColor("--accent-strong"),
          dim: themeColor("--accent-dim")
        },
        signal: {
          amber: themeColor("--signal-amber"),
          rose: themeColor("--signal-rose"),
          violet: themeColor("--signal-violet"),
          blue: themeColor("--signal-blue")
        }
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"]
      },
      boxShadow: {
        panel: "0 1px 2px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.03)",
        card: "0 1px 2px rgba(0,0,0,0.3), 0 8px 24px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.03)",
        modal: "0 24px 64px -16px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05)",
        glow: "0 0 0 1px rgb(var(--accent) / 0.4), 0 8px 32px -8px rgb(var(--accent) / 0.35)",
        "glow-sm": "0 0 0 1px rgb(var(--accent) / 0.35), 0 4px 16px -6px rgb(var(--accent) / 0.3)"
      },
      keyframes: {
        fadeIn: {
          from: { opacity: "0" },
          to: { opacity: "1" }
        },
        scaleIn: {
          from: { opacity: "0", transform: "scale(0.96) translateY(4px)" },
          to: { opacity: "1", transform: "scale(1) translateY(0)" }
        },
        slideUp: {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        slideDown: {
          from: { opacity: "0", transform: "translateY(-6px)" },
          to: { opacity: "1", transform: "translateY(0)" }
        },
        shimmer: {
          from: { backgroundPosition: "200% 0" },
          to: { backgroundPosition: "-200% 0" }
        },
        pulseGlow: {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.55" }
        }
      },
      animation: {
        "fade-in": "fadeIn 0.2s ease-out both",
        "scale-in": "scaleIn 0.18s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-up": "slideUp 0.28s cubic-bezier(0.16, 1, 0.3, 1) both",
        "slide-down": "slideDown 0.18s ease-out both",
        shimmer: "shimmer 2.5s linear infinite",
        "pulse-glow": "pulseGlow 2s ease-in-out infinite"
      },
      backgroundImage: {
        "grid-fade": "radial-gradient(circle at 1px 1px, rgb(var(--base-700) / 0.35) 1px, transparent 0)",
        shimmer: "linear-gradient(90deg, transparent, rgb(var(--base-100) / 0.06), transparent)"
      }
    }
  },
  plugins: []
};
