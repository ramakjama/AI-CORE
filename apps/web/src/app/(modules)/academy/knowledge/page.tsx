'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BasedeConocimientoPage() {
  return (
    <PageTemplate
      title="Base de Conocimiento"
      subtitle="Gestión de base de conocimiento"
      icon="📖"
      module="Academia"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Base de Conocimiento' }
      ]}
    />
  );
}
