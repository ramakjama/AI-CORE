'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage(): React.ReactElement | null {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    const token = localStorage.getItem('accessToken');
    if (token) {
      router.push('/dashboard');
    }
  }, [router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    await new Promise(resolve => setTimeout(resolve, 1000));

    const user = {
      id: 'usr-' + Date.now(),
      email: email || 'admin@sorianomediadores.es',
      name: 'Raúl Soriano',
      role: 'Administrador',
      avatar: 'RS',
    };

    localStorage.setItem('accessToken', 'soriano-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify(user));
    router.push('/dashboard');
  };

  const handleDevAccess = async () => {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 500));

    const user = {
      id: 'usr-dev',
      email: 'dev@sorianomediadores.es',
      name: 'Developer',
      role: 'Admin',
      avatar: 'DV',
    };

    localStorage.setItem('accessToken', 'dev-token-' + Date.now());
    localStorage.setItem('user', JSON.stringify(user));
    router.push('/dashboard');
  };

  if (!mounted) return null;

  return (
    <>
      <style>{`
        .login-wrapper {
          min-height: 100vh;
          display: flex;
          background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 50%, #0a0a0a 100%);
          position: relative;
          overflow: hidden;
        }

        .login-wrapper::before {
          content: '';
          position: absolute;
          top: -50%;
          left: -50%;
          width: 200%;
          height: 200%;
          background: radial-gradient(circle at 30% 30%, rgba(227, 6, 19, 0.03) 0%, transparent 50%),
                      radial-gradient(circle at 70% 70%, rgba(227, 6, 19, 0.02) 0%, transparent 50%);
          animation: subtle-pulse 20s ease-in-out infinite;
        }

        @keyframes subtle-pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.05); }
        }

        .login-brand-panel {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 60px;
          position: relative;
          background: linear-gradient(135deg, #E30613 0%, #8B0309 100%);
        }

        .login-brand-panel::before {
          content: '';
          position: absolute;
          inset: 0;
          background: url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3z' fill='%23ffffff' fill-opacity='0.03'/%3E%3C/svg%3E");
          opacity: 0.5;
        }

        .brand-content {
          position: relative;
          z-index: 1;
          text-align: center;
          color: white;
          max-width: 420px;
        }

        .brand-shield {
          width: 120px;
          height: 120px;
          margin: 0 auto 32px;
          background: white;
          border-radius: 28px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 25px 80px rgba(0, 0, 0, 0.4);
          position: relative;
        }

        .brand-shield::after {
          content: '';
          position: absolute;
          inset: -4px;
          border-radius: 32px;
          background: linear-gradient(135deg, rgba(255,255,255,0.3) 0%, transparent 50%);
          z-index: -1;
        }

        .brand-shield-letter {
          font-size: 4rem;
          font-weight: 800;
          color: #E30613;
          line-height: 1;
        }

        .brand-title {
          font-size: 2.25rem;
          font-weight: 700;
          margin-bottom: 8px;
          letter-spacing: -0.02em;
        }

        .brand-subtitle {
          font-size: 1rem;
          opacity: 0.9;
          margin-bottom: 48px;
          font-weight: 400;
        }

        .brand-features {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .brand-feature {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 16px 20px;
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border-radius: 12px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: left;
        }

        .brand-feature-icon {
          font-size: 1.5rem;
          width: 40px;
          text-align: center;
        }

        .brand-feature-text {
          font-size: 0.9375rem;
          font-weight: 500;
        }

        .login-form-panel {
          width: 520px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding: 60px;
          position: relative;
          z-index: 1;
        }

        .login-form-container {
          max-width: 380px;
          margin: 0 auto;
          width: 100%;
        }

        .login-header {
          margin-bottom: 40px;
        }

        .login-title {
          font-size: 1.75rem;
          font-weight: 700;
          color: #f5f5f7;
          margin-bottom: 8px;
        }

        .login-subtitle {
          font-size: 0.9375rem;
          color: #6e6e73;
        }

        .login-form {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .form-field {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-label {
          font-size: 0.8125rem;
          font-weight: 600;
          color: #a1a1a6;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .form-input {
          padding: 16px 18px;
          background: #1a1a1a;
          border: 1px solid #333;
          border-radius: 12px;
          font-size: 1rem;
          color: #f5f5f7;
          transition: all 0.2s ease;
          width: 100%;
        }

        .form-input:focus {
          outline: none;
          border-color: #E30613;
          background: #222;
          box-shadow: 0 0 0 4px rgba(227, 6, 19, 0.1);
        }

        .form-input::placeholder {
          color: #48484a;
        }

        .form-options {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 4px;
        }

        .remember-check {
          display: flex;
          align-items: center;
          gap: 10px;
          cursor: pointer;
        }

        .remember-check input {
          width: 18px;
          height: 18px;
          accent-color: #E30613;
          cursor: pointer;
        }

        .remember-check span {
          font-size: 0.875rem;
          color: #a1a1a6;
        }

        .forgot-link {
          font-size: 0.875rem;
          color: #E30613;
          font-weight: 500;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
        }

        .forgot-link:hover {
          color: #FF4D4D;
          text-decoration: underline;
        }

        .login-btn {
          width: 100%;
          padding: 18px;
          background: linear-gradient(135deg, #E30613 0%, #B8050F 100%);
          color: white;
          border: none;
          border-radius: 12px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
          overflow: hidden;
          margin-top: 8px;
        }

        .login-btn::before {
          content: '';
          position: absolute;
          top: 0;
          left: -100%;
          width: 100%;
          height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
          transition: left 0.5s ease;
        }

        .login-btn:hover::before {
          left: 100%;
        }

        .login-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 40px rgba(227, 6, 19, 0.4);
        }

        .login-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
          transform: none;
        }

        .login-btn:disabled::before {
          display: none;
        }

        .divider {
          display: flex;
          align-items: center;
          gap: 16px;
          margin: 28px 0;
        }

        .divider-line {
          flex: 1;
          height: 1px;
          background: linear-gradient(90deg, transparent, #333, transparent);
        }

        .divider-text {
          font-size: 0.75rem;
          color: #48484a;
          text-transform: uppercase;
          letter-spacing: 0.1em;
        }

        .sso-btn {
          width: 100%;
          padding: 14px 18px;
          background: #1a1a1a;
          color: #f5f5f7;
          border: 1px solid #333;
          border-radius: 12px;
          font-size: 0.9375rem;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          transition: all 0.2s ease;
        }

        .sso-btn:hover {
          background: #222;
          border-color: #444;
        }

        .sso-btn svg {
          width: 20px;
          height: 20px;
        }

        .dev-section {
          margin-top: 24px;
          padding-top: 24px;
          border-top: 1px dashed #333;
        }

        .dev-btn {
          width: 100%;
          padding: 12px;
          background: transparent;
          color: #6e6e73;
          border: 1px dashed #333;
          border-radius: 10px;
          font-size: 0.8125rem;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .dev-btn:hover {
          background: rgba(227, 6, 19, 0.05);
          border-color: #E30613;
          color: #E30613;
        }

        .dev-note {
          text-align: center;
          font-size: 0.6875rem;
          color: #48484a;
          margin-top: 8px;
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .error-message {
          padding: 14px 16px;
          background: rgba(255, 59, 48, 0.1);
          border: 1px solid rgba(255, 59, 48, 0.3);
          border-radius: 10px;
          color: #FF3B30;
          font-size: 0.875rem;
          text-align: center;
        }

        .login-footer {
          margin-top: 40px;
          text-align: center;
        }

        .footer-text {
          font-size: 0.6875rem;
          color: #48484a;
          letter-spacing: 0.02em;
        }

        .footer-link {
          color: #6e6e73;
          cursor: pointer;
        }

        .footer-link:hover {
          color: #E30613;
        }

        @media (max-width: 1024px) {
          .login-brand-panel {
            display: none;
          }
          .login-form-panel {
            width: 100%;
          }
        }

        @media (max-width: 480px) {
          .login-form-panel {
            padding: 40px 24px;
          }
        }
      `}</style>

      <div className="login-wrapper">
        <div className="login-brand-panel">
          <div className="brand-content">
            <div className="brand-shield">
              <span className="brand-shield-letter">S</span>
            </div>
            <h1 className="brand-title">Soriano Mediadores</h1>
            <p className="brand-subtitle">Sistema de Gestión Empresarial</p>

            <div className="brand-features">
              <div className="brand-feature">
                <span className="brand-feature-icon">🛡️</span>
                <span className="brand-feature-text">Gestión integral de pólizas y clientes</span>
              </div>
              <div className="brand-feature">
                <span className="brand-feature-icon">🤖</span>
                <span className="brand-feature-text">7 Agentes de IA especializados</span>
              </div>
              <div className="brand-feature">
                <span className="brand-feature-icon">💾</span>
                <span className="brand-feature-text">81 bases de datos conectadas</span>
              </div>
              <div className="brand-feature">
                <span className="brand-feature-icon">📊</span>
                <span className="brand-feature-text">Analytics y reporting avanzado</span>
              </div>
            </div>
          </div>
        </div>

        <div className="login-form-panel">
          <div className="login-form-container">
            <div className="login-header">
              <h2 className="login-title">Iniciar Sesión</h2>
              <p className="login-subtitle">Accede a tu cuenta corporativa</p>
            </div>

            <form className="login-form" onSubmit={handleSubmit}>
              <div className="form-field">
                <label className="form-label" htmlFor="email">Email</label>
                <input
                  type="email"
                  id="email"
                  className="form-input"
                  placeholder="tu@sorianomediadores.es"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>

              <div className="form-field">
                <label className="form-label" htmlFor="password">Contraseña</label>
                <input
                  type="password"
                  id="password"
                  className="form-input"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>

              <div className="form-options">
                <label className="remember-check">
                  <input type="checkbox" defaultChecked />
                  <span>Recordarme</span>
                </label>
                <button type="button" className="forgot-link">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              {error && <div className="error-message">{error}</div>}

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </button>
            </form>

            <div className="divider">
              <div className="divider-line" />
              <span className="divider-text">o continúa con</span>
              <div className="divider-line" />
            </div>

            <button type="button" className="sso-btn" onClick={handleDevAccess} disabled={isLoading}>
              <svg viewBox="0 0 21 21" fill="none">
                <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                <rect x="11" y="1" width="9" height="9" fill="#7fba00"/>
                <rect x="1" y="11" width="9" height="9" fill="#00a4ef"/>
                <rect x="11" y="11" width="9" height="9" fill="#ffb900"/>
              </svg>
              Microsoft 365
            </button>

            <div className="dev-section">
              <button type="button" className="dev-btn" onClick={handleDevAccess} disabled={isLoading}>
                Acceso Desarrollo (Sin Autenticación)
              </button>
              <p className="dev-note">Solo disponible en entorno local</p>
            </div>

            <div className="login-footer">
              <p className="footer-text">
                © 2024 Soriano Mediadores de Seguros S.L. ·
                <span className="footer-link"> Privacidad</span> ·
                <span className="footer-link"> Términos</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
