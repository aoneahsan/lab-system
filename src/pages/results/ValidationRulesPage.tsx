import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Settings, AlertTriangle, Trash2, Edit } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultValidationService } from '@/services/result-validation.service';
import { useTests } from '@/hooks/useTests';
import { toast } from '@/stores/toast.store';
import ValidationRuleModal from '@/components/results/ValidationRuleModal';
import type { ResultValidationRule } from '@/types/result.types';

const ValidationRulesPage: React.FC = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showRuleModal, setShowRuleModal] = useState(false);
  const [editingRule, setEditingRule] = useState<ResultValidationRule | null>(null);
  const [selectedTestId, setSelectedTestId] = useState<string>('');

  const { data: tests = [] } = useTests();

  // Fetch validation rules
  const { data: rules = [], isLoading } = useQuery({
    queryKey: ['validationRules', selectedTestId],
    queryFn: () => resultValidationService.getValidationRules(selectedTestId || undefined),
  });

  // Delete rule mutation
  const deleteRuleMutation = useMutation({
    mutationFn: (ruleId: string) => resultValidationService.deleteValidationRule(ruleId),
    onSuccess: () => {
      toast.success('Rule Deleted', 'Validation rule has been deleted');
      queryClient.invalidateQueries({ queryKey: ['validationRules'] });
    },
    onError: () => {
      toast.error('Delete Failed', 'Failed to delete validation rule');
    },
  });

  const handleCreateRule = () => {
    setEditingRule(null);
    setShowRuleModal(true);
  };

  const handleEditRule = (rule: ResultValidationRule) => {
    setEditingRule(rule);
    setShowRuleModal(true);
  };

  const handleDeleteRule = (rule: ResultValidationRule) => {
    if (confirm(`Are you sure you want to delete this ${rule.ruleType} rule?`)) {
      deleteRuleMutation.mutate(rule.id);
    }
  };

  const getRuleTypeColor = (ruleType: string) => {
    switch (ruleType) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'absurd':
        return 'bg-orange-100 text-orange-800';
      case 'delta':
        return 'bg-blue-100 text-blue-800';
      case 'range':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getActionColor = (action: string) => {
    return action === 'block' ? 'text-red-600' : 'text-yellow-600';
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/results')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Validation Rules</h1>
            <p className="text-gray-600 mt-2">Configure automatic result validation rules</p>
          </div>
          <button
            onClick={handleCreateRule}
            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Rule
          </button>
        </div>
      </div>

      {/* Filter by Test */}
      <div className="mb-6 bg-white rounded-lg shadow p-4">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700">Filter by Test:</label>
          <select
            value={selectedTestId}
            onChange={(e) => setSelectedTestId(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Tests</option>
            {tests.map((test) => (
              <option key={test.id} value={test.id}>
                {test.name} ({test.code})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white rounded-lg shadow">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading validation rules...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="text-center py-12">
            <Settings className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No validation rules configured</p>
            <button
              onClick={handleCreateRule}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create First Rule
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Test
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rule Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Criteria
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {rules.map((rule) => (
                  <tr key={rule.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{rule.ruleName}</div>
                        <div className="text-sm text-gray-500">Test ID: {rule.testId}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${getRuleTypeColor(
                          rule.ruleType
                        )}`}
                      >
                        {rule.ruleType}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {rule.ruleType === 'range' && (
                          <span>
                            Range: {rule.minValue} - {rule.maxValue}
                          </span>
                        )}
                        {rule.ruleType === 'critical' && (
                          <span>
                            Critical: Low {'<'} {rule.criticalLow}, High {'>'} {rule.criticalHigh}
                          </span>
                        )}
                        {rule.ruleType === 'absurd' && (
                          <span>
                            Absurd: Low {'<'} {rule.absurdLow}, High {'>'} {rule.absurdHigh}
                          </span>
                        )}
                        {rule.ruleType === 'delta' && (
                          <span>
                            Delta: {rule.deltaThreshold}
                            {rule.deltaType === 'percent' ? '%' : ''} change
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className={`flex items-center gap-2 text-sm font-medium ${getActionColor(rule.action)}`}>
                        <AlertTriangle className="h-4 w-4" />
                        {rule.action}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          rule.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {rule.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => handleEditRule(rule)}
                          className="text-blue-600 hover:text-blue-900"
                          title="Edit Rule"
                        >
                          <Edit className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRule(rule)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete Rule"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rule Modal */}
      {showRuleModal && (
        <ValidationRuleModal
          isOpen={showRuleModal}
          onClose={() => {
            setShowRuleModal(false);
            setEditingRule(null);
          }}
          rule={editingRule}
        />
      )}
    </div>
  );
};

export default ValidationRulesPage;