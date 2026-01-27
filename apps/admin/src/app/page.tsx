'use client';

import { useState, useEffect } from 'react';

interface PlatformStatus {
  platform: string;
  version: string;
  modules: number;
  agents: number;
  databases: number;
  status: string;
}

export default function AdminDashboard() {
  const [status, setStatus] = useState<PlatformStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/status')
      .then(res => res.json())
      .then(data => {
        setStatus(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <main className="min-h-screen bg-gray-900 text-white p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold">AI-CORE Admin Dashboard</h1>
        <p className="text-gray-400">Sistema Operativo de Business Intelligence</p>
      </header>

      {loading ? (
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-400">Cargando...</p>
        </div>
      ) : status ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard title="Plataforma" value={status.platform} />
          <StatCard title="Version" value={status.version} />
          <StatCard title="Modulos" value={status.modules.toString()} />
          <StatCard title="Agentes IA" value={status.agents.toString()} />
          <StatCard title="Bases de Datos" value={status.databases.toString()} />
          <StatCard
            title="Estado"
            value={status.status}
            className={status.status === 'running' ? 'bg-green-900' : 'bg-red-900'}
          />
        </div>
      ) : (
        <div className="text-center py-20">
          <p className="text-red-400">No se pudo conectar con el servidor</p>
          <p className="text-gray-500 mt-2">Asegurate de que el servidor este corriendo en localhost:4000</p>
        </div>
      )}

      <section className="mt-12">
        <h2 className="text-xl font-semibold mb-4">Acciones Rapidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <ActionButton href="/agents" label="Gestionar Agentes" />
          <ActionButton href="/modules" label="Ver Modulos" />
          <ActionButton href="/databases" label="Bases de Datos" />
          <ActionButton href="/logs" label="Ver Logs" />
        </div>
      </section>
    </main>
  );
}

function StatCard({ title, value, className = '' }: { title: string; value: string; className?: string }) {
  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      <h3 className="text-gray-400 text-sm uppercase tracking-wide">{title}</h3>
      <p className="text-2xl font-bold mt-2">{value}</p>
    </div>
  );
}

function ActionButton({ href, label }: { href: string; label: string }) {
  return (
    <a
      href={href}
      className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg text-center transition-colors"
    >
      {label}
    </a>
  );
}
