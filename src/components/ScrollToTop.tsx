import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";
import { readScrollPosition } from "@/lib/scroll-memory";

// Map paths that have their own scroll-restore logic.
const PATH_SCROLL_KEYS: { test: (p: string) => boolean; key: string }[] = [
  { test: (p) => p === "/guides" || p.startsWith("/guides?") || p.startsWith("/guides#"), key: "guides-list" },
];

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
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
