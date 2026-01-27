'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ContenidosPage() {
  return (
    <PageTemplate
      title="Contenidos"
      subtitle="Gestión de contenidos"
      icon="📝"
      module="Marketing"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Contenidos' }
      ]}
    />
  );
}
