'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ConversionesPage() {
  return (
    <PageTemplate
      title="Conversiones"
      subtitle="Gestión de conversiones"
      icon="📈"
      module="Landing Pages"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Landing', path: '/marketing/landing' },
        { label: 'Conversiones' }
      ]}
    />
  );
}
