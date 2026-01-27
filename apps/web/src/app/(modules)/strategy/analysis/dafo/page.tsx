'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function DAFOSWOTPage() {
  return (
    <PageTemplate
      title="DAFO / SWOT"
      subtitle="Gestión de dafo / swot"
      icon="📊"
      module="Análisis"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Analysis', path: '/strategy/analysis' },
        { label: 'DAFO / SWOT' }
      ]}
    />
  );
}
