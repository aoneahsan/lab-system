import { useState } from 'react';
import { useCreateWorkflowRule, useUpdateWorkflowRule } from '@/hooks/useWorkflowAutomation';
import type { WorkflowRule, WorkflowRuleFormData, WorkflowAction } from '@/types/workflow-automation.types';
import { TextField, LexicalEditorField, SelectField, SwitchField, NumberField } from '@/components/form-fields';

interface WorkflowRuleModalProps {
  rule: WorkflowRule | null;
  onClose: () => void;
}

export const WorkflowRuleModal: React.FC<WorkflowRuleModalProps> = ({ rule, onClose }) => {
  const createMutation = useCreateWorkflowRule();
  const updateMutation = useUpdateWorkflowRule();
  
  const [formData, setFormData] = useState<WorkflowRuleFormData>({
    name: rule?.name || '',
    description: rule?.description || '',
    isActive: rule?.isActive ?? true,
    trigger: rule?.trigger || {
      type: 'sample_registered',
      conditions: []
    },
    actions: rule?.actions || [],
    priority: rule?.priority || 'medium',
    maxRetries: rule?.maxRetries || 3,
    retryDelay: rule?.retryDelay || 5,
    stopOnError: rule?.stopOnError ?? true
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rule) {
      await updateMutation.mutateAsync({
        id: rule.id,
        data: formData
      });
    } else {
      await createMutation.mutateAsync(formData);
    }
    
    onClose();
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        {
          type: 'send_alert',
          parameters: {}
        } as Omit<WorkflowAction, 'id'>
      ]
    });
  };

  const removeAction = (index: number) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index)
    });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-4">
          {rule ? 'Edit Workflow Rule' : 'Create Workflow Rule'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
              rows={3}
              required
            />
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.isActive}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Active</span>
            </label>

            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={formData.stopOnError}
                onChange={(e) => setFormData({ ...formData, stopOnError: e.target.checked })}
                className="rounded"
              />
              <span className="text-sm font-medium">Stop on Error</span>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Trigger Type</label>
            <select
              value={formData.trigger.type}
              onChange={(e) => setFormData({
                ...formData,
                trigger: { ...formData.trigger, type: e.target.value as any }
              })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="sample_registered">Sample Registered</option>
              <option value="result_entered">Result Entered</option>
              <option value="result_validated">Result Validated</option>
              <option value="tat_warning">TAT Warning</option>
              <option value="qc_failure">QC Failure</option>
              <option value="critical_value">Critical Value</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Priority</label>
            <select
              value={formData.priority}
              onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
              className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="critical">Critical</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Max Retries</label>
              <input
                type="number"
                value={formData.maxRetries}
                onChange={(e) => setFormData({ ...formData, maxRetries: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                min={0}
                max={10}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Retry Delay (minutes)</label>
              <input
                type="number"
                value={formData.retryDelay}
                onChange={(e) => setFormData({ ...formData, retryDelay: parseInt(e.target.value) })}
                className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                min={1}
                max={60}
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="block text-sm font-medium">Actions</label>
              <button
                type="button"
                onClick={addAction}
                className="btn btn-sm btn-secondary"
              >
                + Add Action
              </button>
            </div>
            
            <div className="space-y-2">
              {formData.actions.map((action, index) => (
                <div key={index} className="flex items-center gap-2 p-2 border rounded-md dark:border-gray-600">
                  <select
                    value={action.type}
                    onChange={(e) => {
                      const newActions = [...formData.actions];
                      newActions[index] = { ...action, type: e.target.value as any };
                      setFormData({ ...formData, actions: newActions });
                    }}
                    className="flex-1 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                  >
                    <option value="route_sample">Route Sample</option>
                    <option value="auto_verify">Auto Verify</option>
                    <option value="send_alert">Send Alert</option>
                    <option value="create_task">Create Task</option>
                    <option value="update_status">Update Status</option>
                    <option value="assign_to_user">Assign to User</option>
                    <option value="escalate">Escalate</option>
                    <option value="api_call">API Call</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeAction(index)}
                    className="text-red-600 hover:text-red-700 dark:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};