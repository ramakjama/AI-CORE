'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SaldosPage() {
  return (
    <PageTemplate
      title="Saldos"
      subtitle="Gestión de saldos"
      icon="📊"
      module="Vacaciones"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Vacations', path: '/hr/vacations' },
        { label: 'Saldos' }
      ]}
    />
  );
}
