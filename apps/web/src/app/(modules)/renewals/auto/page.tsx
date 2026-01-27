'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function RenovacinAutomticaPage() {
  return (
    <PageTemplate
      title="Renovación Automática"
      subtitle="Gestión de renovación automática"
      icon="⚡"
      module="Vencimientos"
      breadcrumb={[
        { label: 'Renewals', path: '/renewals' },
        { label: 'Renovación Automática' }
      ]}
    />
  );
}
