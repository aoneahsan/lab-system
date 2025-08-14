import { useState, useEffect } from 'react';
import { useWorkflowRules } from '@/hooks/useWorkflowAutomation';
import { useUrlState } from '@/hooks/useUrlState';
import { useModalState } from '@/hooks/useModalState';
import { WorkflowRulesList } from '@/components/workflow/WorkflowRulesList';
import { WorkflowRuleModal } from '@/components/workflow/WorkflowRuleModal';
import { TATRulesList } from '@/components/workflow/TATRulesList';
import { TasksList } from '@/components/workflow/TasksList';
import type { WorkflowRule } from '@/types/workflow-automation.types';

export default function WorkflowAutomationPage() {
  const [activeTab, setActiveTab] = useUrlState('tab', {
    defaultValue: 'rules',
    removeDefault: true
  });
  const ruleModal = useModalState('workflow-rule');
  const [editingRule, setEditingRule] = useState<WorkflowRule | null>(null);
  const { data: rules, isLoading } = useWorkflowRules();

  // Restore editing rule from URL
  useEffect(() => {
    if (ruleModal.isOpen && ruleModal.modalData.ruleId && rules) {
      const rule = rules.find(r => r.id === ruleModal.modalData.ruleId);
      if (rule) setEditingRule(rule);
    } else if (!ruleModal.isOpen) {
      setEditingRule(null);
    }
  }, [ruleModal.isOpen, ruleModal.modalData, rules]);

  const handleCreateRule = () => {
    setEditingRule(null);
    ruleModal.openModal();
  };

  const handleEditRule = (rule: WorkflowRule) => {
    setEditingRule(rule);
    ruleModal.openModal({ ruleId: rule.id });
  };

  const tabs = [
    { id: 'rules', name: 'Workflow Rules', icon: '⚙️' },
    { id: 'tat', name: 'TAT Monitoring', icon: '⏱️' },
    { id: 'tasks', name: 'Task Management', icon: '📋' },
    { id: 'routing', name: 'Sample Routing', icon: '🔀' },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Workflow Automation</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Automate lab processes and manage workflows
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="-mb-px flex space-x-8">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              <span className="flex items-center gap-2">
                <span>{tab.icon}</span>
                {tab.name}
              </span>
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'rules' && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Workflow Rules</h2>
              <button
                onClick={handleCreateRule}
                className="btn btn-primary"
              >
                + Create Rule
              </button>
            </div>
            <WorkflowRulesList
              rules={rules || []}
              isLoading={isLoading}
              onEdit={handleEditRule}
            />
          </div>
        )}

        {activeTab === 'tat' && (
          <TATRulesList />
        )}

        {activeTab === 'tasks' && (
          <TasksList />
        )}

        {activeTab === 'routing' && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">Sample Routing Rules</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Configure automatic sample routing based on test types and priorities.
            </p>
            {/* Sample routing component would go here */}
          </div>
        )}
      </div>

      {/* Rule Modal */}
      {ruleModal.isOpen && (
        <WorkflowRuleModal
          rule={editingRule}
          onClose={() => {
            ruleModal.closeModal();
            setEditingRule(null);
          }}
        />
      )}
    </div>
  );
}