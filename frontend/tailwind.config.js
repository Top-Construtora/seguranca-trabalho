/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
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
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
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
        "fadeIn": {
          from: { opacity: "0", transform: "translateY(-10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "slideInRight": {
          from: { opacity: "0", transform: "translateX(20px)" },
          to: { opacity: "1", transform: "translateX(0)" },
        },
        "flipToFront": {
          "0%": {
            transform: "perspective(1200px) rotateY(0deg) translateZ(-50px) scale(0.95)",
            opacity: "0.7",
            zIndex: "1"
          },
          "50%": {
            transform: "perspective(1200px) rotateY(-90deg) translateZ(0px) scale(0.98)",
            opacity: "0.9",
            zIndex: "5"
          },
          "100%": {
            transform: "perspective(1200px) rotateY(0deg) translateZ(50px) scale(1)",
            opacity: "1",
            zIndex: "10"
          },
        },
        "flipToBack": {
          "0%": {
            transform: "perspective(1200px) rotateY(0deg) translateZ(50px) scale(1)",
            opacity: "1",
            zIndex: "10"
          },
          "50%": {
            transform: "perspective(1200px) rotateY(90deg) translateZ(0px) scale(0.98)",
            opacity: "0.9",
            zIndex: "5"
          },
          "100%": {
            transform: "perspective(1200px) rotateY(0deg) translateZ(-50px) scale(0.95)",
            opacity: "0.7",
            zIndex: "1"
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fadeIn": "fadeIn 0.5s ease-out",
        "slideInRight": "slideInRight 0.5s ease-out",
        "flipToFront": "flipToFront 0.8s ease-in-out forwards",
        "flipToBack": "flipToBack 0.8s ease-in-out forwards",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}