'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function GruposPage() {
  return (
    <PageTemplate
      title="Grupos"
      subtitle="Gestión de grupos"
      icon="👥"
      module="Contactos"
      breadcrumb={[
        { label: 'Contacts', path: '/contacts' },
        { label: 'Grupos' }
      ]}
    />
  );
}
