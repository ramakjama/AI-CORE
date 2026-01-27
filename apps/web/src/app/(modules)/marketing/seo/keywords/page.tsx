'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function PalabrasClavePage() {
  return (
    <PageTemplate
      title="Palabras Clave"
      subtitle="Gestión de palabras clave"
      icon="🔑"
      module="SEO"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Seo', path: '/marketing/seo' },
        { label: 'Palabras Clave' }
      ]}
    />
  );
}
