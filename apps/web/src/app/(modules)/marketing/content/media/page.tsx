'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BancodeMediosPage() {
  return (
    <PageTemplate
      title="Banco de Medios"
      subtitle="Gestión de banco de medios"
      icon="🖼️"
      module="Contenidos"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Content', path: '/marketing/content' },
        { label: 'Banco de Medios' }
      ]}
    />
  );
}
