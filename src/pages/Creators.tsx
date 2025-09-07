import React from 'react';
import { Navigation } from '@/components/Navigation';
import { EnhancedCreatorDiscovery } from '@/components/EnhancedCreatorDiscovery';

const Creators = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover Creators</h1>
          <p className="text-muted-foreground">
            Find and connect with verified cultural guides and local experts from around the world
          </p>
        </div>

        <EnhancedCreatorDiscovery />
      </div>
    </div>
  );
};

export default Creators;