'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CertificadosPage() {
  return (
    <PageTemplate
      title="Certificados"
      subtitle="Gestión de certificados"
      icon="🏆"
      module="Cursos"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Courses', path: '/academy/courses' },
        { label: 'Certificados' }
      ]}
    />
  );
}
