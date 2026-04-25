import React, { Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { FaviconUpdater } from "@/components/FaviconUpdater";
import PreloadBrandingAssets from "@/components/PreloadBrandingAssets";
import ScrollToTop from "@/components/ScrollToTop";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

// Eager load Index for fast initial render
import Index from "./pages/Index";

// Lazy load all other pages
const Auth = React.lazy(() => import("./pages/Auth"));
const AdminPanel = React.lazy(() => import("./pages/AdminPanel"));
const Library = React.lazy(() => import("./pages/Library"));
const Guides = React.lazy(() => import("./pages/Guides"));
const PaymentSuccess = React.lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancelled = React.lazy(() => import("./pages/PaymentCancelled"));
const guideDetailImport = () => import("./pages/GuideDetail");
const GuideDetail = React.lazy(guideDetailImport);
const AudioAccess = React.lazy(() => import("./pages/AudioAccess"));

const Countries = React.lazy(() => import("./pages/Countries"));
const CountryDetail = React.lazy(() => import("./pages/CountryDetail"));
const FeaturedGuides = React.lazy(() => import("./pages/FeaturedGuides"));
const NotFound = React.lazy(() => import("./pages/NotFound"));

// Preload all lazy chunks IMMEDIATELY so navigations are instant — no
// "loading from scratch" flash between pages. We fire these in the next tick
// so they don't block initial paint, but we don't wait for idle time.
if (typeof window !== 'undefined') {
  const preloadAll = () => {
    guideDetailImport();
    import("./pages/Guides");
    import("./pages/Library");
    import("./pages/Auth");
    import("./pages/Countries");
    import("./pages/CountryDetail");
    import("./pages/FeaturedGuides");
    import("./pages/AudioAccess");
    import("./pages/PaymentSuccess");
    import("./pages/PaymentCancelled");
  };
  // Kick off after first paint but without waiting for idle.
  setTimeout(preloadAll, 0);
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

// Invisible fallback. Routes are preloaded at boot, so this is rarely shown.
// Keeping it transparent prevents jarring "white flash" if a chunk is still in-flight.
const PageLoader = () => <div aria-hidden className="min-h-[40vh]" />;

const App = () => {
  try {
    return (
      <QueryClientProvider client={queryClient}>
        <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
          <BrandingProvider>
            <AuthProvider>
              <TooltipProvider>
                <FaviconUpdater />
                <PreloadBrandingAssets />
                <PerformanceMonitor />
                <Toaster />
                <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
                  <ScrollToTop />
                  <main id="main-content">
                    <Suspense fallback={<PageLoader />}>
                      <Routes>
                        <Route path="/" element={<Index />} />
                        <Route path="/admin-login" element={<Auth />} />
                        <Route path="/admin" element={<AdminPanel />} />
                        <Route path="/library" element={<Library />} />
                        <Route path="/guides" element={<Guides />} />
                        <Route path="/country" element={<Countries />} />
                        <Route path="/country/:countrySlug" element={<CountryDetail />} />
                        <Route path="/featured-guides" element={<FeaturedGuides />} />
                        <Route path="/guide/:slug" element={<GuideDetail />} />
                        <Route path="/access/:guideId" element={<AudioAccess />} />
                        
                        <Route path="/payment-success" element={<PaymentSuccess />} />
                        <Route path="/payment-cancelled" element={<PaymentCancelled />} />
                        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                        <Route path="*" element={<NotFound />} />
                      </Routes>
                    </Suspense>
                  </main>
                </BrowserRouter>
              </TooltipProvider>
            </AuthProvider>
          </BrandingProvider>
        </ThemeProvider>
      </QueryClientProvider>
    );
  } catch (error) {
    console.error('App render error:', error);
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Something went wrong</h1>
        <p>Please refresh the page</p>
        <pre>{error instanceof Error ? error.message : 'Unknown error'}</pre>
      </div>
    );
  }
};

export default App;
