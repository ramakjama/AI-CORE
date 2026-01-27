'use client';

import { useState, useEffect } from 'react';

export default function SettingsPage(): React.ReactElement {
  const [user, setUser] = useState({ name: '', email: '' });
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    weekly: false,
  });
  const [security, setSecurity] = useState({
    twoFactor: false,
  });

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        setUser(JSON.parse(userData));
      } catch {
        // ignore
      }
    }
  }, []);

  return (
    <>
      <style>{`
        .settings-fui { display: flex; flex-direction: column; gap: 24px; max-width: 800px; }
        .page-header-fui { padding: 20px 24px; background: linear-gradient(90deg, rgba(0,245,255,0.05) 0%, transparent 50%, rgba(0,245,255,0.05) 100%); border: 1px solid rgba(0,245,255,0.2); border-radius: 12px; position: relative; overflow: hidden; }
        .page-header-fui::before { content: ''; position: absolute; top: 0; left: -100%; width: 200%; height: 1px; background: linear-gradient(90deg, transparent, var(--color-cyan), transparent); animation: scan 4s linear infinite; }
        @keyframes scan { to { transform: translateX(50%); } }
        .page-title-fui { font-family: var(--font-display); font-size: 1.5rem; font-weight: 700; color: var(--color-cyan); text-shadow: 0 0 10px rgba(0,245,255,0.5); letter-spacing: 0.1em; display: flex; align-items: center; gap: 12px; margin-bottom: 8px; }
        .page-title-fui::before { content: '◈'; font-size: 1rem; }
        .page-subtitle { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); letter-spacing: 0.15em; }

        .settings-section-fui { background: var(--color-surface); border: 1px solid var(--color-border); border-radius: 16px; overflow: hidden; position: relative; }
        .settings-section-fui::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 1px; background: linear-gradient(90deg, transparent, rgba(0,245,255,0.3), transparent); }

        .section-header-fui { padding: 20px 24px; border-bottom: 1px solid var(--color-border); background: linear-gradient(180deg, var(--color-surface-2) 0%, var(--color-surface) 100%); }
        .section-title-fui { font-family: var(--font-mono); font-size: 0.8rem; font-weight: 600; color: var(--color-cyan); letter-spacing: 0.1em; margin-bottom: 4px; }
        .section-description-fui { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-4); letter-spacing: 0.05em; }

        .section-body-fui { padding: 24px; }

        .form-group-fui { margin-bottom: 20px; }
        .form-group-fui:last-child { margin-bottom: 0; }
        .form-label-fui { display: block; font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-3); margin-bottom: 8px; font-weight: 500; letter-spacing: 0.05em; }
        .form-input-fui { width: 100%; padding: 12px 16px; background: var(--color-surface-2); border: 1px solid var(--color-border); border-radius: 8px; color: var(--color-text); font-family: var(--font-mono); font-size: 0.85rem; transition: all 0.2s; }
        .form-input-fui:focus { outline: none; border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.2); }
        .form-input-fui:disabled { color: var(--color-text-4); cursor: not-allowed; }

        .form-row-fui { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
        @media (max-width: 600px) { .form-row-fui { grid-template-columns: 1fr; } }

        .toggle-row-fui { display: flex; align-items: center; justify-content: space-between; padding: 16px 0; border-bottom: 1px solid var(--color-border); }
        .toggle-row-fui:last-child { border-bottom: none; padding-bottom: 0; }
        .toggle-info-fui { flex: 1; }
        .toggle-label-fui { font-family: var(--font-ui); font-size: 0.9rem; color: var(--color-text); margin-bottom: 4px; }
        .toggle-description-fui { font-family: var(--font-mono); font-size: 0.7rem; color: var(--color-text-4); }

        .toggle-switch-fui { position: relative; width: 52px; height: 28px; background: var(--color-surface-3); border: 1px solid var(--color-border); border-radius: 14px; cursor: pointer; transition: all 0.2s; }
        .toggle-switch-fui.on { background: rgba(0,245,255,0.2); border-color: var(--color-cyan); box-shadow: 0 0 15px rgba(0,245,255,0.3); }
        .toggle-switch-fui::after { content: ''; position: absolute; top: 3px; left: 3px; width: 20px; height: 20px; background: var(--color-text-4); border-radius: 50%; transition: all 0.2s; }
        .toggle-switch-fui.on::after { left: 27px; background: var(--color-cyan); box-shadow: 0 0 10px rgba(0,245,255,0.5); }

        .btn-row-fui { display: flex; gap: 12px; margin-top: 24px; }
        .btn-primary-fui { padding: 12px 24px; background: var(--color-cyan); color: var(--color-void); border: none; border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; font-weight: 600; letter-spacing: 0.1em; cursor: pointer; box-shadow: 0 0 15px rgba(0,245,255,0.3); transition: all 0.2s; }
        .btn-primary-fui:hover { box-shadow: 0 0 25px rgba(0,245,255,0.5); transform: translateY(-1px); }
        .btn-secondary-fui { padding: 12px 24px; background: transparent; color: var(--color-text-3); border: 1px solid var(--color-border); border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s; }
        .btn-secondary-fui:hover { background: var(--color-surface-2); border-color: rgba(0,245,255,0.4); color: var(--color-text); }

        .danger-zone-fui { border-color: rgba(248,113,113,0.3); }
        .danger-zone-fui .section-header-fui { border-color: rgba(248,113,113,0.3); }
        .danger-zone-fui .section-title-fui { color: #f87171; }
        .btn-danger-fui { padding: 12px 24px; background: transparent; color: #f87171; border: 1px solid rgba(248,113,113,0.3); border-radius: 8px; font-family: var(--font-mono); font-size: 0.75rem; letter-spacing: 0.05em; cursor: pointer; transition: all 0.2s; }
        .btn-danger-fui:hover { background: rgba(248,113,113,0.1); border-color: #f87171; }
      `}</style>

      <div className="settings-fui">
        <div className="page-header-fui">
          <h1 className="page-title-fui">CONFIGURACION</h1>
          <p className="page-subtitle">GESTION DE CUENTA Y PREFERENCIAS</p>
        </div>

        <div className="settings-section-fui">
          <div className="section-header-fui">
            <h2 className="section-title-fui">◇ PERFIL</h2>
            <p className="section-description-fui">INFORMACION BASICA DE TU CUENTA</p>
          </div>
          <div className="section-body-fui">
            <div className="form-row-fui">
              <div className="form-group-fui">
                <label className="form-label-fui" htmlFor="user-name">NOMBRE</label>
                <input
                  id="user-name"
                  type="text"
                  className="form-input-fui"
                  value={user.name}
                  onChange={e => setUser({ ...user, name: e.target.value })}
                  placeholder="Tu nombre..."
                />
              </div>
              <div className="form-group-fui">
                <label className="form-label-fui" htmlFor="user-email">EMAIL</label>
                <input
                  id="user-email"
                  type="email"
                  className="form-input-fui"
                  value={user.email}
                  disabled
                />
              </div>
            </div>
            <div className="form-group-fui">
              <label className="form-label-fui" htmlFor="user-department">DEPARTAMENTO</label>
              <input
                id="user-department"
                type="text"
                className="form-input-fui"
                placeholder="Ej: Ventas, Operaciones..."
              />
            </div>
            <div className="btn-row-fui">
              <button type="button" className="btn-primary-fui">GUARDAR CAMBIOS</button>
              <button type="button" className="btn-secondary-fui">CANCELAR</button>
            </div>
          </div>
        </div>

        <div className="settings-section-fui">
          <div className="section-header-fui">
            <h2 className="section-title-fui">◇ NOTIFICACIONES</h2>
            <p className="section-description-fui">CONFIGURA COMO RECIBIR ALERTAS</p>
          </div>
          <div className="section-body-fui">
            <div className="toggle-row-fui">
              <div className="toggle-info-fui">
                <div className="toggle-label-fui">Notificaciones por email</div>
                <div className="toggle-description-fui">Recibe alertas importantes en tu correo</div>
              </div>
              <div
                className={`toggle-switch-fui ${notifications.email ? 'on' : ''}`}
                role="switch"
                aria-checked={notifications.email ? 'true' : 'false'}
                aria-label="Notificaciones por email"
                title="Notificaciones por email"
                onClick={() => setNotifications({ ...notifications, email: !notifications.email })}
                onKeyDown={e => e.key === 'Enter' && setNotifications({ ...notifications, email: !notifications.email })}
                tabIndex={0}
              />
            </div>
            <div className="toggle-row-fui">
              <div className="toggle-info-fui">
                <div className="toggle-label-fui">Notificaciones push</div>
                <div className="toggle-description-fui">Alertas en tiempo real en el navegador</div>
              </div>
              <div
                className={`toggle-switch-fui ${notifications.push ? 'on' : ''}`}
                role="switch"
                aria-checked={notifications.push ? 'true' : 'false'}
                aria-label="Notificaciones push"
                title="Notificaciones push"
                onClick={() => setNotifications({ ...notifications, push: !notifications.push })}
                onKeyDown={e => e.key === 'Enter' && setNotifications({ ...notifications, push: !notifications.push })}
                tabIndex={0}
              />
            </div>
            <div className="toggle-row-fui">
              <div className="toggle-info-fui">
                <div className="toggle-label-fui">Resumen semanal</div>
                <div className="toggle-description-fui">Informe de actividad cada lunes</div>
              </div>
              <div
                className={`toggle-switch-fui ${notifications.weekly ? 'on' : ''}`}
                role="switch"
                aria-checked={notifications.weekly ? 'true' : 'false'}
                aria-label="Resumen semanal"
                title="Resumen semanal"
                onClick={() => setNotifications({ ...notifications, weekly: !notifications.weekly })}
                onKeyDown={e => e.key === 'Enter' && setNotifications({ ...notifications, weekly: !notifications.weekly })}
                tabIndex={0}
              />
            </div>
          </div>
        </div>

        <div className="settings-section-fui">
          <div className="section-header-fui">
            <h2 className="section-title-fui">◇ SEGURIDAD</h2>
            <p className="section-description-fui">OPCIONES DE SEGURIDAD DE LA CUENTA</p>
          </div>
          <div className="section-body-fui">
            <div className="toggle-row-fui">
              <div className="toggle-info-fui">
                <div className="toggle-label-fui">Autenticacion de dos factores</div>
                <div className="toggle-description-fui">Anade una capa extra de seguridad</div>
              </div>
              <div
                className={`toggle-switch-fui ${security.twoFactor ? 'on' : ''}`}
                role="switch"
                aria-checked={security.twoFactor ? 'true' : 'false'}
                aria-label="Autenticacion de dos factores"
                title="Autenticacion de dos factores"
                onClick={() => setSecurity({ ...security, twoFactor: !security.twoFactor })}
                onKeyDown={e => e.key === 'Enter' && setSecurity({ ...security, twoFactor: !security.twoFactor })}
                tabIndex={0}
              />
            </div>
            <div className="toggle-row-fui">
              <div className="toggle-info-fui">
                <div className="toggle-label-fui">Sesiones activas</div>
                <div className="toggle-description-fui">Gestiona los dispositivos conectados</div>
              </div>
              <button type="button" className="btn-secondary-fui">VER SESIONES</button>
            </div>
          </div>
        </div>

        <div className="settings-section-fui danger-zone-fui">
          <div className="section-header-fui">
            <h2 className="section-title-fui">◇ ZONA DE PELIGRO</h2>
            <p className="section-description-fui">ACCIONES IRREVERSIBLES</p>
          </div>
          <div className="section-body-fui">
            <div className="toggle-row-fui">
              <div className="toggle-info-fui">
                <div className="toggle-label-fui">Cerrar todas las sesiones</div>
                <div className="toggle-description-fui">Desconectar de todos los dispositivos</div>
              </div>
              <button type="button" className="btn-danger-fui">CERRAR SESIONES</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
