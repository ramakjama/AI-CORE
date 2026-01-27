'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevoContactoPage() {
  return (
    <PageTemplate
      title="Nuevo Contacto"
      subtitle="Gestión de nuevo contacto"
      icon="➕"
      module="Contactos"
      breadcrumb={[
        { label: 'Contacts', path: '/contacts' },
        { label: 'Nuevo Contacto' }
      ]}
    />
  );
}
