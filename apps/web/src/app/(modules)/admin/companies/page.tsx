'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CompaasPage() {
  return (
    <PageTemplate
      title="Compañías"
      subtitle="Gestión de compañías"
      icon="🏢"
      module="Admin"
      breadcrumb={[
        { label: 'Admin', path: '/admin' },
        { label: 'Compañías' }
      ]}
    />
  );
}
