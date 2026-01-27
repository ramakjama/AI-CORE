'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function VideotecaPage() {
  return (
    <PageTemplate
      title="Videoteca"
      subtitle="Gestión de videoteca"
      icon="🎬"
      module="Conocimiento"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Knowledge', path: '/academy/knowledge' },
        { label: 'Videoteca' }
      ]}
    />
  );
}
