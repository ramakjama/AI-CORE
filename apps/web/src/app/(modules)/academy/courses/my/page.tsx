'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function MisCursosPage() {
  return (
    <PageTemplate
      title="Mis Cursos"
      subtitle="Gestión de mis cursos"
      icon="📖"
      module="Cursos"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Courses', path: '/academy/courses' },
        { label: 'Mis Cursos' }
      ]}
    />
  );
}
