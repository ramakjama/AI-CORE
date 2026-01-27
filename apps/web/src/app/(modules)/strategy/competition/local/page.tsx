'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompetenciaLocalPage() {
  return (
    <PageTemplate
      title="Competencia Local"
      subtitle="Gestión de competencia local"
      icon="📍"
      module="Competencia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Competition', path: '/strategy/competition' },
        { label: 'Competencia Local' }
      ]}
    />
  );
}
