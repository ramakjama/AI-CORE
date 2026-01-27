'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function HistorialPage() {
  return (
    <PageTemplate
      title="Historial"
      subtitle="Gestión de historial"
      icon="📋"
      module="SMS"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Sms', path: '/communications/sms' },
        { label: 'Historial' }
      ]}
    />
  );
}
