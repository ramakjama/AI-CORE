'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ConfiguracinIAPage() {
  return (
    <PageTemplate
      title="Configuración IA"
      subtitle="Gestión de configuración ia"
      icon="⚙️"
      module="Agentes IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Agents', path: '/ai/agents' },
        { label: 'Configuración IA' }
      ]}
    />
  );
}
