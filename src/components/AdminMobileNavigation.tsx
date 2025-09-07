import React from 'react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart3, Users, UserCheck, FileText, Wand2, Plus, Settings, Volume2 } from 'lucide-react';

interface AdminMobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminTabs = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'user-management', label: 'User Management', icon: Users },
  { value: 'creator-management', label: 'Creator Management', icon: UserCheck },
  { value: 'content-management', label: 'Content Management', icon: FileText },
  { value: 'ai-tools', label: 'AI Tools', icon: Wand2 },
  { value: 'create-guide', label: 'Create Guide', icon: Plus },
  { value: 'analytics', label: 'Analytics', icon: Settings },
  { value: 'audio-setup', label: 'Audio Setup', icon: Volume2 },
];

export function AdminMobileNavigation({ activeTab, onTabChange }: AdminMobileNavigationProps) {
  const activeTabData = adminTabs.find(tab => tab.value === activeTab);

  return (
    <div className="md:hidden mb-6">
      <Select value={activeTab} onValueChange={onTabChange}>
        <SelectTrigger className="w-full h-12">
          <SelectValue>
            {activeTabData && (
              <div className="flex items-center gap-2">
                <activeTabData.icon className="h-4 w-4" />
                <span>{activeTabData.label}</span>
              </div>
            )}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {adminTabs.map((tab) => (
            <SelectItem key={tab.value} value={tab.value}>
              <div className="flex items-center gap-2">
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}