/**
 * SISTEMA DE TRAZABILIDAD MÁXIMA
 * ================================
 * Tracking ultra detallado de scrapers en tiempo real
 *
 * Features:
 * - Qué hace (acción actual)
 * - Dónde está (URL/página exacta)
 * - Cuándo (timestamps precisos)
 * - Por dónde va (breadcrumb completo)
 * - Qué camino ha hecho (historial)
 * - Cuánto queda (% progreso + ETA)
 */

import { EventEmitter } from 'events';
import { prisma } from './prisma';

export interface TraceStep {
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

export interface TraceProgress {
  current: number;
  total: number;
  percentage: number;
  eta: Date;
  speed: number; // items per minute
  elapsed: number; // milliseconds
  remaining: number; // milliseconds
}

export interface TraceState {
  scraperId: string;
  executionId: string;
  startedAt: Date;
  currentStep: TraceStep;
  breadcrumb: string[]; // Camino actual desde el inicio
  history: TraceStep[]; // Todo el historial
  progress: TraceProgress;
  metadata: {
    clientNIF?: string;
    clientName?: string;
    documentCount?: number;
    [key: string]: any;
  };
}

export class TraceabilityManager extends EventEmitter {
  private states: Map<string, TraceState> = new Map();
  private checkpoints: Map<string, TraceStep[]> = new Map();

  /**
   * Iniciar tracking de un scraper
   */
  async startTracking(
    scraperId: string,
    executionId: string,
    totalSteps: number
  ): Promise<void> {
    const state: TraceState = {
      scraperId,
      executionId,
      startedAt: new Date(),
      currentStep: {
        id: 'init',
        timestamp: new Date(),
        action: 'Iniciando scraper',
        location: {
          url: '',
          title: 'Inicio',
          breadcrumb: ['Inicio'],
        },
        status: 'in_progress',
      },
      breadcrumb: ['Inicio'],
      history: [],
      progress: {
        current: 0,
        total: totalSteps,
        percentage: 0,
        eta: new Date(),
        speed: 0,
        elapsed: 0,
        remaining: 0,
      },
      metadata: {},
    };

    this.states.set(executionId, state);
    this.emit('tracking:started', state);

    // Guardar en base de datos
    await this.persistState(state);
  }

  /**
   * Registrar un paso/acción
   */
  async recordStep(
    executionId: string,
    action: string,
    location: {
      url: string;
      title: string;
      selector?: string;
    },
    data?: Record<string, any>,
    screenshot?: string
  ): Promise<void> {
    const state = this.states.get(executionId);
    if (!state) {
      throw new Error(`No tracking found for execution ${executionId}`);
    }

    // Completar paso anterior
    if (state.currentStep.status === 'in_progress') {
      state.currentStep.status = 'completed';
      state.currentStep.duration = Date.now() - state.currentStep.timestamp.getTime();
      state.history.push({ ...state.currentStep });
    }

    // Actualizar breadcrumb (camino)
    const breadcrumb = [...state.breadcrumb, location.title];

    // Crear nuevo paso
    const newStep: TraceStep = {
      id: `step-${state.history.length + 1}`,
      timestamp: new Date(),
      action,
      location: {
        ...location,
        breadcrumb,
      },
      data,
      screenshot,
      status: 'in_progress',
    };

    state.currentStep = newStep;
    state.breadcrumb = breadcrumb;
    state.progress.current++;

    // Calcular progreso y ETA
    this.updateProgress(state);

    // Emitir evento en tiempo real
    this.emit('step:recorded', {
      executionId,
      step: newStep,
      progress: state.progress,
      breadcrumb: state.breadcrumb,
    });

    // Guardar en DB
    await this.persistStep(executionId, newStep);
    await this.persistState(state);

    // Log detallado
    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📍 TRAZABILIDAD | ${new Date().toISOString()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎯 QUÉ HACE:    ${action}
🌐 DÓNDE:       ${location.url}
📄 PÁGINA:      ${location.title}
🧭 CAMINO:      ${breadcrumb.join(' → ')}
⏱️  CUÁNDO:      ${newStep.timestamp.toLocaleString('es-ES')}
📊 PROGRESO:    ${state.progress.current}/${state.progress.total} (${state.progress.percentage}%)
⏳ QUEDA:       ${this.formatDuration(state.progress.remaining)}
🎯 ETA:         ${state.progress.eta.toLocaleString('es-ES')}
⚡ VELOCIDAD:   ${state.progress.speed.toFixed(2)} pasos/min
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);
  }

  /**
   * Registrar checkpoint (punto de control)
   */
  async checkpoint(
    executionId: string,
    name: string,
    data?: Record<string, any>
  ): Promise<void> {
    const state = this.states.get(executionId);
    if (!state) return;

    const checkpoint: TraceStep = {
      id: `checkpoint-${name}`,
      timestamp: new Date(),
      action: `Checkpoint: ${name}`,
      location: state.currentStep.location,
      data,
      status: 'completed',
    };

    // Guardar checkpoint
    const checkpoints = this.checkpoints.get(executionId) || [];
    checkpoints.push(checkpoint);
    this.checkpoints.set(executionId, checkpoints);

    this.emit('checkpoint:created', { executionId, checkpoint });

    console.log(`
🔖 CHECKPOINT: ${name}
   Tiempo: ${checkpoint.timestamp.toLocaleString('es-ES')}
   Ubicación: ${state.breadcrumb.join(' → ')}
    `);
  }

  /**
   * Actualizar metadata del cliente actual
   */
  async updateMetadata(
    executionId: string,
    metadata: Record<string, any>
  ): Promise<void> {
    const state = this.states.get(executionId);
    if (!state) return;

    state.metadata = { ...state.metadata, ...metadata };

    this.emit('metadata:updated', { executionId, metadata: state.metadata });
    await this.persistState(state);
  }

  /**
   * Retroceder en el breadcrumb (volver atrás)
   */
  async navigateBack(executionId: string, steps: number = 1): Promise<void> {
    const state = this.states.get(executionId);
    if (!state) return;

    state.breadcrumb = state.breadcrumb.slice(0, -steps);

    this.emit('breadcrumb:updated', { executionId, breadcrumb: state.breadcrumb });
  }

  /**
   * Finalizar tracking
   */
  async endTracking(
    executionId: string,
    status: 'success' | 'failed',
    error?: string
  ): Promise<void> {
    const state = this.states.get(executionId);
    if (!state) return;

    state.currentStep.status = status === 'success' ? 'completed' : 'failed';
    state.currentStep.error = error;
    state.history.push({ ...state.currentStep });

    const summary = {
      executionId,
      scraperId: state.scraperId,
      duration: Date.now() - state.startedAt.getTime(),
      totalSteps: state.history.length,
      status,
      error,
    };

    this.emit('tracking:ended', summary);

    console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ SCRAPER FINALIZADO
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📊 Total pasos: ${summary.totalSteps}
⏱️  Duración: ${this.formatDuration(summary.duration)}
🎯 Estado: ${status.toUpperCase()}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    `);

    // Guardar estado final
    await this.persistState(state);

    // Limpiar de memoria (opcional)
    // this.states.delete(executionId);
  }

  /**
   * Obtener estado actual
   */
  getState(executionId: string): TraceState | undefined {
    return this.states.get(executionId);
  }

  /**
   * Obtener historial completo
   */
  getHistory(executionId: string): TraceStep[] {
    const state = this.states.get(executionId);
    return state ? state.history : [];
  }

  /**
   * Obtener checkpoints
   */
  getCheckpoints(executionId: string): TraceStep[] {
    return this.checkpoints.get(executionId) || [];
  }

  /**
   * Calcular progreso y ETA
   */
  private updateProgress(state: TraceState): void {
    const elapsed = Date.now() - state.startedAt.getTime();
    const percentage = (state.progress.current / state.progress.total) * 100;
    const speed = (state.progress.current / elapsed) * 60000; // pasos por minuto

    const remaining = state.progress.total - state.progress.current;
    const remainingTime = remaining > 0 ? (remaining / speed) * 60000 : 0;

    state.progress = {
      current: state.progress.current,
      total: state.progress.total,
      percentage: Math.min(100, percentage),
      eta: new Date(Date.now() + remainingTime),
      speed,
      elapsed,
      remaining: remainingTime,
    };
  }

  /**
   * Formatear duración
   */
  private formatDuration(ms: number): string {
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

  /**
   * Persistir estado en base de datos
   */
  private async persistState(state: TraceState): Promise<void> {
    try {
      await prisma.scraperExecution.update({
        where: { id: state.executionId },
        data: {
          currentStep: JSON.stringify(state.currentStep),
          breadcrumb: state.breadcrumb,
          progress: state.progress.percentage,
          metadata: state.metadata as any,
        },
      });
    } catch (error) {
      console.error('Error persisting state:', error);
    }
  }

  /**
   * Persistir paso en base de datos
   */
  private async persistStep(executionId: string, step: TraceStep): Promise<void> {
    try {
      await prisma.scraperLog.create({
        data: {
          executionId,
          level: 'info',
          message: step.action,
          timestamp: step.timestamp,
          metadata: {
            step: step.id,
            location: step.location,
            breadcrumb: step.location.breadcrumb,
            data: step.data,
            status: step.status,
          } as any,
        },
      });
    } catch (error) {
      console.error('Error persisting step:', error);
    }
  }
}

// Singleton instance
export const traceManager = new TraceabilityManager();
