'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TestABPage() {
  return (
    <PageTemplate
      title="Test A/B"
      subtitle="Gestión de test a/b"
      icon="🔬"
      module="Landing Pages"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Landing', path: '/marketing/landing' },
        { label: 'Test A/B' }
      ]}
    />
  );
}
