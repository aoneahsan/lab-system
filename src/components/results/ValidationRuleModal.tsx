import React from 'react';
import { X } from 'lucide-react';
import { useTests } from '@/hooks/useTests';
import { useCreateValidationRule, useUpdateValidationRule } from '@/hooks/useResultValidation';
import ValidationRuleForm from './ValidationRuleForm';
import type { ResultValidationRule } from '@/types/result.types';

interface ValidationRuleModalProps {
  rule?: ResultValidationRule | null;
  onClose: () => void;
}

const ValidationRuleModal: React.FC<ValidationRuleModalProps> = ({ rule, onClose }) => {
  const { data: tests } = useTests();
  const createRuleMutation = useCreateValidationRule();
  const updateRuleMutation = useUpdateValidationRule();

  const handleSubmit = async (data: Omit<ResultValidationRule, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (rule) {
      await updateRuleMutation.mutateAsync({
        id: rule.id,
        data
      });
    } else {
      await createRuleMutation.mutateAsync(data);
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
            initialData={rule || undefined}
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