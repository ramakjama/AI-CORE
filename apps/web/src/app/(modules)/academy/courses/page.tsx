'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CursosPage() {
  return (
    <PageTemplate
      title="Cursos"
      subtitle="Gestión de cursos"
      icon="🎓"
      module="Academia"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Cursos' }
      ]}
    />
  );
}
