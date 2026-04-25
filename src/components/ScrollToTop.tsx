import { useEffect, useRef } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { readScrollPosition } from "@/lib/scroll-memory";

// KeepAlive tab paths — scroll position is preserved when switching between these.
const KEEP_ALIVE_TABS = new Set<string>(["/", "/guides", "/library", "/country"]);

// Map paths that have their own scroll-restore logic.
const PATH_SCROLL_KEYS: { test: (p: string) => boolean; key: string }[] = [
  { test: (p) => p === "/guides" || p.startsWith("/guides?") || p.startsWith("/guides#"), key: "guides-list" },
];

// In-memory scroll cache per KeepAlive tab path.
const tabScrollCache = new Map<string, number>();

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();
  const prevPathRef = useRef<string>(pathname);

  useEffect(() => {
    const prevPath = prevPathRef.current;

    // Save scroll position for the tab we're leaving.
    if (KEEP_ALIVE_TABS.has(prevPath) && prevPath !== pathname) {
      tabScrollCache.set(prevPath, window.scrollY);
    }
    prevPathRef.current = pathname;

    // Restore scroll for KeepAlive tabs.
    // If we're already at (or very near) the saved position, do nothing — avoids snap.
    // Otherwise, smooth-scroll to it so the transition feels natural instead of jumping.
    if (KEEP_ALIVE_TABS.has(pathname)) {
      const saved = tabScrollCache.get(pathname) ?? 0;
      const current = window.scrollY;
      const delta = Math.abs(current - saved);

      if (delta < 4) return; // already there, no work needed

      // For very small offsets (under ~80px) just snap — smooth would feel laggy.
      // For larger offsets, smooth scroll so the user sees where they're going.
      const behavior: ScrollBehavior = delta < 80 ? "instant" as ScrollBehavior : "smooth";
      requestAnimationFrame(() => {
        window.scrollTo({ top: saved, left: 0, behavior });
      });
      return;
    }

    if (navigationType === "POP") return;

    // Skip top-scroll if this route has a saved scroll position to restore.
    const match = PATH_SCROLL_KEYS.find((entry) => entry.test(pathname));
    if (match && readScrollPosition(match.key)) return;

    requestAnimationFrame(() => {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    });
  }, [pathname, navigationType]);

  return null;
};

export default ScrollToTop;
