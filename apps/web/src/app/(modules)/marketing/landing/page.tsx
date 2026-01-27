'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function LandingPagesPage() {
  return (
    <PageTemplate
      title="Landing Pages"
      subtitle="Gestión de landing pages"
      icon="🌐"
      module="Marketing"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Landing Pages' }
      ]}
    />
  );
}
