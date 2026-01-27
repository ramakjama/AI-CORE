'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function HabilidadesPage() {
  return (
    <PageTemplate
      title="Habilidades"
      subtitle="Gestión de habilidades"
      icon="💪"
      module="Formación"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Training', path: '/academy/training' },
        { label: 'Habilidades' }
      ]}
    />
  );
}
