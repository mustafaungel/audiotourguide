import React from 'react';
import { SegmentedControl, SegmentItem } from '@/components/ui/segmented-control';
import { BarChart3, FileText } from 'lucide-react';

interface AdminMobileNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const adminSegments: SegmentItem[] = [
  { value: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { value: 'content-management', label: 'Content', icon: FileText },
];

export function AdminMobileNavigation({ activeTab, onTabChange }: AdminMobileNavigationProps) {
  return (
    <div className="md:hidden flex justify-center mb-6 pb-safe">
      <SegmentedControl
        items={adminSegments}
        value={activeTab}
        onValueChange={onTabChange}
        className="w-full max-w-sm"
      />
    </div>
  );
}
