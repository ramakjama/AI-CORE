'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProductosPage() {
  return (
    <PageTemplate
      title="Productos"
      subtitle="Gestión de productos"
      icon="📦"
      module="Formación"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Training', path: '/academy/training' },
        { label: 'Productos' }
      ]}
    />
  );
}
