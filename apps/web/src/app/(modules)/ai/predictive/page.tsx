'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AnalyticsPredictivoPage() {
  return (
    <PageTemplate
      title="Analytics Predictivo"
      subtitle="Gestión de analytics predictivo"
      icon="🔮"
      module="IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Analytics Predictivo' }
      ]}
    />
  );
}
