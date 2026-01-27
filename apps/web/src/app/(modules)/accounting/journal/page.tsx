'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function LibroDiarioPage() {
  return (
    <PageTemplate
      title="Libro Diario"
      subtitle="Gestión de libro diario"
      icon="📖"
      module="Contabilidad"
      breadcrumb={[
        { label: 'Accounting', path: '/accounting' },
        { label: 'Libro Diario' }
      ]}
    />
  );
}
