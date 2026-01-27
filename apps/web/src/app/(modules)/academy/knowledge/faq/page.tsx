'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function FAQPage() {
  return (
    <PageTemplate
      title="FAQ"
      subtitle="Gestión de faq"
      icon="❓"
      module="Conocimiento"
      breadcrumb={[
        { label: 'Academy', path: '/academy' },
        { label: 'Knowledge', path: '/academy/knowledge' },
        { label: 'FAQ' }
      ]}
    />
  );
}
