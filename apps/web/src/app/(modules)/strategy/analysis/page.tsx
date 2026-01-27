'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AnlisisEstratgicoPage() {
  return (
    <PageTemplate
      title="Análisis Estratégico"
      subtitle="Gestión de análisis estratégico"
      icon="🎯"
      module="Estrategia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Análisis Estratégico' }
      ]}
    />
  );
}
