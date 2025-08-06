import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Shield, AlertTriangle } from 'lucide-react';
import { useValidationRules, useDeleteValidationRule } from '@/hooks/useResultValidation';
import { useTests } from '@/hooks/useTests';
import { LoadingState } from '@/components/common/LoadingState';
import ValidationRuleModal from '@/components/results/ValidationRuleModal';
import type { ResultValidationRule } from '@/types/result.types';

const ValidationRulesPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState<ResultValidationRule | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const { data: rules, isLoading } = useValidationRules();
  const { data: tests } = useTests();
  const deleteRuleMutation = useDeleteValidationRule();

  const handleEdit = (rule: ResultValidationRule) => {
    setSelectedRule(rule);
    setShowModal(true);
  };

  const handleDelete = async (ruleId: string) => {
    await deleteRuleMutation.mutateAsync(ruleId);
    setDeleteConfirm(null);
  };

  const getRuleTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      range: 'Range Check',
      delta: 'Delta Check',
      absurd: 'Absurd Values',
      critical: 'Critical Values',
      custom: 'Custom Rule',
    };
    return labels[type] || type;
  };

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      warn: 'bg-yellow-100 text-yellow-800',
      block: 'bg-red-100 text-red-800',
      flag: 'bg-blue-100 text-blue-800',
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  const getTestName = (testId: string) => {
    const test = tests?.find((t) => t.id === testId);
    return test ? `${test.code} - ${test.name}` : testId;
  };

  if (isLoading) {
    return <LoadingState message="Loading validation rules..." />;
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Validation Rules</h1>
          <p className="text-gray-600 mt-2">Manage result validation rules and quality control</p>
        </div>
        <button
          onClick={() => {
            setSelectedRule(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Total Rules</p>
              <p className="text-2xl font-semibold text-gray-900">{rules?.length || 0}</p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Active Rules</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules?.filter((r) => r.active).length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <AlertTriangle className="h-8 w-8 text-red-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Critical Rules</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules?.filter((r) => r.ruleType === 'critical').length || 0}
              </p>
            </div>
          </div>
        </div>
        <div className="bg-white p-4 rounded-lg shadow">
          <div className="flex items-center">
            <Shield className="h-8 w-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-600">Review Required</p>
              <p className="text-2xl font-semibold text-gray-900">
                {rules?.filter((r) => r.requiresReview).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Rules Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
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
                Configuration
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Options
              </th>
              <th className="relative px-6 py-3">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rules?.map((rule) => (
              <tr key={rule.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getTestName(rule.testId)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {getRuleTypeLabel(rule.ruleType)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {rule.ruleType === 'range' && (
                    <span>
                      {rule.minValue} - {rule.maxValue}
                    </span>
                  )}
                  {rule.ruleType === 'delta' && (
                    <span>
                      {rule.deltaThreshold} {rule.deltaType}
                    </span>
                  )}
                  {rule.ruleType === 'critical' && (
                    <span>
                      Low: {rule.criticalLow}, High: {rule.criticalHigh}
                    </span>
                  )}
                  {rule.ruleType === 'absurd' && (
                    <span>
                      Low: {rule.absurdLow}, High: {rule.absurdHigh}
                    </span>
                  )}
                  {rule.ruleType === 'custom' && (
                    <span className="text-gray-400">Custom logic</span>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getActionColor(
                      rule.action
                    )}`}
                  >
                    {rule.action.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                      rule.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {rule.active ? 'Active' : 'Inactive'}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  <div className="flex gap-2">
                    {rule.requiresReview && (
                      <span className="text-orange-600" title="Requires Review">
                        <Shield className="h-4 w-4" />
                      </span>
                    )}
                    {rule.notifyOnTrigger && (
                      <span className="text-blue-600" title="Sends Notification">
                        <AlertTriangle className="h-4 w-4" />
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleEdit(rule)}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    {deleteConfirm === rule.id ? (
                      <div className="flex gap-1">
                        <button
                          onClick={() => handleDelete(rule.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Confirm
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-gray-600 hover:text-gray-900 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(rule.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {(!rules || rules.length === 0) && (
              <tr>
                <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                  No validation rules found. Create your first rule to get started.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Validation Rule Modal */}
      {showModal && (
        <ValidationRuleModal
          isOpen={showModal}
          rule={selectedRule}
          onClose={() => {
            setShowModal(false);
            setSelectedRule(null);
          }}
        />
      )}
    </div>
  );
};

export default ValidationRulesPage;
