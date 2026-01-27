'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function OportunidadesVentaPage() {
  return (
    <PageTemplate
      title="Oportunidades Venta"
      subtitle="Gestión de oportunidades venta"
      icon="📈"
      module="Predictivo"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Predictive', path: '/ai/predictive' },
        { label: 'Oportunidades Venta' }
      ]}
    />
  );
}
