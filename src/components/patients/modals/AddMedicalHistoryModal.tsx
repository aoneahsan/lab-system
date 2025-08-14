import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { PatientMedicalHistory } from '@/types/patient.types';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/form-fields/TextField';
import { TextareaField } from '@/components/form-fields/TextareaField';
import { SelectField } from '@/components/form-fields/SelectField';
import { DateField } from '@/components/form-fields/DateField';

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
    defaultValues: history || {
      condition: '',
      diagnosedDate: undefined,
      status: 'active',
      notes: ''
    }
  });

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
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <TextField
          name="condition"
          control={control}
          label="Medical Condition"
          placeholder="e.g., Diabetes, Hypertension, Asthma"
          rules={{ required: 'Medical condition is required' }}
          error={errors.condition?.message}
        />

        <SelectField
          name="status"
          control={control}
          label="Status"
          options={statusOptions}
          rules={{ required: 'Status is required' }}
          error={errors.status?.message}
        />

        <DateField
          name="diagnosedDate"
          control={control}
          label="Diagnosed Date (Optional)"
          maxDate={new Date()}
        />

        <TextareaField
          name="notes"
          control={control}
          label="Notes (Optional)"
          placeholder="Additional information about the condition"
          rows={4}
        />

        <div className="flex justify-end gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="btn btn-secondary"
            disabled={isSubmitting}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Saving...' : history ? 'Update' : 'Add'} Condition
          </button>
        </div>
      </form>
    </Modal>
  );
};