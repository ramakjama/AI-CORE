'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CotizadorPage() {
  return (
    <PageTemplate
      title="Cotizador"
      subtitle="Gestión de cotizador"
      icon="💰"
      module="Pólizas"
      breadcrumb={[
        { label: 'Policies', path: '/policies' },
        { label: 'Cotizador' }
      ]}
    />
  );
}
