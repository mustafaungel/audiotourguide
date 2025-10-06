import { useEffect } from 'react';

interface PerformanceMetrics {
  LCP?: number;
  FID?: number;
  CLS?: number;
}

export function PerformanceMonitor() {
  useEffect(() => {
    // Only run in production and in browser
    if (typeof window === 'undefined' || import.meta.env.DEV) {
      return;
    }

    const metrics: PerformanceMetrics = {};

    // Measure Largest Contentful Paint (LCP)
    const observeLCP = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          metrics.LCP = lastEntry.startTime;
          
          console.log('📊 [Core Web Vitals] LCP:', metrics.LCP.toFixed(2), 'ms');
          
          // Warn if LCP > 2500ms
          if (metrics.LCP > 2500) {
            console.warn('⚠️ [Performance] LCP is slow. Target: < 2500ms');
          }
        });

        observer.observe({ type: 'largest-contentful-paint', buffered: true });
      } catch (e) {
        console.log('LCP not supported');
      }
    };

    // Measure First Input Delay (FID)
    const observeFID = () => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            metrics.FID = entry.processingStart - entry.startTime;
            console.log('📊 [Core Web Vitals] FID:', metrics.FID.toFixed(2), 'ms');
            
            // Warn if FID > 100ms
            if (metrics.FID > 100) {
              console.warn('⚠️ [Performance] FID is high. Target: < 100ms');
            }
          });
        });

        observer.observe({ type: 'first-input', buffered: true });
      } catch (e) {
        console.log('FID not supported');
      }
    };

    // Measure Cumulative Layout Shift (CLS)
    const observeCLS = () => {
      try {
        let clsValue = 0;
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry: any) => {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          });
          
          metrics.CLS = clsValue;
          console.log('📊 [Core Web Vitals] CLS:', metrics.CLS.toFixed(3));
          
          // Warn if CLS > 0.1
          if (metrics.CLS > 0.1) {
            console.warn('⚠️ [Performance] CLS is high. Target: < 0.1');
          }
        });

        observer.observe({ type: 'layout-shift', buffered: true });
      } catch (e) {
        console.log('CLS not supported');
      }
    };

    // Initialize observers
    observeLCP();
    observeFID();
    observeCLS();

    // Log overall performance after page load
    window.addEventListener('load', () => {
      setTimeout(() => {
        console.log('📊 [Performance Summary]', {
          LCP: metrics.LCP ? `${metrics.LCP.toFixed(2)}ms` : 'N/A',
          FID: metrics.FID ? `${metrics.FID.toFixed(2)}ms` : 'N/A',
          CLS: metrics.CLS ? metrics.CLS.toFixed(3) : 'N/A'
        });

        // Calculate performance score (0-100)
        let score = 100;
        if (metrics.LCP && metrics.LCP > 2500) score -= 30;
        if (metrics.FID && metrics.FID > 100) score -= 30;
        if (metrics.CLS && metrics.CLS > 0.1) score -= 40;

        console.log('📊 [Performance Score]', `${Math.max(0, score)}/100`);
      }, 5000); // Wait 5s for all metrics to settle
    });

  }, []);

  return null; // This component doesn't render anything
}
