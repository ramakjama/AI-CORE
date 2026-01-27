'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    console.error(error);
  }, [error]);

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
          ERROR DEL SISTEMA
        </h2>
        <p style={{
          fontSize: '0.85rem',
          color: 'var(--color-text-3, #5a9aaa)',
          marginBottom: '24px',
        }}>
          Se ha producido un error inesperado en la aplicación.
        </p>
        <button
          onClick={reset}
          style={{
            padding: '12px 24px',
            background: 'transparent',
            border: '1px solid var(--color-cyan, #00f5ff)',
            borderRadius: '8px',
            color: 'var(--color-cyan, #00f5ff)',
            fontSize: '0.8rem',
            fontWeight: 600,
            letterSpacing: '0.1em',
            cursor: 'pointer',
            transition: 'all 0.2s',
          }}
        >
          REINTENTAR
        </button>
      </div>
    </div>
  );
}
