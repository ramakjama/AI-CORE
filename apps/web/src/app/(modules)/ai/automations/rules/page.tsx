'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ReglasdeNegocioPage() {
  return (
    <PageTemplate
      title="Reglas de Negocio"
      subtitle="Gestión de reglas de negocio"
      icon="📏"
      module="Automatizaciones"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Automations', path: '/ai/automations' },
        { label: 'Reglas de Negocio' }
      ]}
    />
  );
}
