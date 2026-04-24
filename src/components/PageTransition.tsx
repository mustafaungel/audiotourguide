import React, { useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

/**
 * Native app-like page transition wrapper.
 * - PUSH: new page slides in from the right
 * - POP (back): page slides out to the right (so the underlying previous page feels revealed)
 * - REPLACE / initial: no animation
 *
 * Implementation: cross-fade + slide using GPU-accelerated transform/opacity only.
 * We render the previous tree alongside the new tree for one frame so the outgoing
 * page can animate out without layout shift.
 */
export const PageTransition: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const navType = useNavigationType(); // 'PUSH' | 'POP' | 'REPLACE'

  // Keep current displayed tree + key, plus an outgoing snapshot during transition.
  const [displayed, setDisplayed] = useState({ children, key: location.key });
  const [outgoing, setOutgoing] = useState<{ children: React.ReactNode; key: string; direction: "push" | "pop" } | null>(null);
  const lastKeyRef = useRef(location.key);
  const prefersReducedMotion = useRef<boolean>(false);

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  useEffect(() => {
    if (location.key === lastKeyRef.current) {
      // Same location — just refresh children (e.g. state update, not a navigation)
      setDisplayed({ children, key: location.key });
      return;
    }

    // Skip animation on REPLACE or reduced motion.
    if (navType === "REPLACE" || prefersReducedMotion.current) {
      setDisplayed({ children, key: location.key });
      lastKeyRef.current = location.key;
      return;
    }

    // Snapshot outgoing page, then immediately swap to incoming page.
    setOutgoing({ children: displayed.children, key: displayed.key, direction: navType === "POP" ? "pop" : "push" });
    setDisplayed({ children, key: location.key });
    lastKeyRef.current = location.key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, children]);

  // Clear outgoing after the animation finishes.
  useEffect(() => {
    if (!outgoing) return;
    const t = window.setTimeout(() => setOutgoing(null), 320);
    return () => window.clearTimeout(t);
  }, [outgoing]);

  return (
    <div className="page-transition-root" style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden' }}>
      {outgoing && (
        <div
          key={`out-${outgoing.key}`}
          className={outgoing.direction === "pop" ? "page-transition-leave-pop" : "page-transition-leave-push"}
          style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', zIndex: 1 }}
          aria-hidden
        >
          {outgoing.children}
        </div>
      )}
      <div
        key={`in-${displayed.key}`}
        className={
          outgoing
            ? outgoing.direction === "pop"
              ? "page-transition-enter-pop"
              : "page-transition-enter-push"
            : undefined
        }
        style={{ position: 'relative', zIndex: 2 }}
      >
        {displayed.children}
      </div>
    </div>
  );
};

export default PageTransition;
