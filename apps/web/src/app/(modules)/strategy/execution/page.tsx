'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EjecucinPage() {
  return (
    <PageTemplate
      title="Ejecución"
      subtitle="Gestión de ejecución"
      icon="🚀"
      module="Estrategia"
      breadcrumb={[
        { label: 'Strategy', path: '/strategy' },
        { label: 'Ejecución' }
      ]}
    />
  );
}
