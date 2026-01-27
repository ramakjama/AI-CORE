'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CalendarioPage() {
  return (
    <PageTemplate
      title="Calendario"
      subtitle="Gestión de calendario"
      icon="📆"
      module="Vencimientos"
      breadcrumb={[
        { label: 'Renewals', path: '/renewals' },
        { label: 'Calendario' }
      ]}
    />
  );
}
