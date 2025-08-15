import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import type { PatientMedicalHistory } from '@/types/patient.types';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/form-fields/TextField';
import { LexicalEditorField } from '@/components/form-fields/LexicalEditorField';
import { SelectField } from '@/components/form-fields/SelectField';
import { DateField } from '@/components/form-fields/DateField';
import { Controller } from 'react-hook-form';

interface AddMedicalHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientMedicalHistory) => void;
  history?: PatientMedicalHistory;
}

export const AddMedicalHistoryModal = ({ isOpen, onClose, onSubmit, history }: AddMedicalHistoryModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PatientMedicalHistory>({
    defaultValues: {
      condition: '',
      diagnosedDate: undefined,
      status: 'active',
      notes: ''
    }
  });

  // Reset form when modal opens with history data
  useEffect(() => {
    if (isOpen) {
      if (history) {
        reset(history);
      } else {
        reset({
          condition: '',
          diagnosedDate: undefined,
          status: 'active',
          notes: ''
        });
      }
    }
  }, [isOpen, history, reset]);

  const statusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'resolved', label: 'Resolved' },
    { value: 'chronic', label: 'Chronic' }
  ];

  const handleFormSubmit = async (data: PatientMedicalHistory) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding medical history:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={history ? 'Edit Medical Condition' : 'Add Medical Condition'}
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <TextField
          name="condition"
          control={control}
          label="Medical Condition"
          placeholder="e.g., Diabetes, Hypertension, Asthma"
          rules={{ required: 'Medical condition is required' }}
          error={errors.condition?.message}
        />

        <Controller
          name="status"
          control={control}
          rules={{ required: 'Status is required' }}
          render={({ field }) => (
            <SelectField
              label="Status"
              name="status"
              options={statusOptions}
              value={field.value}
              onChange={field.onChange}
              error={errors.status?.message}
              required
            />
          )}
        />

        <DateField
          name="diagnosedDate"
          control={control}
          label="Diagnosed Date (Optional)"
          maxDate={new Date()}
        />

        <LexicalEditorField
          name="notes"
          control={control}
          label="Notes (Optional)"
          placeholder="Additional information about the condition"
          minHeight="120px"
        />

        <div className="flex justify-end gap-3 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 text-sm font-medium text-white bg-primary-600 border border-transparent rounded-lg hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : history ? 'Update' : 'Add'} Condition
          </button>
        </div>
      </form>
    </Modal>
  );
};