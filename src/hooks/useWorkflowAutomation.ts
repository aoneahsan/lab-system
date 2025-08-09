import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  workflowRuleService,
  tatRuleService,
  autoVerificationService,
  taskService,
  sampleRoutingService
} from '@/services/workflow-automation.service';
import { toast } from '@/stores/toast.store';
import type {
  AutoVerificationRule,
  WorkflowTask,
  SampleRoutingRule,
  WorkflowRuleFormData,
  TATRuleFormData
} from '@/types/workflow-automation.types';

// Workflow Rules Hooks
export const useWorkflowRules = () => {
  return useQuery({
    queryKey: ['workflow-rules'],
    queryFn: () => workflowRuleService.getRules(),
  });
};

export const useWorkflowRule = (id: string) => {
  return useQuery({
    queryKey: ['workflow-rule', id],
    queryFn: () => workflowRuleService.getRule(id),
    enabled: !!id,
  });
};

export const useCreateWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: WorkflowRuleFormData) => workflowRuleService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      toast.success('Success', 'Workflow rule created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create workflow rule');
    },
  });
};

export const useUpdateWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowRuleFormData> }) => 
      workflowRuleService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      toast.success('Success', 'Workflow rule updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update workflow rule');
    },
  });
};

export const useDeleteWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => workflowRuleService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-rules'] });
      toast.success('Success', 'Workflow rule deleted successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to delete workflow rule');
    },
  });
};

export const useExecuteWorkflowRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ ruleId, triggerData }: { ruleId: string; triggerData: any }) => 
      workflowRuleService.executeRule(ruleId, triggerData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-executions'] });
      toast.success('Success', 'Workflow rule executed successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to execute workflow rule');
    },
  });
};

// TAT Rules Hooks
export const useTATRules = () => {
  return useQuery({
    queryKey: ['tat-rules'],
    queryFn: () => tatRuleService.getRules(),
  });
};

export const useCreateTATRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: TATRuleFormData) => tatRuleService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tat-rules'] });
      toast.success('Success', 'TAT rule created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create TAT rule');
    },
  });
};

export const useUpdateTATRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<TATRuleFormData> }) => 
      tatRuleService.updateRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tat-rules'] });
      toast.success('Success', 'TAT rule updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update TAT rule');
    },
  });
};

export const useDeleteTATRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (id: string) => tatRuleService.deleteRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tat-rules'] });
      toast.success('Success', 'TAT rule deleted successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to delete TAT rule');
    },
  });
};

// Auto-verification Hooks
export const useAutoVerificationRules = () => {
  return useQuery({
    queryKey: ['auto-verification-rules'],
    queryFn: () => autoVerificationService.getRules(),
  });
};

export const useAutoVerificationRuleByTest = (testId: string) => {
  return useQuery({
    queryKey: ['auto-verification-rule', testId],
    queryFn: () => autoVerificationService.getRuleByTestId(testId),
    enabled: !!testId,
  });
};

export const useCreateAutoVerificationRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<AutoVerificationRule>) => autoVerificationService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auto-verification-rules'] });
      toast.success('Success', 'Auto-verification rule created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create auto-verification rule');
    },
  });
};

// Task Hooks
export const useTasks = (filters?: { assignedTo?: string; status?: string; priority?: string }) => {
  return useQuery({
    queryKey: ['workflow-tasks', filters],
    queryFn: () => taskService.getTasks(filters),
  });
};

export const useCreateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<WorkflowTask>) => taskService.createTask(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
      toast.success('Success', 'Task created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create task');
    },
  });
};

export const useUpdateTask = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<WorkflowTask> }) => 
      taskService.updateTask(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflow-tasks'] });
      toast.success('Success', 'Task updated successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to update task');
    },
  });
};

// Sample Routing Hooks
export const useSampleRoutingRules = () => {
  return useQuery({
    queryKey: ['sample-routing-rules'],
    queryFn: () => sampleRoutingService.getRules(),
  });
};

export const useCreateSampleRoutingRule = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: (data: Partial<SampleRoutingRule>) => sampleRoutingService.createRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sample-routing-rules'] });
      toast.success('Success', 'Sample routing rule created successfully');
    },
    onError: (error) => {
      toast.error('Error', error instanceof Error ? error.message : 'Failed to create sample routing rule');
    },
  });
};