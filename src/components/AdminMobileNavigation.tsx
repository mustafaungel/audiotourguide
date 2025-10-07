import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, FileText, Plus, Edit2, Mail, Palette, Star, Languages } from 'lucide-react';

interface AdminMobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminTabs = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'create-guide', label: 'Create Guide', icon: Plus },
  { value: 'content-management', label: 'Manage Guides', icon: FileText },
  { value: 'edit-guide', label: 'Edit Guide', icon: Edit2 },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'review-management', label: 'Reviews', icon: Star },
  { value: 'contact-management', label: 'Contact Forms', icon: Mail },
  { value: 'language-management', label: 'Languages', icon: Languages },
  { value: 'branding', label: 'Branding', icon: Palette },
  { value: 'email-test', label: 'Email System', icon: Mail },
];

export function AdminMobileNavigation({ activeTab, onTabChange }: AdminMobileNavigationProps) {
  const activeTabData = adminTabs.find(tab => tab.value === activeTab);

  return (
    <div className="md:hidden mb-6 pb-safe">
      <Select value={activeTab} onValueChange={onTabChange}>
        <SelectTrigger className="w-full h-12 bg-background/95 backdrop-blur-sm border-2">
          <SelectValue>
            {activeTabData && (
              <div className="flex items-center gap-2">
                <activeTabData.icon className="h-4 w-4" />
                <span className="font-medium">{activeTabData.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent className="bg-background/95 backdrop-blur-md border-2 z-50 max-h-[60vh] overflow-y-auto">
          {adminTabs.map((tab) => (
            <SelectItem key={tab.value} value={tab.value} className="py-3">
              <div className="flex items-center gap-3">
                <tab.icon className="h-4 w-4" />
                <span className="font-medium">{tab.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}