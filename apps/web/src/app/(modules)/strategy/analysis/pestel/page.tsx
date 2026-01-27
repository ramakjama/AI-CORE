'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PESTELPage() {
  return (
    <PageTemplate
      title="PESTEL"
      subtitle="Gestión de pestel"
      icon="🌍"
      module="Análisis"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Analysis', path: '/strategy/analysis' },
        { label: 'PESTEL' }
      ]}
    />
  );
}
