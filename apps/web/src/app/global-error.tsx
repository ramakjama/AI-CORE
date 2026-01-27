'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  return (
    <html lang="es">
      <body style={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#030712',
        color: '#e0f7ff',
        fontFamily: 'monospace',
        padding: '20px',
        margin: 0,
      }}>
        <div style={{
          padding: '40px',
          background: 'rgba(255, 51, 51, 0.05)',
          border: '1px solid rgba(255, 51, 51, 0.3)',
          borderRadius: '12px',
          textAlign: 'center',
          maxWidth: '500px',
        }}>
          <div style={{
            fontSize: '3rem',
            marginBottom: '16px',
            color: '#ff3333',
            textShadow: '0 0 20px rgba(255, 51, 51, 0.5)',
          }}>
            ⚠
          </div>
          <h2 style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#ff3333',
            letterSpacing: '0.1em',
            marginBottom: '12px',
          }}>
            ERROR CRÍTICO
          </h2>
          <p style={{
            fontSize: '0.85rem',
            color: '#5a9aaa',
            marginBottom: '24px',
          }}>
            Se ha producido un error crítico en la aplicación.
          </p>
          <button
            onClick={reset}
            style={{
              padding: '12px 24px',
              background: 'transparent',
              border: '1px solid #00f5ff',
              borderRadius: '8px',
              color: '#00f5ff',
              fontSize: '0.8rem',
              fontWeight: 600,
              letterSpacing: '0.1em',
              cursor: 'pointer',
            }}
          >
            REINTENTAR
          </button>
        </div>
      </body>
    </html>
  );
}
