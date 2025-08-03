export interface WorkflowRule {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  
  // Trigger conditions
  trigger: {
    type: 'sample_registered' | 'result_entered' | 'result_validated' | 'tat_warning' | 'qc_failure' | 'critical_value' | 'scheduled';
    conditions?: {
      field: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in';
      value: any;
    }[];
    schedule?: {
      frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
      time?: string; // HH:mm format
      dayOfWeek?: number; // 0-6 for weekly
      dayOfMonth?: number; // 1-31 for monthly
    };
  };
  
  // Actions to perform
  actions: WorkflowAction[];
  
  // Execution control
  priority: 'low' | 'medium' | 'high' | 'critical';
  maxRetries: number;
  retryDelay: number; // minutes
  stopOnError: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastExecutedAt?: Date;
  executionCount: number;
  tenantId: string;
}

export interface WorkflowAction {
  id: string;
  type: 'route_sample' | 'auto_verify' | 'send_alert' | 'create_task' | 'update_status' | 'assign_to_user' | 'escalate' | 'api_call';
  
  // Action-specific parameters
  parameters: {
    // For route_sample
    targetDepartment?: string;
    targetUser?: string;
    priority?: string;
    
    // For auto_verify
    verificationCriteria?: {
      checkDelta?: boolean;
      maxDeltaPercent?: number;
      checkCriticalValues?: boolean;
      checkQCStatus?: boolean;
    };
    
    // For send_alert
    recipients?: string[];
    recipientRoles?: string[];
    alertType?: 'email' | 'sms' | 'in_app' | 'all';
    template?: string;
    
    // For create_task
    taskTitle?: string;
    taskDescription?: string;
    assignTo?: string;
    dueInMinutes?: number;
    
    // For update_status
    newStatus?: string;
    addComment?: string;
    
    // For escalate
    escalationLevel?: number;
    escalationPath?: string[];
    
    // For api_call
    endpoint?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
    headers?: Record<string, string>;
    body?: any;
  };
  
  // Conditional execution
  condition?: {
    field: string;
    operator: string;
    value: any;
  };
}

export interface WorkflowExecution {
  id: string;
  ruleId: string;
  ruleName: string;
  
  // Trigger details
  triggeredBy: {
    type: string;
    entityId?: string;
    entityType?: string;
    userId?: string;
  };
  
  // Execution details
  status: 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';
  startedAt: Date;
  completedAt?: Date;
  duration?: number; // milliseconds
  
  // Actions executed
  actionsExecuted: Array<{
    actionId: string;
    actionType: string;
    status: 'success' | 'failed' | 'skipped';
    startedAt: Date;
    completedAt: Date;
    result?: any;
    error?: string;
  }>;
  
  // Error handling
  retryCount: number;
  lastError?: string;
  
  // Metadata
  tenantId: string;
}

export interface TATRule {
  id: string;
  name: string;
  isActive: boolean;
  
  // TAT configuration
  testIds?: string[];
  testCategories?: string[];
  applyToAll: boolean;
  
  // Time limits (in minutes)
  targetTAT: number;
  warningThreshold: number; // e.g., 80% of target TAT
  criticalThreshold: number; // e.g., 90% of target TAT
  
  // Actions for each threshold
  warningActions: WorkflowAction[];
  criticalActions: WorkflowAction[];
  breachActions: WorkflowAction[];
  
  // Business hours consideration
  considerBusinessHours: boolean;
  businessHours?: {
    start: string; // HH:mm
    end: string; // HH:mm
    workingDays: number[]; // 0-6
  };
  
  // Exclusions
  excludeStats: boolean; // Exclude STAT orders
  excludeUrgent: boolean;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface AutoVerificationRule {
  id: string;
  name: string;
  isActive: boolean;
  
  // Test configuration
  testId: string;
  testName: string;
  
  // Verification criteria
  criteria: {
    // Result value checks
    normalRangeCheck: boolean;
    deltaCheck: boolean;
    deltaPercent?: number;
    deltaAbsolute?: number;
    
    // Critical value checks
    criticalValueCheck: boolean;
    
    // QC checks
    requireQCPass: boolean;
    qcWithinHours?: number;
    
    // Instrument checks
    instrumentCheck: boolean;
    allowedInstruments?: string[];
    
    // Sample checks
    sampleIntegrityCheck: boolean;
    
    // History checks
    consistencyCheck: boolean;
    maxHistoricalDeviation?: number;
  };
  
  // Actions on verification
  onAutoVerify: WorkflowAction[];
  onFailure: WorkflowAction[];
  
  // Metadata
  successCount: number;
  failureCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  category: 'sample_processing' | 'result_review' | 'qc' | 'maintenance' | 'administrative';
  
  // Task details
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDuration: number; // minutes
  
  // Assignment rules
  assignmentType: 'user' | 'role' | 'department' | 'round_robin' | 'load_balanced';
  assignTo?: string;
  assignToRole?: string;
  assignToDepartment?: string;
  
  // Checklist items
  checklistItems?: Array<{
    id: string;
    text: string;
    required: boolean;
  }>;
  
  // SLAs
  sla?: {
    responseTime: number; // minutes
    completionTime: number; // minutes
  };
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface WorkflowTask {
  id: string;
  templateId?: string;
  
  // Task details
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  category: string;
  
  // Assignment
  assignedTo?: string;
  assignedToName?: string;
  assignedBy: string;
  assignedAt: Date;
  
  // Related entities
  relatedEntity?: {
    type: 'sample' | 'result' | 'patient' | 'instrument' | 'qc';
    id: string;
    displayName: string;
  };
  
  // Status and timing
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'overdue';
  dueAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  
  // Checklist
  checklist?: Array<{
    id: string;
    text: string;
    completed: boolean;
    completedAt?: Date;
    completedBy?: string;
  }>;
  
  // Comments and notes
  comments: Array<{
    id: string;
    text: string;
    userId: string;
    userName: string;
    createdAt: Date;
  }>;
  
  // Escalation
  escalationLevel: number;
  escalatedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface SampleRoutingRule {
  id: string;
  name: string;
  isActive: boolean;
  priority: number; // For rule ordering
  
  // Conditions
  conditions: {
    testTypes?: string[];
    sampleTypes?: string[];
    priority?: ('routine' | 'urgent' | 'stat')[];
    departments?: string[];
    customFields?: Record<string, any>;
  };
  
  // Routing logic
  routing: {
    type: 'sequential' | 'parallel' | 'conditional';
    steps: Array<{
      department: string;
      processingTime: number; // estimated minutes
      autoAdvance: boolean;
      conditions?: any[];
    }>;
  };
  
  // Notifications
  notifications: {
    onRouteStart: boolean;
    onStepComplete: boolean;
    onRouteComplete: boolean;
    recipients: string[];
  };
  
  // Metadata
  usageCount: number;
  lastUsed?: Date;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

// Monitoring types
export interface WorkflowMetrics {
  date: Date;
  
  // Rule execution metrics
  totalExecutions: number;
  successfulExecutions: number;
  failedExecutions: number;
  averageExecutionTime: number;
  
  // By rule type
  byRuleType: Record<string, {
    count: number;
    successRate: number;
    avgDuration: number;
  }>;
  
  // TAT metrics
  tatMetrics: {
    onTimePercentage: number;
    averageTAT: number;
    breachCount: number;
    warningCount: number;
  };
  
  // Auto-verification metrics
  autoVerificationMetrics: {
    totalAttempts: number;
    successCount: number;
    successRate: number;
    failureReasons: Record<string, number>;
  };
  
  // Task metrics
  taskMetrics: {
    created: number;
    completed: number;
    overdue: number;
    averageCompletionTime: number;
    escalationCount: number;
  };
}

// Form types
export interface WorkflowRuleFormData {
  name: string;
  description: string;
  isActive: boolean;
  trigger: WorkflowRule['trigger'];
  actions: Omit<WorkflowAction, 'id'>[];
  priority: WorkflowRule['priority'];
  maxRetries: number;
  retryDelay: number;
  stopOnError: boolean;
}

export interface TATRuleFormData {
  name: string;
  isActive: boolean;
  testIds?: string[];
  testCategories?: string[];
  applyToAll: boolean;
  targetTAT: number;
  warningThreshold: number;
  criticalThreshold: number;
  considerBusinessHours: boolean;
  businessHours?: TATRule['businessHours'];
}