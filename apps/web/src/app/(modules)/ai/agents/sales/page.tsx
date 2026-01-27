'use client';
import { PageTemplate } from '@/components/PageTemplate';

export default function AsistentedeVentasPage() {
  return (
    <PageTemplate
      title="Asistente de Ventas"
      subtitle="Gestión de asistente de ventas"
      icon="💼"
      module="Agentes IA"
      breadcrumb={[
        { label: 'Ai', path: '/ai' },
        { label: 'Agents', path: '/ai/agents' },
        { label: 'Asistente de Ventas' }
      ]}
    />
  );
}
