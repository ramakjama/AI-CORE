'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function SistemaPage() {
  return (
    <PageTemplate
      title="Sistema"
      subtitle="Gestión de sistema"
      icon="🖥️"
      module="Admin"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Sistema' }
      ]}
    />
  );
}
