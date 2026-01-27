import { Injectable } from '@nestjs/common';

@Injectable()
export class WorkflowsService {
  private workflows = [
    { id: '1', name: 'Onboarding Cliente', status: 'ACTIVE', steps: 5, completedSteps: 3 },
    { id: '2', name: 'Emisión Póliza', status: 'ACTIVE', steps: 7, completedSteps: 7 },
    { id: '3', name: 'Gestión Siniestro', status: 'PAUSED', steps: 10, completedSteps: 4 },
  ];

  async findAll() {
    return this.workflows;
  }

  async findOne(id: string) {
    return this.workflows.find(w => w.id === id);
  }

  async create(data: any) {
    const newWorkflow = { id: Date.now().toString(), ...data, status: 'DRAFT', completedSteps: 0 };
    this.workflows.push(newWorkflow);
    return newWorkflow;
  }

  async execute(id: string) {
    const workflow = this.workflows.find(w => w.id === id);
    if (workflow) {
      workflow.status = 'ACTIVE';
      return { ...workflow, message: 'Workflow iniciado' };
    }
    return null;
  }

  async pause(id: string) {
    const workflow = this.workflows.find(w => w.id === id);
    if (workflow) {
      workflow.status = 'PAUSED';
      return workflow;
    }
    return null;
  }
}
