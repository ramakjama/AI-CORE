'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ContactosPage() {
  return (
    <PageTemplate
      title="Contactos"
      subtitle="Gestión de contactos"
      icon="📇"
      module="Compañías"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Companies', path: '/admin/companies' },
        { label: 'Contactos' }
      ]}
    />
  );
}
