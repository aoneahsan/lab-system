import React from 'react';
import { X } from 'lucide-react';
import { useTests } from '@/hooks/useTests';
import { useCreateValidationRule, useUpdateValidationRule } from '@/hooks/useResultValidation';
import ValidationRuleForm from './ValidationRuleForm';
import type { ResultValidation } from '@/types/result.types';
import type { ValidationRuleFormData } from './ValidationRuleForm';

interface ValidationRuleModalProps {
  rule?: ResultValidation | null;
  onClose: () => void;
}

const ValidationRuleModal: React.FC<ValidationRuleModalProps> = ({ rule, onClose }) => {
  const { data: tests } = useTests();
  const createRuleMutation = useCreateValidationRule();
  const updateRuleMutation = useUpdateValidationRule();

  const handleSubmit = async (formData: ValidationRuleFormData) => {
    // Map form data to ResultValidation
    const validationData: Omit<ResultValidation, 'id' | 'createdAt' | 'updatedAt'> = {
      tenantId: '', // This should come from context/store
      testId: formData.testId,
      ruleName: `${formData.ruleType} rule`,
      ruleType: formData.ruleType as any,
      enabled: formData.active,
      parameters: {
        min: formData.minValue,
        max: formData.maxValue,
        deltaPercent: formData.deltaType === 'percentage' ? formData.deltaThreshold : undefined,
        deltaValue: formData.deltaType === 'absolute' ? formData.deltaThreshold : undefined,
        criticalLow: formData.criticalLow,
        criticalHigh: formData.criticalHigh,
      },
      action: formData.action === 'flag' ? 'warn' : formData.action,
      message: formData.customMessage,
    };
    if (rule) {
      await updateRuleMutation.mutateAsync({
        id: rule.id,
        data: validationData
      });
    } else {
      await createRuleMutation.mutateAsync(validationData);
    }
    onClose();
  };

  const testOptions = tests?.map(test => ({
    id: test.id,
    name: test.name,
    code: test.code
  })) || [];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {rule ? 'Edit Validation Rule' : 'Create Validation Rule'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          <ValidationRuleForm
            initialData={rule ? {
              testId: rule.testId,
              ruleType: rule.ruleType === 'consistency' || rule.ruleType === 'calculated' ? 'custom' : rule.ruleType,
              minValue: rule.parameters.min,
              maxValue: rule.parameters.max,
              deltaThreshold: rule.parameters.deltaPercent || rule.parameters.deltaValue,
              deltaType: rule.parameters.deltaPercent ? 'percentage' : 'absolute',
              criticalLow: rule.parameters.criticalLow,
              criticalHigh: rule.parameters.criticalHigh,
              customMessage: rule.message,
              action: rule.action === 'notify' ? 'warn' : rule.action,
              requiresReview: false,
              notifyOnTrigger: rule.action === 'notify',
              active: rule.enabled,
            } : undefined}
            testOptions={testOptions}
            onSubmit={handleSubmit}
            onCancel={onClose}
            isLoading={createRuleMutation.isPending || updateRuleMutation.isPending}
          />
        </div>
      </div>
    </div>
  );
};

export default ValidationRuleModal;