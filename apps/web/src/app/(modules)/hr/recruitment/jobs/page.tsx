'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function OfertasPage() {
  return (
    <PageTemplate
      title="Ofertas"
      subtitle="Gestión de ofertas"
      icon="📢"
      module="Selección"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Recruitment', path: '/hr/recruitment' },
        { label: 'Ofertas' }
      ]}
    />
  );
}
