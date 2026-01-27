'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FuentesPage() {
  return (
    <PageTemplate
      title="Fuentes"
      subtitle="Gestión de fuentes"
      icon="🔗"
      module="Leads"
      breadcrumb={[
        { label: 'Leads', path: '/leads' },
        { label: 'Fuentes' }
      ]}
    />
  );
}
