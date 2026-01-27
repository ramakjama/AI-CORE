'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function Prximos30dasPage() {
  return (
    <PageTemplate
      title="Próximos 30 días"
      subtitle="Gestión de próximos 30 días"
      icon="⏰"
      module="Vencimientos"
      breadcrumb={[
        { label: 'Renewals', path: '/renewals' },
        { label: 'Próximos 30 días' }
      ]}
    />
  );
}
