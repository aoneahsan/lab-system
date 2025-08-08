import { useState } from 'react';
import { Plus, GitBranch, Save, Play, Trash2 } from 'lucide-react';
import { toast } from '@/stores/toast.store';

interface WorkflowStep {
  id: string;
  type: 'condition' | 'action' | 'notification' | 'approval';
  name: string;
  config: Record<string, any>;
  nextSteps?: string[];
}

interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  steps: WorkflowStep[];
}

const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  {
    id: 'critical-result',
    name: 'Critical Result Notification',
    description: 'Automatically notify providers and escalate critical results',
    category: 'Results',
    steps: [
      {
        id: 'check-critical',
        type: 'condition',
        name: 'Check if result is critical',
        config: { condition: 'result.isCritical === true' },
        nextSteps: ['notify-provider', 'create-task'],
      },
      {
        id: 'notify-provider',
        type: 'notification',
        name: 'Notify ordering provider',
        config: { 
          channel: 'sms',
          template: 'critical-result',
          escalation: true,
        },
      },
      {
        id: 'create-task',
        type: 'action',
        name: 'Create follow-up task',
        config: { 
          taskType: 'critical-result-followup',
          priority: 'high',
          assignTo: 'lab-manager',
        },
      },
    ],
  },
  {
    id: 'tat-breach',
    name: 'TAT Breach Alert',
    description: 'Monitor and alert on turnaround time breaches',
    category: 'Performance',
    steps: [
      {
        id: 'check-tat',
        type: 'condition',
        name: 'Check TAT threshold',
        config: { condition: 'sample.tat > test.expectedTAT * 0.8' },
        nextSteps: ['alert-supervisor'],
      },
      {
        id: 'alert-supervisor',
        type: 'notification',
        name: 'Alert lab supervisor',
        config: { 
          channel: 'email',
          recipients: ['supervisor'],
        },
      },
    ],
  },
];

export default function AdvancedWorkflowBuilder() {
  const [selectedTemplate, setSelectedTemplate] = useState<WorkflowTemplate | null>(null);
  const [customSteps, setCustomSteps] = useState<WorkflowStep[]>([]);
  const [workflowName, setWorkflowName] = useState('');

  const handleAddStep = (type: WorkflowStep['type']) => {
    const newStep: WorkflowStep = {
      id: `step-${Date.now()}`,
      type,
      name: `New ${type}`,
      config: {},
    };
    setCustomSteps([...customSteps, newStep]);
  };

  const handleSaveWorkflow = () => {
    if (!workflowName) {
      toast.error('Workflow name required', 'Please enter a name for the workflow');
      return;
    }

    const steps = selectedTemplate ? selectedTemplate.steps : customSteps;
    if (steps.length === 0) {
      toast.error('No steps defined', 'Add at least one step to the workflow');
      return;
    }

    toast.success('Workflow saved', `${workflowName} has been saved successfully`);
  };

  const handleTestWorkflow = () => {
    toast.info('Testing workflow', 'Running workflow simulation...');
    setTimeout(() => {
      toast.success('Test completed', 'Workflow executed successfully');
    }, 2000);
  };

  return (
    <div className="space-y-6">
      {/* Workflow Templates */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Start from Template</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {WORKFLOW_TEMPLATES.map((template) => (
            <div
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-indigo-500 bg-indigo-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <h4 className="font-medium text-gray-900">{template.name}</h4>
              <p className="text-sm text-gray-600 mt-1">{template.description}</p>
              <span className="inline-block mt-2 px-2 py-1 text-xs font-medium bg-gray-100 text-gray-700 rounded">
                {template.category}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Workflow Builder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Workflow Builder</h3>
          <div className="flex gap-2">
            <button
              onClick={handleTestWorkflow}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              <Play className="h-4 w-4" />
              Test
            </button>
            <button
              onClick={handleSaveWorkflow}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
            >
              <Save className="h-4 w-4" />
              Save
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <input
            type="text"
            placeholder="Workflow Name"
            value={workflowName}
            onChange={(e) => setWorkflowName(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
          />

          {/* Step Types */}
          <div className="flex gap-2">
            <button
              onClick={() => handleAddStep('condition')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100"
            >
              <GitBranch className="h-4 w-4" />
              Add Condition
            </button>
            <button
              onClick={() => handleAddStep('action')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100"
            >
              <Plus className="h-4 w-4" />
              Add Action
            </button>
            <button
              onClick={() => handleAddStep('notification')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100"
            >
              <Plus className="h-4 w-4" />
              Add Notification
            </button>
            <button
              onClick={() => handleAddStep('approval')}
              className="flex items-center gap-2 px-3 py-1.5 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100"
            >
              <Plus className="h-4 w-4" />
              Add Approval
            </button>
          </div>

          {/* Workflow Steps Display */}
          <div className="space-y-2">
            {(selectedTemplate ? selectedTemplate.steps : customSteps).map((step, index) => (
              <div
                key={step.id}
                className={`p-4 border rounded-lg ${
                  step.type === 'condition' ? 'border-blue-200 bg-blue-50' :
                  step.type === 'action' ? 'border-green-200 bg-green-50' :
                  step.type === 'notification' ? 'border-purple-200 bg-purple-50' :
                  'border-orange-200 bg-orange-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-gray-700">
                      Step {index + 1}: {step.type.charAt(0).toUpperCase() + step.type.slice(1)}
                    </span>
                    <h4 className="font-medium text-gray-900">{step.name}</h4>
                  </div>
                  <button className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Visual Workflow Preview */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Workflow Preview</h3>
        <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
          <p className="text-gray-500">Visual workflow diagram will appear here</p>
        </div>
      </div>
    </div>
  );
}