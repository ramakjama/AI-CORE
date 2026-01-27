'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AutomatizacionesPage() {
  return (
    <PageTemplate
      title="Automatizaciones"
      subtitle="Gestión de automatizaciones"
      icon="⚡"
      module="IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Automatizaciones' }
      ]}
    />
  );
}
