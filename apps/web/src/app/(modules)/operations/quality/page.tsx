'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function CalidadPage() {
  return (
    <PageTemplate
      title="Calidad"
      subtitle="Gestión de calidad"
      icon="⭐"
      module="Operaciones"
      breadcrumb={[
        { label: 'Operations', path: '/operations' },
        { label: 'Calidad' }
      ]}
    />
  );
}
