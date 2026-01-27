'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CandidatosPage() {
  return (
    <PageTemplate
      title="Candidatos"
      subtitle="Gestión de candidatos"
      icon="👤"
      module="Selección"
      breadcrumb={[
        { label: 'Hr', path: '/hr' },
        { label: 'Recruitment', path: '/hr/recruitment' },
        { label: 'Candidatos' }
      ]}
    />
  );
}
