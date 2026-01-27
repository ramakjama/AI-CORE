'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompetenciaOnlinePage() {
  return (
    <PageTemplate
      title="Competencia Online"
      subtitle="Gestión de competencia online"
      icon="🌐"
      module="Competencia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Competition', path: '/strategy/competition' },
        { label: 'Competencia Online' }
      ]}
    />
  );
}
