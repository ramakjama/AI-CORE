'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CAMEPage() {
  return (
    <PageTemplate
      title="CAME"
      subtitle="Gestión de came"
      icon="🔄"
      module="Análisis"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Analysis', path: '/strategy/analysis' },
        { label: 'CAME' }
      ]}
    />
  );
}
