import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

interface AdminBreadcrumbsProps {
  activeTab: string;
}

const tabLabels: Record<string, string> = {
  dashboard: 'Dashboard',
  analytics: 'Analytics',
  'create-guide': 'Create Guide',
  'content-management': 'Manage Guides',
  'edit-guide': 'Edit Guide',
  'destination-management': 'Destinations',
  'review-management': 'Reviews',
  'contact-management': 'Contact Forms',
  'language-management': 'Languages',
  branding: 'Branding',
  'email-test': 'Email System',
};

export function AdminBreadcrumbs({ activeTab }: AdminBreadcrumbsProps) {
  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/admin">Admin Panel</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>{tabLabels[activeTab] || 'Dashboard'}</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>
  );
}
