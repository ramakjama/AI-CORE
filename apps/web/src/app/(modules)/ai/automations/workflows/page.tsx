'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function WorkflowsPage() {
  return (
    <PageTemplate
      title="Workflows"
      subtitle="Gestión de workflows"
      icon="🔄"
      module="Automatizaciones"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Automations', path: '/ai/automations' },
        { label: 'Workflows' }
      ]}
    />
  );
}
