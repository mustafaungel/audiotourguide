import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
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
import CreatorDashboard from "./pages/CreatorDashboard";
import CreatorProfile from "./pages/CreatorProfile";
import Creators from "./pages/Creators";
import UserProfile from "./pages/UserProfile";
import Experiences from "./pages/Experiences";
import UnescoSites from "./pages/UnescoSites";
import GuideDetail from "./pages/GuideDetail";
import DestinationDetail from "./pages/DestinationDetail";
import ExperienceDetail from "./pages/ExperienceDetail";
import BookingFlow from "./pages/BookingFlow";
import Category from "./pages/Category";
import Community from "./pages/Community";
import Dashboard from "./pages/Dashboard";
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
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/admin" element={<AdminPanel />} />
              <Route path="/library" element={<Library />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/creator-dashboard" element={<CreatorDashboard />} />
              <Route path="/creators" element={<Creators />} />
              <Route path="/creator/:creatorId" element={<CreatorProfile />} />
              <Route path="/user/:userId" element={<UserProfile />} />
              <Route path="/experiences" element={<Experiences />} />
              <Route path="/unesco-sites" element={<UnescoSites />} />
              <Route path="/guide/:guideId" element={<GuideDetail />} />
              <Route path="/destination/:location" element={<DestinationDetail />} />
              <Route path="/search" element={<Search />} />
              <Route path="/experience/:experienceId" element={<ExperienceDetail />} />
              <Route path="/booking/:experienceId" element={<BookingFlow />} />
              <Route path="/category/:categoryType" element={<Category />} />
              <Route path="/community" element={<Community />} />
              <Route path="/dashboard" element={<Dashboard />} />
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
