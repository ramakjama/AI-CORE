'use client';

/**
 * VISUALIZADOR DE TRAZABILIDAD EN TIEMPO REAL
 * ============================================
 * Componente que muestra la trazabilidad completa del scraper
 */

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Activity,
  MapPin,
  Clock,
  Navigation,
  TrendingUp,
  Timer,
  Zap,
  CheckCircle2,
  Circle,
  XCircle,
} from 'lucide-react';
import { io, Socket } from 'socket.io-client';

interface TraceStep {
  id: string;
  timestamp: Date;
  action: string;
  location: {
    url: string;
    title: string;
    selector?: string;
    breadcrumb: string[];
  };
  data?: Record<string, any>;
  screenshot?: string;
  duration?: number;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  error?: string;
}

interface TraceProgress {
  current: number;
  total: number;
  percentage: number;
  eta: Date;
  speed: number;
  elapsed: number;
  remaining: number;
}

interface TraceState {
  scraperId: string;
  executionId: string;
  startedAt: Date;
  currentStep: TraceStep;
  breadcrumb: string[];
  history: TraceStep[];
  progress: TraceProgress;
  metadata: Record<string, any>;
}

interface Props {
  executionId: string;
}

export function TraceabilityViewer({ executionId }: Props) {
  const [state, setState] = useState<TraceState | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);

  useEffect(() => {
    // Conectar a WebSocket para updates en tiempo real
    const newSocket = io('http://localhost:3001', {
      query: { executionId },
    });

    newSocket.on('trace:update', (data: TraceState) => {
      setState(data);
    });

    newSocket.on('step:recorded', (data: any) => {
      setState((prev) => {
        if (!prev) return null;
        return {
          ...prev,
          currentStep: data.step,
          progress: data.progress,
          breadcrumb: data.breadcrumb,
          history: [...prev.history, data.step],
        };
      });
    });

    setSocket(newSocket);

    // Cargar estado inicial
    fetch(`/api/trace/${executionId}`)
      .then((res) => res.json())
      .then((data) => setState(data));

    return () => {
      newSocket.close();
    };
  }, [executionId]);

  if (!state) {
    return <div className="flex items-center justify-center p-8">Cargando trazabilidad...</div>;
  }

  return (
    <div className="space-y-6">
      {/* RESUMEN PRINCIPAL */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Trazabilidad en Tiempo Real
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* PROGRESO */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progreso</span>
              <span className="font-mono font-bold">
                {state.progress.current} / {state.progress.total} ({state.progress.percentage.toFixed(1)}%)
              </span>
            </div>
            <Progress value={state.progress.percentage} className="h-3" />
          </div>

          {/* MÉTRICAS CLAVE */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricCard
              icon={Clock}
              label="Tiempo Transcurrido"
              value={formatDuration(state.progress.elapsed)}
              variant="default"
            />
            <MetricCard
              icon={Timer}
              label="Tiempo Restante"
              value={formatDuration(state.progress.remaining)}
              variant="warning"
            />
            <MetricCard
              icon={TrendingUp}
              label="ETA"
              value={new Date(state.progress.eta).toLocaleTimeString('es-ES')}
              variant="info"
            />
            <MetricCard
              icon={Zap}
              label="Velocidad"
              value={`${state.progress.speed.toFixed(1)} pasos/min`}
              variant="success"
            />
          </div>
        </CardContent>
      </Card>

      {/* QUÉ ESTÁ HACIENDO AHORA */}
      <Card className="border-primary">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-primary">
            <Activity className="h-5 w-5 animate-pulse" />
            Acción Actual
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-4">
            <div className="rounded-full bg-primary/10 p-3">
              <Activity className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 space-y-2">
              <h3 className="text-lg font-semibold">{state.currentStep.action}</h3>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Clock className="h-4 w-4" />
                <span>{new Date(state.currentStep.timestamp).toLocaleString('es-ES')}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span className="truncate">{state.currentStep.location.url || 'N/A'}</span>
              </div>
            </div>
            <Badge
              variant={
                state.currentStep.status === 'completed'
                  ? 'default'
                  : state.currentStep.status === 'in_progress'
                  ? 'secondary'
                  : 'destructive'
              }
            >
              {state.currentStep.status}
            </Badge>
          </div>

          {/* Screenshot si existe */}
          {state.currentStep.screenshot && (
            <div className="rounded-lg border p-2">
              <img
                src={state.currentStep.screenshot}
                alt="Screenshot actual"
                className="w-full rounded"
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* CAMINO ACTUAL (BREADCRUMB) */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Navigation className="h-5 w-5" />
            Camino Actual
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center gap-2">
            {state.breadcrumb.map((crumb, index) => (
              <div key={index} className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono">
                  {crumb}
                </Badge>
                {index < state.breadcrumb.length - 1 && (
                  <span className="text-muted-foreground">→</span>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* HISTORIAL COMPLETO */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5" />
              Historial de Pasos
            </div>
            <Badge variant="secondary">{state.history.length} pasos completados</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px] pr-4">
            <div className="space-y-4">
              {state.history.map((step, index) => (
                <div key={step.id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div
                      className={`rounded-full p-2 ${
                        step.status === 'completed'
                          ? 'bg-green-100 text-green-600'
                          : step.status === 'failed'
                          ? 'bg-red-100 text-red-600'
                          : 'bg-gray-100 text-gray-600'
                      }`}
                    >
                      {step.status === 'completed' ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : step.status === 'failed' ? (
                        <XCircle className="h-4 w-4" />
                      ) : (
                        <Circle className="h-4 w-4" />
                      )}
                    </div>
                    {index < state.history.length - 1 && (
                      <div className="h-full w-px bg-border my-2" />
                    )}
                  </div>
                  <div className="flex-1 pb-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold">{step.action}</h4>
                        <p className="text-sm text-muted-foreground">{step.location.title}</p>
                        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {new Date(step.timestamp).toLocaleTimeString('es-ES')}
                          </span>
                          {step.duration && (
                            <span className="flex items-center gap-1">
                              <Timer className="h-3 w-3" />
                              {formatDuration(step.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        #{index + 1}
                      </Badge>
                    </div>
                    {step.error && (
                      <div className="mt-2 rounded-md bg-red-50 p-2 text-sm text-red-600">
                        {step.error}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* METADATA DEL CLIENTE ACTUAL */}
      {Object.keys(state.metadata).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Metadata del Cliente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(state.metadata).map(([key, value]) => (
                <div key={key} className="space-y-1">
                  <p className="text-sm text-muted-foreground capitalize">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </p>
                  <p className="font-mono font-semibold">{String(value)}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  variant,
}: {
  icon: any;
  label: string;
  value: string;
  variant: 'default' | 'success' | 'warning' | 'info';
}) {
  const colors = {
    default: 'text-gray-600 bg-gray-100',
    success: 'text-green-600 bg-green-100',
    warning: 'text-orange-600 bg-orange-100',
    info: 'text-blue-600 bg-blue-100',
  };

  return (
    <div className="flex flex-col gap-2 rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <div className={`rounded-full p-2 ${colors[variant]}`}>
          <Icon className="h-4 w-4" />
        </div>
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="font-mono text-lg font-bold">{value}</p>
    </div>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}
