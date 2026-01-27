'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SEOSEMPage() {
  return (
    <PageTemplate
      title="SEO / SEM"
      subtitle="Gestión de seo / sem"
      icon="🔍"
      module="Marketing"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'SEO / SEM' }
      ]}
    />
  );
}
