'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompetenciaPage() {
  return (
    <PageTemplate
      title="Competencia"
      subtitle="Gestión de competencia"
      icon="🏆"
      module="Estrategia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Competencia' }
      ]}
    />
  );
}
