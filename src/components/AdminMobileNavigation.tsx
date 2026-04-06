import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, FileText, Mail, Star, Eye } from 'lucide-react';

interface AdminMobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminTabs = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'content-management', label: 'Content Management', icon: FileText },
  { value: 'contact-management', label: 'Contact Management', icon: Mail },
  { value: 'email-test', label: 'Email System', icon: Mail },
  { value: 'analytics', label: 'Analytics', icon: BarChart3 },
  { value: 'review-management', label: 'Review Management', icon: Star },
  { value: 'preview', label: 'Preview', icon: Eye },
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
