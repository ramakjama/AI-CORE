'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ScoringdeClientesPage() {
  return (
    <PageTemplate
      title="Scoring de Clientes"
      subtitle="Gestión de scoring de clientes"
      icon="⭐"
      module="Predictivo"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Predictive', path: '/ai/predictive' },
        { label: 'Scoring de Clientes' }
      ]}
    />
  );
}
