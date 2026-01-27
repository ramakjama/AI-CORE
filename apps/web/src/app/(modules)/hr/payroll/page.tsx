'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NminasPage() {
  return (
    <PageTemplate
      title="Nóminas"
      subtitle="Gestión de nóminas"
      icon="💵"
      module="RRHH"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Nóminas' }
      ]}
    />
  );
}
