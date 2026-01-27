'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function GoogleAdsPage() {
  return (
    <PageTemplate
      title="Google Ads"
      subtitle="Gestión de google ads"
      icon="💰"
      module="SEO"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Seo', path: '/marketing/seo' },
        { label: 'Google Ads' }
      ]}
    />
  );
}
