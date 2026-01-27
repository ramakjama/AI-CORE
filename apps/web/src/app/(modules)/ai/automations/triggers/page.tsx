'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function TriggersPage() {
  return (
    <PageTemplate
      title="Triggers"
      subtitle="Gestión de triggers"
      icon="🎯"
      module="Automatizaciones"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Automations', path: '/ai/automations' },
        { label: 'Triggers' }
      ]}
    />
  );
}
