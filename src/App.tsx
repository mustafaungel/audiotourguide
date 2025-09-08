import React from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import AdminPanel from "./pages/AdminPanel";
import Library from "./pages/Library";
import PaymentSuccess from "./pages/PaymentSuccess";
import PaymentCancelled from "./pages/PaymentCancelled";
import Search from "./pages/Search";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import GuideDetail from "./pages/GuideDetail";
import DestinationDetail from "./pages/DestinationDetail";
import Category from "./pages/Category";
import AudioAccess from "./pages/AudioAccess";
import Contact from "./pages/Contact";
import Guides from "./pages/Guides";
import NotFound from "./pages/NotFound";


const queryClient = new QueryClient();

const App = () => {
  try {
    return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin-login" element={<Auth />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/guides" element={<Guides />} />
              <Route path="/library" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/guide/:guideId" element={<GuideDetail />} />
              <Route path="/destination/:location" element={<DestinationDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/category/:categoryType" element={<Category />} />
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
