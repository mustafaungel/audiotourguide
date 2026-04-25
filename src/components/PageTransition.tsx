import React, { Suspense, useEffect, useRef, useState } from "react";
import { useLocation, useNavigationType, type Location } from "react-router-dom";

const TRANSITION_MS = 420;

/**
 * Native app-like page transition wrapper.
 * - PUSH: new page slides in from the right
 * - POP (back): outgoing page slides out to the right (revealing previous)
 * - REPLACE / initial: no animation
 *
 * Two key tricks for "feels like an app, not a website":
 *  1) The outgoing page stays mounted during the transition, so when the new
 *     page is lazy-loaded we keep the old UI visible instead of flashing a
 *     loader. The incoming Suspense fallback is only used for the very first
 *     load of a chunk, and even then it's transparent.
 *  2) Only GPU-friendly transform + opacity animate.
 */
export const PageTransition: React.FC<{ children: React.ReactNode; fallback: React.ReactNode }> = ({ children, fallback }) => {
  const location = useLocation();
  const navType = useNavigationType(); // 'PUSH' | 'POP' | 'REPLACE'

  const [displayed, setDisplayed] = useState({ location, key: location.key });
  const [outgoing, setOutgoing] = useState<{ location: Location; key: string; direction: "push" | "pop" } | null>(null);
  const lastKeyRef = useRef(location.key);
  const prefersReducedMotion = useRef<boolean>(false);

  const renderAtLocation = (targetLocation: Location) => {
    if (!React.isValidElement(children)) return children;

    return React.cloneElement(children as React.ReactElement<{ location?: Location }>, {
      location: targetLocation,
    });
  };

  useEffect(() => {
    prefersReducedMotion.current = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
  }, []);

  useEffect(() => {
    if (location.key === lastKeyRef.current) {
      setDisplayed({ location, key: location.key });
      return;
    }

    if (navType === "REPLACE" || prefersReducedMotion.current) {
      setDisplayed({ location, key: location.key });
      lastKeyRef.current = location.key;
      return;
    }

    setOutgoing({ location: displayed.location, key: displayed.key, direction: navType === "POP" ? "pop" : "push" });
    setDisplayed({ location, key: location.key });
    lastKeyRef.current = location.key;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key, children]);

  useEffect(() => {
    if (!outgoing) return;
    const t = window.setTimeout(() => setOutgoing(null), TRANSITION_MS + 20);
    return () => window.clearTimeout(t);
  }, [outgoing]);

  return (
    <div className="page-transition-root">
      {outgoing && (
        <div
          key={`out-${outgoing.key}`}
          className={outgoing.direction === "pop" ? "page-transition-leave-pop" : "page-transition-leave-push"}
          aria-hidden
        >
          {renderAtLocation(outgoing.location)}
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
      >
        {/* Suspense INSIDE so the outgoing page stays visible while the new chunk loads */}
        <Suspense fallback={fallback}>{renderAtLocation(displayed.location)}</Suspense>
      </div>
    </div>
  );
};

export default PageTransition;
