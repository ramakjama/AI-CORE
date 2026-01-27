'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RenovacionesPendientesPage() {
  return (
    <PageTemplate
      title="Renovaciones Pendientes"
      subtitle="Gestión de renovaciones pendientes"
      icon="🔄"
      module="Vencimientos"
      breadcrumb={[
        { label: 'Renewals', path: '/renewals' },
        { label: 'Renovaciones Pendientes' }
      ]}
    />
  );
}
