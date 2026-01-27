'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompetenciaRegionalPage() {
  return (
    <PageTemplate
      title="Competencia Regional"
      subtitle="Gestión de competencia regional"
      icon="🗺️"
      module="Competencia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Competition', path: '/strategy/competition' },
        { label: 'Competencia Regional' }
      ]}
    />
  );
}
