'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FormacinPage() {
  return (
    <PageTemplate
      title="Formación"
      subtitle="Gestión de formación"
      icon="📝"
      module="Academia"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Formación' }
      ]}
    />
  );
}
