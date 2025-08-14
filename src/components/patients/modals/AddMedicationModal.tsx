import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { PatientMedication } from '@/types/patient.types';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/form-fields/TextField';
import { TextareaField } from '@/components/form-fields/TextareaField';
import { DateField } from '@/components/form-fields/DateField';

interface AddMedicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientMedication) => void;
  medication?: PatientMedication;
}

export const AddMedicationModal = ({ isOpen, onClose, onSubmit, medication }: AddMedicationModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch
  } = useForm<PatientMedication>({
    defaultValues: medication || {
      name: '',
      dosage: '',
      frequency: '',
      startDate: new Date(),
      endDate: undefined,
      prescribedBy: '',
      reason: '',
      notes: ''
    }
  });

  const startDate = watch('startDate');

  const handleFormSubmit = async (data: PatientMedication) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding medication:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={medication ? 'Edit Medication' : 'Add Medication'}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <TextField
          name="name"
          control={control}
          label="Medication Name"
          placeholder="e.g., Amoxicillin, Metformin"
          rules={{ required: 'Medication name is required' }}
          error={errors.name?.message}
        />

        <div className="grid grid-cols-2 gap-4">
          <TextField
            name="dosage"
            control={control}
            label="Dosage"
            placeholder="e.g., 500mg, 10ml"
            rules={{ required: 'Dosage is required' }}
            error={errors.dosage?.message}
          />

          <TextField
            name="frequency"
            control={control}
            label="Frequency"
            placeholder="e.g., Twice daily, Every 8 hours"
            rules={{ required: 'Frequency is required' }}
            error={errors.frequency?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <DateField
            name="startDate"
            control={control}
            label="Start Date"
            rules={{ required: 'Start date is required' }}
            error={errors.startDate?.message}
          />

          <DateField
            name="endDate"
            control={control}
            label="End Date (Optional)"
            minDate={startDate}
          />
        </div>

        <TextField
          name="prescribedBy"
          control={control}
          label="Prescribed By"
          placeholder="Doctor's name"
        />

        <TextField
          name="reason"
          control={control}
          label="Reason (Optional)"
          placeholder="Reason for prescription"
        />

        <TextareaField
          name="notes"
          control={control}
          label="Notes (Optional)"
          placeholder="Additional instructions or information"
          rows={3}
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
            {isSubmitting ? 'Saving...' : medication ? 'Update' : 'Add'} Medication
          </button>
        </div>
      </form>
    </Modal>
  );
};