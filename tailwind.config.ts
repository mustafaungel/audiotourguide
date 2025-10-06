import type { Config } from "tailwindcss";

export default {
  darkMode: ["class"],
  content: ["./pages/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}", "./app/**/*.{ts,tsx}", "./src/**/*.{ts,tsx}"],
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
      screens: {
        'xs': '375px',
        'mobile-safe': '390px',
        'touch': '768px',
      },
      aspectRatio: {
        '9/16': '9 / 16',
        'mobile': '9 / 16',
        'portrait': '3 / 4',
      },
      spacing: {
        'touch': '44px',
        'touch-sm': '32px',
        'mobile-safe': '20px',
        'mobile-padding': '16px',
      },
      minHeight: {
        'touch': '44px',
        'touch-lg': '56px',
        'mobile-safe': '100dvh',
      },
      minWidth: {
        'touch': '44px',
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
        playfair: ['Playfair Display', 'serif'],
      },
      fontSize: {
        'mobile-xs': ['0.75rem', { lineHeight: '1.5' }],
        'mobile-sm': ['0.875rem', { lineHeight: '1.5' }],
        'mobile-base': ['1rem', { lineHeight: '1.6' }],
        'mobile-lg': ['1.125rem', { lineHeight: '1.6' }],
        'mobile-xl': ['1.25rem', { lineHeight: '1.5' }],
        'mobile-2xl': ['1.5rem', { lineHeight: '1.4' }],
        'mobile-3xl': ['1.875rem', { lineHeight: '1.3' }],
        'mobile-4xl': ['2.25rem', { lineHeight: '1.2' }],
      },
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
          glow: "hsl(var(--primary-glow))",
          hover: "hsl(var(--primary-hover))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
          hover: "hsl(var(--secondary-hover))",
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
          glow: "hsl(var(--accent-glow))",
          hover: "hsl(var(--accent-hover))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        success: {
          DEFAULT: "hsl(var(--success))",
          foreground: "hsl(var(--success-foreground))",
          hover: "hsl(var(--success-hover))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          foreground: "hsl(var(--warning-foreground))",
          hover: "hsl(var(--warning-hover))",
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
        tourism: {
          warm: "hsl(var(--tourism-warm))",
          earth: "hsl(var(--tourism-earth))",
          sky: "hsl(var(--tourism-sky))",
          sunset: "hsl(var(--tourism-sunset))",
          coral: "hsl(var(--tourism-coral))",
          terracotta: "hsl(var(--tourism-terracotta))",
          mediterranean: "hsl(var(--tourism-mediterranean))",
          sage: "hsl(var(--tourism-sage))",
        },
        audio: {
          primary: "hsl(var(--audio-primary))",
          waveform: "hsl(var(--audio-waveform))",
          progress: "hsl(var(--audio-progress))",
          background: "hsl(var(--audio-background))",
          secondary: "hsl(var(--audio-secondary))",
        },
      },
      backgroundImage: {
        "gradient-hero": "var(--gradient-hero)",
        "gradient-primary": "var(--gradient-primary)",
        "gradient-accent": "var(--gradient-accent)",
        "gradient-card": "var(--gradient-card)",
        "gradient-tourism": "var(--gradient-tourism)",
        "gradient-sunset": "var(--gradient-sunset)",
        "gradient-ocean": "var(--gradient-ocean)",
        "gradient-earth": "var(--gradient-earth)",
        "gradient-overlay": "var(--gradient-overlay)",
      },
      boxShadow: {
        glow: "var(--shadow-glow)",
        "accent-glow": "var(--shadow-accent-glow)",
        card: "var(--shadow-card)",
        tourism: "var(--shadow-tourism)",
        elegant: "var(--shadow-elegant)",
        elevated: "var(--shadow-elevated)",
        interactive: "var(--shadow-interactive)",
      },
      transitionTimingFunction: {
        smooth: "var(--transition-smooth)",
        bounce: "var(--transition-bounce)",
        spring: "var(--transition-spring)",
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: {
            height: "0",
          },
          to: {
            height: "var(--radix-accordion-content-height)",
          },
        },
        "accordion-up": {
          from: {
            height: "var(--radix-accordion-content-height)",
          },
          to: {
            height: "0",
          },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config;
