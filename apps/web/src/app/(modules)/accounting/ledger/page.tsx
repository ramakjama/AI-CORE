'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function LibroMayorPage() {
  return (
    <PageTemplate
      title="Libro Mayor"
      subtitle="Gestión de libro mayor"
      icon="📚"
      module="Contabilidad"
      breadcrumb={[
        { label: 'Accounting', path: '/accounting' },
        { label: 'Libro Mayor' }
      ]}
    />
  );
}
