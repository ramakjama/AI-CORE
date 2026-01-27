'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function GeneralPage() {
  return (
    <PageTemplate
      title="General"
      subtitle="Gestión de general"
      icon="🔧"
      module="Configuración"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'General' }
      ]}
    />
  );
}
