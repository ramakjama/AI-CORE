'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function WikiInternaPage() {
  return (
    <PageTemplate
      title="Wiki Interna"
      subtitle="Gestión de wiki interna"
      icon="📄"
      module="Conocimiento"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Knowledge', path: '/academy/knowledge' },
        { label: 'Wiki Interna' }
      ]}
    />
  );
}
