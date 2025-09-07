import React from 'react';
import { Navigation } from '@/components/Navigation';
import { LiveExperiencesList } from '@/components/LiveExperiencesList';

const Experiences = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Live Experiences</h1>
          <p className="text-muted-foreground">
            Join virtual tours, cooking classes, and cultural experiences with local creators
          </p>
        </div>

        <LiveExperiencesList />
      </div>
    </div>
  );
};

export default Experiences;