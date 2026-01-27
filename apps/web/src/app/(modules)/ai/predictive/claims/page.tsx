'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PrediccinSiniestrosPage() {
  return (
    <PageTemplate
      title="Predicción Siniestros"
      subtitle="Gestión de predicción siniestros"
      icon="🎲"
      module="Predictivo"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Predictive', path: '/ai/predictive' },
        { label: 'Predicción Siniestros' }
      ]}
    />
  );
}
