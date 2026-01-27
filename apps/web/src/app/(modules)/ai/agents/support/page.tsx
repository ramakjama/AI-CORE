'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AtencinalClientePage() {
  return (
    <PageTemplate
      title="Atención al Cliente"
      subtitle="Gestión de atención al cliente"
      icon="🎧"
      module="Agentes IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Agents', path: '/ai/agents' },
        { label: 'Atención al Cliente' }
      ]}
    />
  );
}
