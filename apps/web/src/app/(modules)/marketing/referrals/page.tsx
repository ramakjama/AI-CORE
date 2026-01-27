'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ReferidosPage() {
  return (
    <PageTemplate
      title="Referidos"
      subtitle="Gestión de referidos"
      icon="🤝"
      module="Marketing"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Referidos' }
      ]}
    />
  );
}
