import React, { useState, useEffect } from 'react';
import { AdminReviewManagement } from '@/components/AdminReviewManagement';
import AdminLanguageManagement from '@/components/AdminLanguageManagement';
import { Navigation } from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { validateGuideForm, validatePrice, validateSections } from '@/utils/admin/validation';
import { showErrorToast, showGuideCreatedToast, showValidationErrorToast } from '@/utils/admin/toast';
import { AdminDashboard } from '@/components/AdminDashboard';
import { GuideManagement } from '@/components/GuideManagement';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminErrorBoundary } from '@/components/admin/AdminErrorBoundary';
import { KeyboardShortcutsHelp } from '@/components/admin/KeyboardShortcutsHelp';
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { AdminMobileNavigation } from '@/components/AdminMobileNavigation';
import { AdminGuideEditForm } from '@/components/AdminGuideEditForm';
import { AdminContactManagement } from '@/components/AdminContactManagement';
import { EnhancedEmailTesting } from '@/components/EnhancedEmailTesting';
import { AdminAnalyticsManager } from '@/components/AdminAnalyticsManager';
import { EnhancedLogoUploader } from '@/components/EnhancedLogoUploader';
import { AdminGuard } from '@/components/guards/AdminGuard';
import { useIsMobile } from '@/hooks/use-mobile';
import { GuideCreationWizard } from '@/components/admin/guide-wizard/GuideCreationWizard';
import { AdminDestinationManagement } from '@/components/AdminDestinationManagement';

const AdminPanel = () => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false);

  // Listen for tab change events from GuideManagement
  useEffect(() => {
    const handleTabChange = (event: CustomEvent) => {
      setActiveTab(event.detail);
    };

    window.addEventListener('admin-tab-change', handleTabChange as EventListener);
    return () => window.removeEventListener('admin-tab-change', handleTabChange as EventListener);
  }, []);

  // Keyboard shortcuts
  useKeyboardShortcuts([
    { key: 'n', meta: true, handler: () => setActiveTab('create-guide'), description: 'Create new guide' },
    { key: 'd', meta: true, handler: () => setActiveTab('dashboard'), description: 'Go to dashboard' },
    { key: 'a', meta: true, handler: () => setActiveTab('analytics'), description: 'Go to analytics' },
    { key: 'e', meta: true, handler: () => setActiveTab('edit-guide'), description: 'Edit guide' },
    { key: '?', meta: true, handler: () => setShowShortcutsHelp(true), description: 'Show shortcuts' },
  ]);

  const createGuide = async (submitData: any) => {
    try {
      const payload = {
        title: submitData.title.trim(),
        description: submitData.description?.trim() || `Explore ${submitData.title.trim()}`,
        location: `${submitData.city.trim()}, ${submitData.country.trim()}`,
        category: submitData.category.trim(),
        price_usd: submitData.price * 100,
        difficulty: submitData.difficulty || 'intermediate',
        languages: submitData.languages || ['English'],
        sections: submitData.sections || [],
        image_urls: submitData.image_urls || [],
        is_published: !submitData.is_hidden,
        is_featured: submitData.is_featured || false,
        generate_audio: true
      };

      const { data, error } = await supabase.functions.invoke('create-guide', {
        body: payload
      });

      if (error) throw error;
      if (!data?.guide) throw new Error('Invalid response from server');

      showGuideCreatedToast(submitData.is_hidden);
    } catch (error: any) {
      console.error('Error creating guide:', error);
      showErrorToast(error.message || 'Failed to create guide');
      throw error;
    }
  };

  return (
    <AdminGuard>
      <AdminErrorBoundary>
        <Navigation />
        
        {isMobile ? (
          <div className="min-h-screen bg-background">
            <div className="container mx-auto px-4 py-6 md:py-8 pb-safe">
              <div className="mb-6 md:mb-8">
                <h1 className="text-2xl md:text-3xl font-bold mb-2">Admin Panel</h1>
                <p className="text-muted-foreground text-sm md:text-base">Comprehensive platform management and content creation</p>
              </div>

              <AdminMobileNavigation activeTab={activeTab} onTabChange={setActiveTab} />

              <div className="mt-6">
                {activeTab === 'dashboard' && <AdminDashboard />}
                {activeTab === 'content-management' && (
                  <div className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
                    <GuideManagement />
                  </div>
                )}
                {activeTab === 'contact-management' && <AdminContactManagement />}
                {activeTab === 'email-test' && <EnhancedEmailTesting />}
                {activeTab === 'review-management' && (
                  <div className="space-y-6">
                    <h2 className="text-xl sm:text-2xl font-bold">Review Management</h2>
                    <AdminReviewManagement />
                  </div>
                )}
                {activeTab === 'analytics' && <AdminAnalyticsManager />}
                {activeTab === 'create-guide' && (
                  <GuideCreationWizard
                    onSuccess={() => setActiveTab('content-management')}
                    onCancel={() => setActiveTab('dashboard')}
                    onSubmit={createGuide}
                  />
                )}
                {activeTab === 'edit-guide' && <AdminGuideEditForm onBack={() => setActiveTab('content-management')} />}
                {activeTab === 'language-management' && <AdminLanguageManagement />}
                {activeTab === 'branding' && <EnhancedLogoUploader />}
                {activeTab === 'destination-management' && <AdminDestinationManagement />}
              </div>
            </div>
          </div>
        ) : (
          <AdminLayout activeTab={activeTab} onTabChange={setActiveTab}>
            {activeTab === 'dashboard' && <AdminDashboard />}
            {activeTab === 'content-management' && (
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Content Management</h2>
                <GuideManagement />
              </div>
            )}
            {activeTab === 'contact-management' && <AdminContactManagement />}
            {activeTab === 'email-test' && <EnhancedEmailTesting />}
            {activeTab === 'review-management' && (
              <div className="space-y-6">
                <h2 className="text-xl sm:text-2xl font-bold">Review Management</h2>
                <AdminReviewManagement />
              </div>
            )}
            {activeTab === 'analytics' && <AdminAnalyticsManager />}
            {activeTab === 'create-guide' && (
              <GuideCreationWizard
                onSuccess={(guide) => {
                  setActiveTab('content-management');
                }}
                onCancel={() => setActiveTab('dashboard')}
                onSubmit={createGuide}
              />
            )}
            {activeTab === 'edit-guide' && <AdminGuideEditForm onBack={() => setActiveTab('content-management')} />}
            {activeTab === 'language-management' && <AdminLanguageManagement />}
            {activeTab === 'branding' && <EnhancedLogoUploader />}
            {activeTab === 'destination-management' && <AdminDestinationManagement />}
          </AdminLayout>
        )}

        <KeyboardShortcutsHelp open={showShortcutsHelp} onOpenChange={setShowShortcutsHelp} />
      </AdminErrorBoundary>
    </AdminGuard>
  );
};

export default AdminPanel;