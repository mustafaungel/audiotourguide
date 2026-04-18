import { useEffect } from 'react';

interface PerformanceMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
}

export function PerformanceMonitor() {
  useEffect(() => {
    if (typeof window === 'undefined' || import.meta.env.DEV) {
      return;
    }

    const metrics: PerformanceMetrics = {};
    const observers: PerformanceObserver[] = [];

    const setup = () => {
      // Measure Largest Contentful Paint (LCP)
      try {
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.LCP = lastEntry.startTime;
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        observers.push(lcpObserver);
      } catch (_) { /* not supported */ }

      // Measure First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.FID = entry.processingStart - entry.startTime;
          });
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        observers.push(fidObserver);
      } catch (_) { /* not supported */ }

      // Measure Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          metrics.CLS = clsValue;
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        observers.push(clsObserver);
      } catch (_) { /* not supported */ }
    };

    // Defer to idle so we don't compete with critical rendering
    const ric = (window as any).requestIdleCallback as ((cb: () => void, opts?: { timeout: number }) => number) | undefined;
    const handle = ric
      ? ric(setup, { timeout: 2000 })
      : window.setTimeout(setup, 1);

    // Cleanup all observers on unmount
    return () => {
      observers.forEach((observer) => observer.disconnect());
      const cic = (window as any).cancelIdleCallback as ((h: number) => void) | undefined;
      if (ric && cic) cic(handle as number);
      else clearTimeout(handle as number);
    };
  }, []);

  return null;
}
