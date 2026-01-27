'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AgendaPage() {
  return (
    <PageTemplate
      title="Agenda"
      subtitle="Gestión de agenda"
      icon="📅"
      module="Operativa"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Daily', path: '/operations/daily' },
        { label: 'Agenda' }
      ]}
    />
  );
}
