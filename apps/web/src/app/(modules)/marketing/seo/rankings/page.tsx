'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RankingsPage() {
  return (
    <PageTemplate
      title="Rankings"
      subtitle="Gestión de rankings"
      icon="📊"
      module="SEO"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Seo', path: '/marketing/seo' },
        { label: 'Rankings' }
      ]}
    />
  );
}
