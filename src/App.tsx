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
import PageTransition from "@/components/PageTransition";

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

// Preload GuideDetail chunk after initial render
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(() => { guideDetailImport(); }, 1000);
  });
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const AudioGuideLoaderLazy = React.lazy(() => import("@/components/AudioGuideLoader").then(m => ({ default: m.AudioGuideLoader })));

// Lightweight, transparent loader used when a brand-new lazy chunk needs to load.
// Most navigations show no loader at all because the outgoing page stays visible
// during the page transition (see PageTransition).
const PageLoader = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <div className="flex items-center justify-center gap-[3px]">
      {[0, 1, 2, 3, 4].map((i) => (
        <span key={i} className="w-1 rounded-full bg-primary audio-wave-bar" style={{ animationDelay: `${i * 0.12}s` }} />
      ))}
    </div>
  </div>
);

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
                    <PageTransition fallback={<PageLoader />}>
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
                    </PageTransition>
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
