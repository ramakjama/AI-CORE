'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AnalyticsPage() {
  return (
    <PageTemplate
      title="Analytics"
      subtitle="Gestión de analytics"
      icon="📈"
      module="SEO"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Seo', path: '/marketing/seo' },
        { label: 'Analytics' }
      ]}
    />
  );
}
