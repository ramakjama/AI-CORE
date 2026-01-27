'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function EntrevistasPage() {
  return (
    <PageTemplate
      title="Entrevistas"
      subtitle="Gestión de entrevistas"
      icon="🤝"
      module="Selección"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Recruitment', path: '/hr/recruitment' },
        { label: 'Entrevistas' }
      ]}
    />
  );
}
