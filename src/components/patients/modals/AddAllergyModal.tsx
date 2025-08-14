import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { PatientAllergy } from '@/types/patient.types';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/form-fields/TextField';
import { TextareaField } from '@/components/form-fields/TextareaField';
import { SelectField } from '@/components/form-fields/SelectField';
import { DateField } from '@/components/form-fields/DateField';

interface AddAllergyModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: PatientAllergy) => void;
  allergy?: PatientAllergy;
}

export const AddAllergyModal = ({ isOpen, onClose, onSubmit, allergy }: AddAllergyModalProps) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<PatientAllergy>({
    defaultValues: allergy || {
      allergen: '',
      reaction: '',
      severity: 'mild',
      confirmedDate: undefined,
      notes: ''
    }
  });

  const severityOptions = [
    { value: 'mild', label: 'Mild' },
    { value: 'moderate', label: 'Moderate' },
    { value: 'severe', label: 'Severe' },
    { value: 'life-threatening', label: 'Life Threatening' }
  ];

  const handleFormSubmit = async (data: PatientAllergy) => {
    setIsSubmitting(true);
    try {
      await onSubmit(data);
      reset();
      onClose();
    } catch (error) {
      console.error('Error adding allergy:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={allergy ? 'Edit Allergy' : 'Add Allergy'}
      size="md"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <TextField
          name="allergen"
          control={control}
          label="Allergen"
          placeholder="e.g., Penicillin, Peanuts, Dust"
          rules={{ required: 'Allergen is required' }}
          error={errors.allergen?.message}
        />

        <TextField
          name="reaction"
          control={control}
          label="Reaction"
          placeholder="e.g., Rash, Swelling, Difficulty breathing"
          rules={{ required: 'Reaction is required' }}
          error={errors.reaction?.message}
        />

        <SelectField
          name="severity"
          control={control}
          label="Severity"
          options={severityOptions}
          rules={{ required: 'Severity is required' }}
          error={errors.severity?.message}
        />

        <DateField
          name="confirmedDate"
          control={control}
          label="Confirmed Date (Optional)"
          maxDate={new Date()}
        />

        <TextareaField
          name="notes"
          control={control}
          label="Notes (Optional)"
          placeholder="Additional information about the allergy"
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
            {isSubmitting ? 'Saving...' : allergy ? 'Update' : 'Add'} Allergy
          </button>
        </div>
      </form>
    </Modal>
  );
};