'use client';

import { useState, useEffect } from 'react';
import { useParams, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  LayoutDashboard,
  User,
  Phone,
  Wallet,
  Briefcase,
  Building2,
  Users,
  UsersRound,
  Settings,
  Heart,
  Home as HomeIcon,
  Network,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface ClientData {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export default function ClientDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const params = useParams();
  const pathname = usePathname();
  const clientId = params.clientId as string;

  const [client, setClient] = useState<ClientData | null>(null);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadClientData();
  }, [clientId]);

  const loadClientData = async () => {
    try {
      const response = await fetch(`/api/clients/${clientId}`);
      if (response.ok) {
        const data = await response.json();
        setClient(data);
      }
    } catch (error) {
      console.error('Error loading client:', error);
    } finally {
      setLoading(false);
    }
  };

  const sections = [
    {
      id: 'overview',
      name: 'Vista General',
      icon: LayoutDashboard,
      path: `/clients/${clientId}/overview`,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20'
    },
    {
      id: 'profile',
      name: 'Perfil Completo',
      icon: User,
      path: `/clients/${clientId}/profile`,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50 dark:bg-purple-900/20'
    },
    {
      id: 'contact',
      name: 'Información de Contacto',
      icon: Phone,
      path: `/clients/${clientId}/contact`,
      color: 'text-green-600',
      bgColor: 'bg-green-50 dark:bg-green-900/20'
    },
    {
      id: 'economic',
      name: 'Situación Económica',
      icon: Wallet,
      path: `/clients/${clientId}/economic`,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50 dark:bg-emerald-900/20'
    },
    {
      id: 'labor',
      name: 'Situación Laboral',
      icon: Briefcase,
      path: `/clients/${clientId}/labor`,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50 dark:bg-orange-900/20'
    },
    {
      id: 'financial',
      name: 'Datos Financieros',
      icon: Building2,
      path: `/clients/${clientId}/financial`,
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50 dark:bg-indigo-900/20'
    },
    {
      id: 'social',
      name: 'Entorno Social',
      icon: Users,
      path: `/clients/${clientId}/social`,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50 dark:bg-pink-900/20'
    },
    {
      id: 'family',
      name: 'Familia y Dependientes',
      icon: UsersRound,
      path: `/clients/${clientId}/family`,
      color: 'text-rose-600',
      bgColor: 'bg-rose-50 dark:bg-rose-900/20'
    },
    {
      id: 'preferences',
      name: 'Preferencias y Comportamiento',
      icon: Settings,
      path: `/clients/${clientId}/preferences`,
      color: 'text-cyan-600',
      bgColor: 'bg-cyan-50 dark:bg-cyan-900/20'
    },
    {
      id: 'hobbies',
      name: 'Aficiones e Intereses',
      icon: Heart,
      path: `/clients/${clientId}/hobbies`,
      color: 'text-red-600',
      bgColor: 'bg-red-50 dark:bg-red-900/20'
    },
    {
      id: 'assets',
      name: 'Patrimonio',
      icon: HomeIcon,
      path: `/clients/${clientId}/assets`,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20'
    },
    {
      id: 'relations',
      name: 'Relaciones y Grafo Social',
      icon: Network,
      path: `/clients/${clientId}/relations`,
      color: 'text-violet-600',
      bgColor: 'bg-violet-50 dark:bg-violet-900/20'
    }
  ];

  const isActive = (path: string) => pathname === path;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarCollapsed ? 'w-20' : 'w-72'
        } bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-4">
            <Link
              href="/clients"
              className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            >
              {!sidebarCollapsed && '← Volver a Clientes'}
            </Link>
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              ) : (
                <ChevronLeft className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              )}
            </button>
          </div>

          {/* Client Info */}
          {!sidebarCollapsed && client && (
            <div className="flex items-center gap-3 p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
              <div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                {client.name.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                  {client.name}
                </h3>
                <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                  {client.email}
                </p>
              </div>
            </div>
          )}

          {sidebarCollapsed && client && (
            <div className="flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-600 to-purple-600 flex items-center justify-center text-white font-semibold">
                {client.name.charAt(0).toUpperCase()}
              </div>
            </div>
          )}
        </div>

        {/* Title */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600">
            <h2 className="text-lg font-bold text-white">Cliente 360°</h2>
            <p className="text-xs text-blue-100">Vista completa del cliente</p>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-1 px-2">
            {sections.map((section) => {
              const Icon = section.icon;
              const active = isActive(section.path);

              return (
                <li key={section.id}>
                  <Link
                    href={section.path}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${
                      active
                        ? `${section.bgColor} ${section.color} font-medium shadow-sm`
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                    title={sidebarCollapsed ? section.name : undefined}
                  >
                    <Icon className={`w-5 h-5 ${active ? section.color : ''}`} />
                    {!sidebarCollapsed && (
                      <span className="text-sm">{section.name}</span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Footer */}
        {!sidebarCollapsed && (
          <div className="p-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              Sistema Cliente 360°
              <br />
              Versión 1.0
            </div>
          </div>
        )}
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
