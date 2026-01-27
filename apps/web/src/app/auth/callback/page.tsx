'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function AuthCallbackContent(): React.ReactElement {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando autenticación...');

  useEffect(() => {
    const handleCallback = async () => {
      const code = searchParams.get('code');
      const state = searchParams.get('state');
      const error = searchParams.get('error');
      const errorDescription = searchParams.get('error_description');

      // Handle OAuth errors
      if (error) {
        setStatus('error');
        setMessage(errorDescription || 'Error de autenticación');
        return;
      }

      if (!code || !state) {
        setStatus('error');
        setMessage('Parámetros de autenticación inválidos');
        return;
      }

      try {
        // Exchange code for tokens
        const response = await fetch(`${API_URL}/auth/microsoft/callback`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, state }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error?.message || 'Error de autenticación');
        }

        const result = await response.json();

        if (!result.success) {
          throw new Error(result.error?.message || 'Acceso denegado');
        }

        // Store tokens
        localStorage.setItem('accessToken', result.tokens.accessToken);
        localStorage.setItem('refreshToken', result.tokens.refreshToken);
        localStorage.setItem('user', JSON.stringify(result.user));

        setStatus('success');
        setMessage(`Bienvenido, ${result.user.displayName || result.user.givenName}`);

        // Redirect to dashboard
        setTimeout(() => router.push('/dashboard'), 1500);

      } catch (error) {
        setStatus('error');
        setMessage(error instanceof Error ? error.message : 'Error de autenticación');
      }
    };

    handleCallback();
  }, [searchParams, router]);

  return (
    <div className="callback-card">
      {status === 'loading' && (
        <>
          <div className="spinner" />
          <h2>Verificando identidad...</h2>
          <p>{message}</p>
        </>
      )}

      {status === 'success' && (
        <>
          <div className="success-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h2>Acceso verificado</h2>
          <p>{message}</p>
          <p className="redirect-text">Redirigiendo al dashboard...</p>
        </>
      )}

      {status === 'error' && (
        <>
          <div className="error-icon">
            <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M15 9l-6 6M9 9l6 6"/>
            </svg>
          </div>
          <h2>Error de autenticación</h2>
          <p>{message}</p>
          <button type="button" onClick={() => router.push('/login')}>
            Volver al login
          </button>
        </>
      )}
    </div>
  );
}

function LoadingFallback(): React.ReactElement {
  return (
    <div className="callback-card">
      <div className="spinner" />
      <h2>Cargando...</h2>
    </div>
  );
}

export default function AuthCallbackPage(): React.ReactElement {
  return (
    <>
      <style>{`
        .callback-page {
          min-height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
          padding: 2rem;
        }

        .callback-card {
          background: #1e293b;
          border-radius: 1rem;
          padding: 3rem;
          text-align: center;
          max-width: 400px;
          width: 100%;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
          border: 1px solid #334155;
        }

        h2 {
          color: #f1f5f9;
          font-size: 1.5rem;
          margin: 1rem 0 0.5rem;
        }

        p {
          color: #94a3b8;
          margin: 0.5rem 0;
        }

        .spinner {
          width: 48px;
          height: 48px;
          border: 3px solid #334155;
          border-top-color: #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin: 0 auto;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .success-icon {
          color: #4ade80;
        }

        .error-icon {
          color: #f87171;
        }

        .redirect-text {
          font-size: 0.875rem;
          color: #64748b;
        }

        button {
          margin-top: 1.5rem;
          padding: 0.75rem 1.5rem;
          background: #3b82f6;
          color: #fff;
          border: none;
          border-radius: 0.5rem;
          font-size: 1rem;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s;
        }

        button:hover {
          background: #2563eb;
        }
      `}</style>

      <main className="callback-page">
        <Suspense fallback={<LoadingFallback />}>
          <AuthCallbackContent />
        </Suspense>
      </main>
    </>
  );
}
