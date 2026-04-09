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

    // Cleanup all observers on unmount
    return () => {
      observers.forEach((observer) => observer.disconnect());
    };
  }, []);

  return null;
}
