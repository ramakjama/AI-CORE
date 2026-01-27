'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function ProcedimientosPage() {
  return (
    <PageTemplate
      title="Procedimientos"
      subtitle="Gestión de procedimientos"
      icon="📋"
      module="Conocimiento"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Knowledge', path: '/academy/knowledge' },
        { label: 'Procedimientos' }
      ]}
    />
  );
}
