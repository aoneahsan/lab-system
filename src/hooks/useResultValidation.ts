import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { resultValidationService } from '@/services/result-validation.service';
import type { ResultValidationRule } from '@/types/result.types';
import { toast } from '@/hooks/useToast';

const VALIDATION_RULES_KEY = 'validation-rules';

export const useValidationRules = (testId?: string) => {
  return useQuery({
    queryKey: [VALIDATION_RULES_KEY, testId],
    queryFn: () => resultValidationService.getValidationRules(testId),
  });
};

export const useCreateValidationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: Omit<ResultValidationRule, 'id' | 'createdAt' | 'updatedAt'>) =>
      resultValidationService.createValidationRule(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VALIDATION_RULES_KEY] });
      toast.success('Validation rule created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create validation rule');
      console.error('Error creating validation rule:', error);
    },
  });
};

export const useUpdateValidationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ResultValidationRule> }) =>
      resultValidationService.updateValidationRule(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VALIDATION_RULES_KEY] });
      toast.success('Validation rule updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update validation rule');
      console.error('Error updating validation rule:', error);
    },
  });
};

export const useDeleteValidationRule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => resultValidationService.deleteValidationRule(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [VALIDATION_RULES_KEY] });
      toast.success('Validation rule deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete validation rule');
      console.error('Error deleting validation rule:', error);
    },
  });
};

export const useValidateResult = () => {
  return useMutation({
    mutationFn: ({
      testId,
      value,
      patientId,
      referenceRange,
    }: {
      testId: string;
      value: string | number;
      patientId: string;
      referenceRange?: { min?: number; max?: number };
    }) => resultValidationService.validateResult(testId, value, patientId, referenceRange),
  });
};
