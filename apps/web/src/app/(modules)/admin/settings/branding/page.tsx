'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PersonalizacinPage() {
  return (
    <PageTemplate
      title="Personalización"
      subtitle="Gestión de personalización"
      icon="🎨"
      module="Configuración"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Settings', path: '/admin/settings' },
        { label: 'Personalización' }
      ]}
    />
  );
}
