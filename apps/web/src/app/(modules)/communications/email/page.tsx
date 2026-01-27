'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EmailPage() {
  return (
    <PageTemplate
      title="Email"
      subtitle="Gestión de email"
      icon="✉️"
      module="Comunicaciones"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Email' }
      ]}
    />
  );
}
