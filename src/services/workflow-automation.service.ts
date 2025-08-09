import { 
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useTenantStore } from '@/stores/tenant.store';
import { FIREBASE_COLLECTIONS } from '@/config/firebase-collections';
import type {
  WorkflowRule,
  WorkflowExecution,
  TATRule,
  AutoVerificationRule,
  WorkflowTask,
  SampleRoutingRule,
  WorkflowRuleFormData,
  TATRuleFormData
} from '@/types/workflow-automation.types';

const getCollectionName = (collectionName: string) => {
  const tenantPrefix = useTenantStore.getState().currentTenant?.firebasePrefix || 'labflow_';
  return `${tenantPrefix}${collectionName}`;
};

// Workflow Rules
export const workflowRuleService = {
  async createRule(data: WorkflowRuleFormData): Promise<string> {
    const rulesCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_RULES));
    const ruleDoc = doc(rulesCollection);
    
    const rule: WorkflowRule = {
      id: ruleDoc.id,
      ...data,
      actions: data.actions.map((action, index) => ({
        ...action,
        id: `action_${index}`
      })),
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: '',
      executionCount: 0,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(ruleDoc, rule);
    return ruleDoc.id;
  },

  async updateRule(id: string, data: Partial<WorkflowRuleFormData>): Promise<void> {
    const ruleRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_RULES), id);
    await updateDoc(ruleRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async deleteRule(id: string): Promise<void> {
    const ruleRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_RULES), id);
    await deleteDoc(ruleRef);
  },

  async getRule(id: string): Promise<WorkflowRule | null> {
    const ruleRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_RULES), id);
    const ruleSnap = await getDoc(ruleRef);
    return ruleSnap.exists() ? ruleSnap.data() as WorkflowRule : null;
  },

  async getRules(): Promise<WorkflowRule[]> {
    const rulesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_RULES)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => doc.data() as WorkflowRule);
  },

  async executeRule(ruleId: string, triggerData: any): Promise<string> {
    const rule = await this.getRule(ruleId);
    if (!rule || !rule.isActive) return '';

    const executionsCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_EXECUTIONS));
    const executionDoc = doc(executionsCollection);
    
    const execution: WorkflowExecution = {
      id: executionDoc.id,
      ruleId: rule.id,
      ruleName: rule.name,
      triggeredBy: triggerData,
      status: 'running',
      startedAt: new Date(),
      actionsExecuted: [],
      retryCount: 0,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(executionDoc, execution);

    // Execute actions (simplified for now)
    for (const action of rule.actions) {
      try {
        // Action execution would go here
        execution.actionsExecuted.push({
          actionId: action.id,
          actionType: action.type,
          status: 'success',
          startedAt: new Date(),
          completedAt: new Date()
        });
      } catch (error) {
        execution.actionsExecuted.push({
          actionId: action.id,
          actionType: action.type,
          status: 'failed',
          startedAt: new Date(),
          completedAt: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
        
        if (rule.stopOnError) break;
      }
    }

    execution.status = 'completed';
    execution.completedAt = new Date();
    execution.duration = execution.completedAt.getTime() - execution.startedAt.getTime();

    await updateDoc(executionDoc, {
      status: execution.status,
      completedAt: execution.completedAt,
      duration: execution.duration,
      lastError: execution.lastError
    });
    
    // Update rule execution count
    await updateDoc(doc(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_RULES), ruleId), {
      executionCount: (rule.executionCount || 0) + 1,
      lastExecutedAt: serverTimestamp()
    });

    return executionDoc.id;
  }
};

// TAT Rules
export const tatRuleService = {
  async createRule(data: TATRuleFormData): Promise<string> {
    const rulesCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.TAT_RULES));
    const ruleDoc = doc(rulesCollection);
    
    const rule: TATRule = {
      id: ruleDoc.id,
      ...data,
      warningActions: [],
      criticalActions: [],
      breachActions: [],
      excludeStats: false,
      excludeUrgent: false,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(ruleDoc, rule);
    return ruleDoc.id;
  },

  async updateRule(id: string, data: Partial<TATRuleFormData>): Promise<void> {
    const ruleRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.TAT_RULES), id);
    await updateDoc(ruleRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async deleteRule(id: string): Promise<void> {
    const ruleRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.TAT_RULES), id);
    await deleteDoc(ruleRef);
  },

  async getRules(): Promise<TATRule[]> {
    const rulesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.TAT_RULES)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => doc.data() as TATRule);
  }
};

// Auto-verification Rules
export const autoVerificationService = {
  async createRule(data: Partial<AutoVerificationRule>): Promise<string> {
    const rulesCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.AUTO_VERIFICATION_RULES));
    const ruleDoc = doc(rulesCollection);
    
    const rule: AutoVerificationRule = {
      id: ruleDoc.id,
      name: data.name || '',
      isActive: data.isActive || true,
      testId: data.testId || '',
      testName: data.testName || '',
      criteria: data.criteria || {
        normalRangeCheck: true,
        deltaCheck: false,
        criticalValueCheck: true,
        requireQCPass: true,
        instrumentCheck: false,
        sampleIntegrityCheck: true,
        consistencyCheck: false
      },
      onAutoVerify: [],
      onFailure: [],
      successCount: 0,
      failureCount: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(ruleDoc, rule);
    return ruleDoc.id;
  },

  async getRules(): Promise<AutoVerificationRule[]> {
    const rulesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.AUTO_VERIFICATION_RULES)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      orderBy('createdAt', 'desc')
    );
    
    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => doc.data() as AutoVerificationRule);
  },

  async getRuleByTestId(testId: string): Promise<AutoVerificationRule | null> {
    const rulesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.AUTO_VERIFICATION_RULES)),
      where('testId', '==', testId),
      where('isActive', '==', true),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || '')
    );
    
    const snapshot = await getDocs(rulesQuery);
    return snapshot.empty ? null : snapshot.docs[0].data() as AutoVerificationRule;
  }
};

// Task Management
export const taskService = {
  async createTask(data: Partial<WorkflowTask>): Promise<string> {
    const tasksCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_TASKS));
    const taskDoc = doc(tasksCollection);
    
    const task: WorkflowTask = {
      id: taskDoc.id,
      title: data.title || '',
      description: data.description || '',
      priority: data.priority || 'medium',
      category: data.category || 'administrative',
      assignedBy: data.assignedBy || '',
      assignedAt: new Date(),
      status: 'pending',
      dueAt: data.dueAt || new Date(),
      comments: [],
      escalationLevel: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      createdBy: data.createdBy || '',
      tenantId: useTenantStore.getState().currentTenant?.id || '',
      ...data
    };

    await setDoc(taskDoc, task);
    return taskDoc.id;
  },

  async updateTask(id: string, data: Partial<WorkflowTask>): Promise<void> {
    const taskRef = doc(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_TASKS), id);
    await updateDoc(taskRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
  },

  async getTasks(filters?: {
    assignedTo?: string;
    status?: string;
    priority?: string;
  }): Promise<WorkflowTask[]> {
    let tasksQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.WORKFLOW_TASKS)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || '')
    );

    if (filters?.assignedTo) {
      tasksQuery = query(tasksQuery, where('assignedTo', '==', filters.assignedTo));
    }
    if (filters?.status) {
      tasksQuery = query(tasksQuery, where('status', '==', filters.status));
    }
    if (filters?.priority) {
      tasksQuery = query(tasksQuery, where('priority', '==', filters.priority));
    }

    tasksQuery = query(tasksQuery, orderBy('dueAt', 'asc'));
    
    const snapshot = await getDocs(tasksQuery);
    return snapshot.docs.map(doc => doc.data() as WorkflowTask);
  }
};

// Sample Routing
export const sampleRoutingService = {
  async createRule(data: Partial<SampleRoutingRule>): Promise<string> {
    const rulesCollection = collection(db, getCollectionName(FIREBASE_COLLECTIONS.SAMPLE_ROUTING_RULES));
    const ruleDoc = doc(rulesCollection);
    
    const rule: SampleRoutingRule = {
      id: ruleDoc.id,
      name: data.name || '',
      isActive: data.isActive !== undefined ? data.isActive : true,
      priority: data.priority || 1,
      conditions: data.conditions || {},
      routing: data.routing || {
        type: 'sequential',
        steps: []
      },
      notifications: data.notifications || {
        onRouteStart: true,
        onStepComplete: false,
        onRouteComplete: true,
        recipients: []
      },
      usageCount: 0,
      createdAt: serverTimestamp() as any,
      updatedAt: serverTimestamp() as any,
      tenantId: useTenantStore.getState().currentTenant?.id || ''
    };

    await setDoc(ruleDoc, rule);
    return ruleDoc.id;
  },

  async getRules(): Promise<SampleRoutingRule[]> {
    const rulesQuery = query(
      collection(db, getCollectionName(FIREBASE_COLLECTIONS.SAMPLE_ROUTING_RULES)),
      where('tenantId', '==', useTenantStore.getState().currentTenant?.id || ''),
      orderBy('priority', 'asc')
    );
    
    const snapshot = await getDocs(rulesQuery);
    return snapshot.docs.map(doc => doc.data() as SampleRoutingRule);
  }
};