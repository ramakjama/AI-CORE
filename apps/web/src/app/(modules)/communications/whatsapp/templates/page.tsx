'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PlantillasPage() {
  return (
    <PageTemplate
      title="Plantillas"
      subtitle="Gestión de plantillas"
      icon="📄"
      module="WhatsApp"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Whatsapp', path: '/communications/whatsapp' },
        { label: 'Plantillas' }
      ]}
    />
  );
}
