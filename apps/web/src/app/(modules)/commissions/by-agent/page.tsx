'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorMediadorPage() {
  return (
    <PageTemplate
      title="Por Mediador"
      subtitle="Gestión de por mediador"
      icon="👤"
      module="Comisiones"
      breadcrumb={[
        { label: 'Commissions', path: '/commissions' },
        { label: 'Por Mediador' }
      ]}
    />
  );
}
