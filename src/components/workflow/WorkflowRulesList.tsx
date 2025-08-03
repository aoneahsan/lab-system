import type { WorkflowRule } from '@/types/workflow-automation.types';
import { useDeleteWorkflowRule } from '@/hooks/useWorkflowAutomation';

interface WorkflowRulesListProps {
  rules: WorkflowRule[];
  isLoading: boolean;
  onEdit: (rule: WorkflowRule) => void;
}

export const WorkflowRulesList: React.FC<WorkflowRulesListProps> = ({
  rules,
  isLoading,
  onEdit,
}) => {
  const deleteMutation = useDeleteWorkflowRule();

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this rule?')) {
      await deleteMutation.mutateAsync(id);
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-20 bg-gray-200 dark:bg-gray-700 rounded" />
          ))}
        </div>
      </div>
    );
  }

  if (rules.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          No workflow rules configured yet.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg overflow-hidden">
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {rules.map(rule => (
          <div key={rule.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <h3 className="font-medium">{rule.name}</h3>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    rule.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {rule.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                    rule.priority === 'critical' ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400' :
                    rule.priority === 'high' ? 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400' :
                    rule.priority === 'medium' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400' :
                    'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-400'
                  }`}>
                    {rule.priority}
                  </span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  {rule.description}
                </p>
                <div className="flex items-center gap-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                  <span>Trigger: {rule.trigger.type.replace(/_/g, ' ')}</span>
                  <span>Actions: {rule.actions.length}</span>
                  <span>Executed: {rule.executionCount} times</span>
                  {rule.lastExecutedAt && (
                    <span>Last run: {new Date(rule.lastExecutedAt).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <button
                  onClick={() => onEdit(rule)}
                  className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                >
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(rule.id)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};