'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function BlogPage() {
  return (
    <PageTemplate
      title="Blog"
      subtitle="Gestión de blog"
      icon="📰"
      module="Contenidos"
      breadcrumb={[
        { label: 'Marketing', path: '/marketing' },
        { label: 'Content', path: '/marketing/content' },
        { label: 'Blog' }
      ]}
    />
  );
}
