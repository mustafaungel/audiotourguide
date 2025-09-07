import React from 'react';
import { Navigation } from '@/components/Navigation';
import { CreatorDashboard as CreatorDashboardComponent } from '@/components/CreatorDashboard';
import { useAuth } from '@/contexts/AuthContext';

const CreatorDashboard = () => {
  const { user, userProfile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to access your creator dashboard.</p>
        </div>
      </div>
    );
  }

  // For demo purposes, allow access to creator dashboard for testing
  // In production, you'd want stricter role checking

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Creator Dashboard</h1>
          <p className="text-muted-foreground">Manage your audio guides and track performance</p>
        </div>

        <CreatorDashboardComponent />
      </div>
    </div>
  );
};

export default CreatorDashboard;