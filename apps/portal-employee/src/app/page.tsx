import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <h1>Employee Portal</h1>
        <p>Monitoriza clientes, polizas, agentes y comunicaciones en tiempo real.</p>
        <div className="actions">
          <Link href="/dashboard" className="primary">
            Ir al panel
          </Link>
          <Link href="/ops" className="secondary">
            Operaciones
          </Link>
        </div>
      </section>
    </main>
  );
}
