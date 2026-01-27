'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EvolucinPage() {
  return (
    <PageTemplate
      title="Evolución"
      subtitle="Gestión de evolución"
      icon="📊"
      module="Cartera"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Portfolio', path: '/operations/portfolio' },
        { label: 'Evolución' }
      ]}
    />
  );
}
