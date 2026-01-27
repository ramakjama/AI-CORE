'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function VisitasPage() {
  return (
    <PageTemplate
      title="Visitas"
      subtitle="Gestión de visitas"
      icon="🚗"
      module="Operativa"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Daily', path: '/operations/daily' },
        { label: 'Visitas' }
      ]}
    />
  );
}
