'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function NewsletterPage() {
  return (
    <PageTemplate
      title="Newsletter"
      subtitle="Gestión de newsletter"
      icon="✉️"
      module="Contenidos"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Content', path: '/marketing/content' },
        { label: 'Newsletter' }
      ]}
    />
  );
}
