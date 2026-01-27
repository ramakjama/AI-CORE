'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PrediccindeBajasPage() {
  return (
    <PageTemplate
      title="Predicción de Bajas"
      subtitle="Gestión de predicción de bajas"
      icon="📉"
      module="Predictivo"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Predictive', path: '/ai/predictive' },
        { label: 'Predicción de Bajas' }
      ]}
    />
  );
}
