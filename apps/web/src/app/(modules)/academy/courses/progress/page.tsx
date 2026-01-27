'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function MiProgresoPage() {
  return (
    <PageTemplate
      title="Mi Progreso"
      subtitle="Gestión de mi progreso"
      icon="📈"
      module="Cursos"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Courses', path: '/academy/courses' },
        { label: 'Mi Progreso' }
      ]}
    />
  );
}
