import Link from 'next/link';

export default function NotFound(): React.ReactElement {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--color-bg, #030712)',
      color: 'var(--color-text, #e0f7ff)',
      fontFamily: 'var(--font-mono)',
      padding: '20px',
    }}>
      <div style={{
        padding: '40px',
        background: 'rgba(0, 245, 255, 0.03)',
        border: '1px solid rgba(0, 245, 255, 0.2)',
        borderRadius: '12px',
        textAlign: 'center',
        maxWidth: '500px',
        position: 'relative',
      }}>
        <div style={{
          fontSize: '4rem',
          marginBottom: '16px',
          color: 'var(--color-cyan, #00f5ff)',
          textShadow: '0 0 30px rgba(0, 245, 255, 0.5)',
          fontFamily: 'var(--font-display)',
          fontWeight: 700,
        }}>
          404
        </div>
        <h2 style={{
          fontSize: '1rem',
          fontWeight: 600,
          color: 'var(--color-cyan, #00f5ff)',
          letterSpacing: '0.2em',
          marginBottom: '12px',
        }}>
          RECURSO NO ENCONTRADO
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-3, #5a9aaa)',
          marginBottom: '24px',
        }}>
          La página solicitada no existe en el sistema.
        </p>
        <Link
          href="/dashboard"
          style={{
            display: 'inline-block',
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid var(--color-cyan, #00f5ff)',
            borderRadius: '8px',
            color: 'var(--color-cyan, #00f5ff)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            textDecoration: 'none',
            transition: 'all 0.2s',
          }}
        >
          VOLVER AL DASHBOARD
        </Link>
      </div>
    </div>
  );
}
