import { lazy, Suspense } from "react";
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

const App = () => (
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

export default App;
