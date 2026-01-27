import Link from 'next/link';

export default function HomePage() {
  return (
    <main className="page">
      <section className="card">
        <h1>Customer Portal</h1>
        <p>Gestiona tus polizas, siniestros y comunicaciones en un solo lugar.</p>
        <div className="actions">
          <Link href="/login" className="primary">
            Acceder
          </Link>
          <Link href="/dashboard" className="secondary">
            Ver panel
          </Link>
        </div>
      </section>
    </main>
  );
}
