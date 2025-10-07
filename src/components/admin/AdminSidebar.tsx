import { BarChart3, FileText, Plus, Edit2, Mail, Star, Languages, Home, MapPin, Palette } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const menuItems = [
  {
    label: 'Overview',
    items: [
      { value: 'dashboard', label: 'Dashboard', icon: Home },
      { value: 'analytics', label: 'Analytics', icon: BarChart3 },
    ],
  },
  {
    label: 'Content',
    items: [
      { value: 'create-guide', label: 'Create Guide', icon: Plus },
      { value: 'content-management', label: 'Manage Guides', icon: FileText },
      { value: 'edit-guide', label: 'Edit Guide', icon: Edit2 },
      { value: 'destination-management', label: 'Destinations', icon: MapPin },
    ],
  },
  {
    label: 'Settings',
    items: [
      { value: 'review-management', label: 'Reviews', icon: Star },
      { value: 'contact-management', label: 'Contact Forms', icon: Mail },
      { value: 'language-management', label: 'Languages', icon: Languages },
      { value: 'branding', label: 'Branding', icon: Palette },
      { value: 'email-test', label: 'Email System', icon: Mail },
    ],
  },
];

export function AdminSidebar({ activeTab, onTabChange }: AdminSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar className={state === 'collapsed' ? 'w-16' : 'w-64'} collapsible="icon">
      <SidebarContent>
        {menuItems.map((group) => (
          <SidebarGroup key={group.label}>
            {state !== 'collapsed' && <SidebarGroupLabel>{group.label}</SidebarGroupLabel>}
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.value}>
                    <SidebarMenuButton
                      onClick={() => onTabChange(item.value)}
                      isActive={activeTab === item.value}
                      className={activeTab === item.value ? 'bg-primary/10 text-primary font-medium' : ''}
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== 'collapsed' && <span>{item.label}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
    </Sidebar>
  );
}
