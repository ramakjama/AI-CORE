'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevaPlizaPage() {
  return (
    <PageTemplate
      title="Nueva Póliza"
      subtitle="Gestión de nueva póliza"
      icon="➕"
      module="Pólizas"
      breadcrumb={[
        { label: 'Policies', path: '/policies' },
        { label: 'Nueva Póliza' }
      ]}
    />
  );
}
