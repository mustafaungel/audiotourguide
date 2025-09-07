import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Navigation } from '@/components/Navigation';
import { EnhancedCreatorVerificationForm } from '@/components/EnhancedCreatorVerificationForm';
import { CreatorPrivacySettings } from '@/components/CreatorPrivacySettings';
import { EnhancedProfile } from '@/components/EnhancedProfile';

const Profile = () => {
  const { user, userProfile } = useAuth();

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Access Denied</h1>
          <p className="text-muted-foreground">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }


  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <EnhancedProfile showAdminFeatures={userProfile?.role === 'admin'} />

          {/* Creator Verification Section */}
          {userProfile?.role === 'traveler' && (
            <EnhancedCreatorVerificationForm userProfile={userProfile} />
          )}

          {/* Creator Privacy Settings */}
          {userProfile?.role === 'content_creator' && (
            <CreatorPrivacySettings />
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;