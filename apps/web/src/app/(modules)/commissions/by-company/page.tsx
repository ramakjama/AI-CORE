'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PorCompaaPage() {
  return (
    <PageTemplate
      title="Por Compañía"
      subtitle="Gestión de por compañía"
      icon="🏢"
      module="Comisiones"
      breadcrumb={[
        { label: 'Commissions', path: '/commissions' },
        { label: 'Por Compañía' }
      ]}
    />
  );
}
