'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProcesamientodeDocsPage() {
  return (
    <PageTemplate
      title="Procesamiento de Docs"
      subtitle="Gestión de procesamiento de docs"
      icon="📄"
      module="Agentes IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Agents', path: '/ai/agents' },
        { label: 'Procesamiento de Docs' }
      ]}
    />
  );
}
