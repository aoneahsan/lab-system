import { toast } from '@/stores/toast.store';

interface WorkflowStep {
  id: string;
  type: 'condition' | 'action' | 'notification' | 'approval';
  name: string;
  config: Record<string, any>;
  nextSteps?: string[];
}

interface WorkflowContext {
  data: Record<string, any>;
  variables: Record<string, any>;
  history: Array<{
    stepId: string;
    timestamp: Date;
    result: any;
  }>;
}

export class WorkflowExecutionEngine {
  private context: WorkflowContext;
  private steps: Map<string, WorkflowStep>;
  private executionStack: string[] = [];

  constructor(steps: WorkflowStep[]) {
    this.steps = new Map(steps.map(step => [step.id, step]));
    this.context = {
      data: {},
      variables: {},
      history: [],
    };
  }

  async execute(startStepId: string, initialData: Record<string, any>) {
    this.context.data = initialData;
    this.executionStack = [startStepId];

    while (this.executionStack.length > 0) {
      const currentStepId = this.executionStack.shift()!;
      const step = this.steps.get(currentStepId);

      if (!step) {
        console.error(`Step ${currentStepId} not found`);
        continue;
      }

      try {
        const result = await this.executeStep(step);
        
        this.context.history.push({
          stepId: step.id,
          timestamp: new Date(),
          result,
        });

        if (result && step.nextSteps) {
          this.executionStack.push(...step.nextSteps);
        }
      } catch (error) {
        console.error(`Error executing step ${step.id}:`, error);
        toast.error('Workflow Error', `Failed to execute step: ${step.name}`);
        throw error;
      }
    }

    return this.context;
  }

  private async executeStep(step: WorkflowStep): Promise<any> {
    switch (step.type) {
      case 'condition':
        return this.evaluateCondition(step);
      case 'action':
        return this.executeAction(step);
      case 'notification':
        return this.sendNotification(step);
      case 'approval':
        return this.requestApproval(step);
      default:
        throw new Error(`Unknown step type: ${step.type}`);
    }
  }

  private evaluateCondition(step: WorkflowStep): boolean {
    const { condition } = step.config;
    
    try {
      const func = new Function('data', 'variables', `return ${condition}`);
      return func(this.context.data, this.context.variables);
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  private async executeAction(step: WorkflowStep): Promise<any> {
    const { actionType, params } = step.config;

    switch (actionType) {
      case 'create-task':
        return this.createTask(params);
      case 'update-status':
        return this.updateStatus(params);
      case 'escalate':
        return this.escalate(params);
      default:
        console.warn(`Unknown action type: ${actionType}`);
        return null;
    }
  }

  private async createTask(params: any) {
    const task = {
      id: `task_${Date.now()}`,
      type: params.taskType,
      priority: params.priority || 'medium',
      assignedTo: params.assignTo,
      description: params.description,
      dueDate: params.dueDate || new Date(Date.now() + 24 * 60 * 60 * 1000),
      createdAt: new Date(),
    };

    toast.info('Task Created', `${task.type} task assigned to ${task.assignedTo}`);
    return task;
  }

  private async updateStatus(params: any) {
    const { entityType, entityId, newStatus } = params;
    
    toast.info('Status Updated', `${entityType} ${entityId} status changed to ${newStatus}`);
    return { entityType, entityId, newStatus };
  }

  private async escalate(params: any) {
    const { level, reason } = params;
    
    toast.warning('Escalation', `Issue escalated to level ${level}: ${reason}`);
    return { level, reason, timestamp: new Date() };
  }

  private async sendNotification(step: WorkflowStep): Promise<any> {
    const { channel, recipients, template, message } = step.config;

    const notification = {
      id: `notif_${Date.now()}`,
      channel,
      recipients: Array.isArray(recipients) ? recipients : [recipients],
      template,
      message: message || this.renderTemplate(template),
      sentAt: new Date(),
    };

    switch (channel) {
      case 'sms':
        toast.success('SMS Sent', `Notification sent to ${notification.recipients.join(', ')}`);
        break;
      case 'email':
        toast.success('Email Sent', `Email sent to ${notification.recipients.join(', ')}`);
        break;
      case 'push':
        toast.success('Push Sent', `Push notification sent`);
        break;
    }

    return notification;
  }

  private renderTemplate(templateId: string): string {
    const templates: Record<string, string> = {
      'critical-result': 'Critical result detected requiring immediate attention',
      'tat-breach': 'Turnaround time threshold exceeded',
      'qc-failure': 'Quality control check failed',
      'inventory-low': 'Inventory levels are critically low',
    };

    return templates[templateId] || 'Notification from workflow automation';
  }

  private async requestApproval(step: WorkflowStep): Promise<any> {
    const { approvers, timeout, escalationPath } = step.config;

    const approval = {
      id: `approval_${Date.now()}`,
      requestedFrom: approvers,
      requestedAt: new Date(),
      timeout: timeout || 24 * 60 * 60 * 1000,
      escalationPath,
      status: 'pending',
    };

    toast.info('Approval Requested', `Waiting for approval from ${approvers.join(', ')}`);
    
    setTimeout(() => {
      approval.status = 'auto-approved';
      toast.success('Auto-Approved', 'Request auto-approved due to timeout');
    }, 5000);

    return approval;
  }
}

export const executeWorkflow = async (
  workflowName: string,
  steps: WorkflowStep[],
  initialData: Record<string, any>
) => {
  const engine = new WorkflowExecutionEngine(steps);
  
  try {
    const result = await engine.execute(steps[0].id, initialData);
    toast.success('Workflow Complete', `${workflowName} executed successfully`);
    return result;
  } catch (error) {
    toast.error('Workflow Failed', `Failed to execute ${workflowName}`);
    throw error;
  }
};