'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EnviadosPage() {
  return (
    <PageTemplate
      title="Enviados"
      subtitle="Gestión de enviados"
      icon="📤"
      module="Email"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Email', path: '/communications/email' },
        { label: 'Enviados' }
      ]}
    />
  );
}
