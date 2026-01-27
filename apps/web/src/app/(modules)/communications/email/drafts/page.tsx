'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BorradoresPage() {
  return (
    <PageTemplate
      title="Borradores"
      subtitle="Gestión de borradores"
      icon="📝"
      module="Email"
      breadcrumb={[
        { label: 'Communications', path: '/communications' },
        { label: 'Email', path: '/communications/email' },
        { label: 'Borradores' }
      ]}
    />
  );
}
