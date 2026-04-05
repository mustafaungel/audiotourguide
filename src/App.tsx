import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { FaviconUpdater } from "@/components/FaviconUpdater";
import PreloadBrandingAssets from "@/components/PreloadBrandingAssets";
import { PerformanceMonitor } from "@/components/PerformanceMonitor";

import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import Library from "./pages/Library";
import Guides from "./pages/Guides";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import GuideDetail from "./pages/GuideDetail";
import AudioAccess from "./pages/AudioAccess";
import Countries from "./pages/Countries";
import CountryDetail from "./pages/CountryDetail";
import FeaturedGuides from "./pages/FeaturedGuides";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => {
  // Aggressive cache-busting mechanism
  React.useEffect(() => {
    const storedBuild = localStorage.getItem('app_build');
    const currentUrl = window.location.href;
    const hasVersionParam = currentUrl.includes('v=');
    
    // Force reload if build changed OR no version in URL
    if (storedBuild !== APP_BUILD || !hasVersionParam) {
      console.log('[CACHE-BUST] Reloading for new build:', APP_BUILD);
      localStorage.setItem('app_build', APP_BUILD);
      sessionStorage.clear();
      
      // Add version + timestamp to URL to bypass all caching layers
      const separator = window.location.search ? '&' : '?';
      const timestamp = Date.now();
      const newUrl = `${window.location.pathname}${window.location.search}${separator}v=${APP_BUILD}&t=${timestamp}`;
      
      // Replace current page (no back button issues)
      window.location.replace(newUrl);
      return;
    }
  }, []);
  try {
    return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <FaviconUpdater />
          <PreloadBrandingAssets />
          <PerformanceMonitor />
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
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
            
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
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
