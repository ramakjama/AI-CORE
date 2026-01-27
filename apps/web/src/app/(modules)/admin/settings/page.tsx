'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ConfiguracinPage() {
  return (
    <PageTemplate
      title="Configuración"
      subtitle="Gestión de configuración"
      icon="⚙️"
      module="Admin"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Configuración' }
      ]}
    />
  );
}
