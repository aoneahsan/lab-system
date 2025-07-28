import { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, AlertTriangle, Ban } from 'lucide-react';
import type { ValidationRuleType, ValidationAction } from '@/types/result.types';

interface ValidationRule {
  id: string;
  testName: string;
  ruleName: string;
  ruleType: ValidationRuleType;
  enabled: boolean;
  parameters: Record<string, any>;
  action: ValidationAction;
  message?: string;
}

const mockRules: ValidationRule[] = [
  {
    id: '1',
    testName: 'Glucose',
    ruleName: 'Critical High',
    ruleType: 'critical',
    enabled: true,
    parameters: { criticalHigh: 500 },
    action: 'block',
    message: 'Critical high glucose level',
  },
  {
    id: '2',
    testName: 'Hemoglobin',
    ruleName: 'Range Check',
    ruleType: 'range',
    enabled: true,
    parameters: { min: 8, max: 20 },
    action: 'warn',
  },
  {
    id: '3',
    testName: 'Creatinine',
    ruleName: 'Delta Check',
    ruleType: 'delta',
    enabled: true,
    parameters: { deltaPercent: 50 },
    action: 'warn',
    message: 'Significant change from previous result',
  },
];

export default function ResultValidationRules() {
  const [rules, setRules] = useState<ValidationRule[]>(mockRules);
  const [showForm, setShowForm] = useState(false);
  const [editingRule, setEditingRule] = useState<ValidationRule | null>(null);
  const [filter, setFilter] = useState<'all' | ValidationRuleType>('all');

  const ruleTypeConfig = {
    range: { label: 'Range Check', icon: Shield, color: 'text-blue-600' },
    critical: { label: 'Critical Value', icon: AlertTriangle, color: 'text-red-600' },
    delta: { label: 'Delta Check', icon: AlertTriangle, color: 'text-orange-600' },
    absurd: { label: 'Absurd Value', icon: Ban, color: 'text-purple-600' },
    consistency: { label: 'Consistency', icon: Shield, color: 'text-green-600' },
    calculated: { label: 'Calculated', icon: Shield, color: 'text-indigo-600' },
  };

  const actionConfig = {
    warn: { label: 'Warning', color: 'bg-yellow-100 text-yellow-800' },
    block: { label: 'Block', color: 'bg-red-100 text-red-800' },
    notify: { label: 'Notify', color: 'bg-blue-100 text-blue-800' },
  };

  const filteredRules = rules.filter((rule) => filter === 'all' || rule.ruleType === filter);

  const handleToggleRule = (ruleId: string) => {
    setRules(
      rules.map((rule) => (rule.id === ruleId ? { ...rule, enabled: !rule.enabled } : rule))
    );
  };

  const handleDeleteRule = (ruleId: string) => {
    setRules(rules.filter((rule) => rule.id !== ruleId));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Validation Rules</h3>
          <div className="flex items-center space-x-3">
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value as any)}
              className="input py-1"
            >
              <option value="all">All Types</option>
              {Object.entries(ruleTypeConfig).map(([type, config]) => (
                <option key={type} value={type}>
                  {config.label}
                </option>
              ))}
            </select>
            <button onClick={() => setShowForm(true)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              Add Rule
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {filteredRules.map((rule) => {
            const typeConfig = ruleTypeConfig[rule.ruleType];
            const Icon = typeConfig.icon;

            return (
              <div
                key={rule.id}
                className={`border rounded-lg p-4 ${
                  rule.enabled ? 'border-gray-200' : 'border-gray-100 bg-gray-50'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <Icon className={`h-5 w-5 ${typeConfig.color}`} />
                      <h4 className="font-medium text-gray-900">{rule.testName}</h4>
                      <span className="text-sm text-gray-500">→</span>
                      <span className="text-sm text-gray-700">{rule.ruleName}</span>
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          actionConfig[rule.action].color
                        }`}
                      >
                        {actionConfig[rule.action].label}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1">
                      <p className="text-sm text-gray-600">Type: {typeConfig.label}</p>

                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        {Object.entries(rule.parameters).map(([key, value]) => (
                          <span key={key}>
                            {key}: <strong>{value}</strong>
                          </span>
                        ))}
                      </div>

                      {rule.message && (
                        <p className="text-sm text-gray-500 italic">Message: {rule.message}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={rule.enabled}
                        onChange={() => handleToggleRule(rule.id)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
                    </label>

                    <button
                      onClick={() => {
                        setEditingRule(rule);
                        setShowForm(true);
                      }}
                      className="text-gray-600 hover:text-gray-700"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteRule(rule.id)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredRules.length === 0 && (
            <div className="text-center py-8 text-gray-500">No validation rules found</div>
          )}
        </div>
      </div>
    </div>
  );
}
