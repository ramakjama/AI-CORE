'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProgramacionesPage() {
  return (
    <PageTemplate
      title="Programaciones"
      subtitle="Gestión de programaciones"
      icon="📅"
      module="Automatizaciones"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Automations', path: '/ai/automations' },
        { label: 'Programaciones' }
      ]}
    />
  );
}
