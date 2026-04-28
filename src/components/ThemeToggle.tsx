import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "next-themes";
import { haptics } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export const ThemeToggle = () => {
  const { resolvedTheme, setTheme } = useTheme();
  const isDark = resolvedTheme === "dark";

  const handleToggle = () => {
    haptics.light();
    setTheme(isDark ? "light" : "dark");
  };

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={handleToggle}
      className={cn(
        "relative inline-flex h-[26px] w-[48px] sm:h-[32px] sm:w-[60px] shrink-0 items-center rounded-full",
        "transition-all duration-500 ease-out will-change-transform transform-gpu",
        "hover:scale-105 active:scale-95",
        "shadow-[inset_0_1px_2px_rgba(0,0,0,0.15),0_2px_6px_rgba(0,0,0,0.1)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        isDark
          ? "bg-gradient-to-br from-indigo-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-amber-200 via-orange-200 to-sky-300"
      )}
    >
      {/* Stars (dark mode) */}
      <span
        className={cn(
          "pointer-events-none absolute inset-0 transition-opacity duration-500",
          isDark ? "opacity-70" : "opacity-0"
        )}
        aria-hidden="true"
      >
        <span className="absolute left-1.5 sm:left-2 top-1 sm:top-1.5 h-[2px] w-[2px] rounded-full bg-white" />
        <span className="absolute left-3 sm:left-3.5 top-2.5 sm:top-3 h-[1.5px] w-[1.5px] rounded-full bg-white/80" />
        <span className="absolute left-2 sm:left-2.5 top-4 sm:top-5 h-[1.5px] w-[1.5px] rounded-full bg-white/60" />
      </span>

      {/* Cloud (light mode) */}
      <span
        className={cn(
          "pointer-events-none absolute right-1 sm:right-1.5 top-1/2 -translate-y-1/2 transition-opacity duration-500",
          isDark ? "opacity-0" : "opacity-50"
        )}
        aria-hidden="true"
      >
        <svg width="12" height="8" viewBox="0 0 14 9" fill="none" xmlns="http://www.w3.org/2000/svg" className="sm:w-[14px] sm:h-[9px]">
          <path
            d="M11 5.5c0-1.66-1.34-3-3-3-1.3 0-2.4.83-2.82 2H5c-1.66 0-3 1.34-3 3 0 .55.45 1 1 1h8c.55 0 1-.45 1-1 0-.97-.46-1.83-1.18-2.38L11 5.5z"
            fill="white"
          />
        </svg>
      </span>

      {/* Knob */}
      <span
        className={cn(
          "relative z-10 flex h-[20px] w-[20px] sm:h-[26px] sm:w-[26px] items-center justify-center rounded-full bg-white",
          "shadow-[0_2px_6px_rgba(0,0,0,0.25),0_1px_2px_rgba(0,0,0,0.15)]",
          "transition-transform duration-300 ease-spring-soft will-change-transform transform-gpu",
          isDark ? "translate-x-[25px] sm:translate-x-[31px]" : "translate-x-[3px]"
        )}
      >
        <Sun
          className={cn(
            "absolute h-[11px] w-[11px] sm:h-[14px] sm:w-[14px] text-amber-500 transition-all duration-300",
            isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
          )}
        />
        <Moon
          className={cn(
            "absolute h-[11px] w-[11px] sm:h-[14px] sm:w-[14px] text-slate-700 transition-all duration-300",
            isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
          )}
        />
      </span>
    </button>
  );
};
