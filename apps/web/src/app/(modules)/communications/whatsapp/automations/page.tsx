'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AutomatizacionesPage() {
  return (
    <PageTemplate
      title="Automatizaciones"
      subtitle="Gestión de automatizaciones"
      icon="🤖"
      module="WhatsApp"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Whatsapp', path: '/communications/whatsapp' },
        { label: 'Automatizaciones' }
      ]}
    />
  );
}
