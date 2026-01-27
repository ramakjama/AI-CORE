import { Injectable } from '@nestjs/common';
import { cfoAgent } from '@ai-core/ai-agents';
import { agentOrchestrator } from '@ai-core/ai-agents';

@Injectable()
export class AIAgentsService {
  /**
   * Analizar flujo de caja con CFO Copilot
   */
  async analyzeCashFlow(data: any) {
    return cfoAgent.analyzeCashFlow(data);
  }

  /**
   * Optimizar presupuesto
   */
  async optimizeBudget(currentBudget: any, constraints?: any) {
    return cfoAgent.optimizeBudget(currentBudget, constraints);
  }

  /**
   * Detectar anomalías financieras
   */
  async detectAnomalies(historical: any, current: any) {
    return cfoAgent.detectAnomalies(historical, current);
  }

  /**
   * Generar reporte ejecutivo
   */
  async generateReport(data: any, period: string) {
    return cfoAgent.generateExecutiveReport(data, period);
  }

  /**
   * Chat con CFO Copilot
   */
  async chat(message: string, context?: any) {
    return cfoAgent.chat(message, context);
  }

  /**
   * Ejecutar tarea con orquestador
   */
  async executeTask(type: string, input: any, priority: 'high' | 'medium' | 'low' = 'medium') {
    return agentOrchestrator.executeTask({
      type: type as any,
      input,
      priority,
    });
  }

  /**
   * Obtener estado de tarea
   */
  async getTaskStatus(taskId: string) {
    return agentOrchestrator.getTask(taskId);
  }

  /**
   * Obtener estadísticas de agentes
   */
  async getStats() {
    return agentOrchestrator.getStats();
  }

  /**
   * Listar todas las tareas
   */
  async getAllTasks() {
    return agentOrchestrator.getAllTasks();
  }
}
