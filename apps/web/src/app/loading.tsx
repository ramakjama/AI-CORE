export default function Loading(): React.ReactElement {
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
    }}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '24px',
      }}>
        {/* Spinner */}
        <div style={{
          width: '48px',
          height: '48px',
          border: '2px solid rgba(0, 245, 255, 0.1)',
          borderTopColor: 'var(--color-cyan, #00f5ff)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
        }} />

        {/* Text */}
        <div style={{
          fontSize: '0.75rem',
          color: 'var(--color-cyan, #00f5ff)',
          letterSpacing: '0.2em',
          textShadow: '0 0 10px rgba(0, 245, 255, 0.5)',
        }}>
          CARGANDO...
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
