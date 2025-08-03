import { useState } from 'react';
import { useTATRules, useDeleteTATRule } from '@/hooks/useWorkflowAutomation';
import { TATRuleModal } from './TATRuleModal';
import type { TATRule } from '@/types/workflow-automation.types';

export const TATRulesList: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<TATRule | null>(null);
  const { data: rules, isLoading } = useTATRules();
  const deleteMutation = useDeleteTATRule();

  const handleCreate = () => {
    setEditingRule(null);
    setShowModal(true);
  };

  const handleEdit = (rule: TATRule) => {
    setEditingRule(rule);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this TAT rule?')) {
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

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">TAT Monitoring Rules</h2>
        <button
          onClick={handleCreate}
          className="btn btn-primary"
        >
          + Create TAT Rule
        </button>
      </div>

      {rules && rules.length > 0 ? (
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
                    </div>
                    <div className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                      <p>
                        Target TAT: {rule.targetTAT} min | 
                        Warning: {rule.warningThreshold} min | 
                        Critical: {rule.criticalThreshold} min
                      </p>
                      <p>
                        {rule.applyToAll ? 'Applies to all tests' : 
                         rule.testIds && rule.testIds.length > 0 ? `Applies to ${rule.testIds.length} tests` :
                         rule.testCategories && rule.testCategories.length > 0 ? `Applies to ${rule.testCategories.length} categories` : 
                         'No tests configured'}
                      </p>
                      {rule.considerBusinessHours && (
                        <p>Business hours: {rule.businessHours?.start} - {rule.businessHours?.end}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-4">
                    <button
                      onClick={() => handleEdit(rule)}
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
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 text-center">
          <p className="text-gray-500 dark:text-gray-400">
            No TAT monitoring rules configured yet.
          </p>
        </div>
      )}

      {showModal && (
        <TATRuleModal
          rule={editingRule}
          onClose={() => setShowModal(false)}
        />
      )}
    </div>
  );
};