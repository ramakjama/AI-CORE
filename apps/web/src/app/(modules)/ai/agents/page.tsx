'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AgentesIAPage() {
  return (
    <PageTemplate
      title="Agentes IA"
      subtitle="Gestión de agentes ia"
      icon="🤖"
      module="IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Agentes IA' }
      ]}
    />
  );
}
