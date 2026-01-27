'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PlantillasPage() {
  return (
    <PageTemplate
      title="Plantillas"
      subtitle="Gestión de plantillas"
      icon="📄"
      module="SMS"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Sms', path: '/communications/sms' },
        { label: 'Plantillas' }
      ]}
    />
  );
}
