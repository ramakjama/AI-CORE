'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NuevoLeadPage() {
  return (
    <PageTemplate
      title="Nuevo Lead"
      subtitle="Gestión de nuevo lead"
      icon="➕"
      module="Leads"
      breadcrumb={[
        { label: 'Leads', path: '/leads' },
        { label: 'Nuevo Lead' }
      ]}
    />
  );
}
