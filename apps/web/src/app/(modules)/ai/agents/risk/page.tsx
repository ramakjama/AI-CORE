'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AnlisisdeRiesgosPage() {
  return (
    <PageTemplate
      title="Análisis de Riesgos"
      subtitle="Gestión de análisis de riesgos"
      icon="⚠️"
      module="Agentes IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Agents', path: '/ai/agents' },
        { label: 'Análisis de Riesgos' }
      ]}
    />
  );
}
