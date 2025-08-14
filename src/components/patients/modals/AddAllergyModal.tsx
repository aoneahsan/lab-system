import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { PatientAllergy } from '@/types/patient.types';
import { Modal } from '@/components/ui/Modal';
import { TextField } from '@/components/form-fields/TextField';
import { LexicalEditorField } from '@/components/form-fields/LexicalEditorField';
import { SelectField } from '@/components/form-fields/SelectField';
import { DateField } from '@/components/form-fields/DateField';
import { Controller } from 'react-hook-form';

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
      size="lg"
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
        <div className="grid gap-5">
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

          <Controller
            name="severity"
            control={control}
            rules={{ required: 'Severity is required' }}
            render={({ field }) => (
              <SelectField
                label="Severity"
                name="severity"
                options={severityOptions}
                value={field.value}
                onChange={field.onChange}
                error={errors.severity?.message}
                required
              />
            )}
          />

          <DateField
            name="confirmedDate"
            control={control}
            label="Confirmed Date (Optional)"
            maxDate={new Date()}
          />

          <LexicalEditorField
            name="notes"
            control={control}
            label="Notes (Optional)"
            placeholder="Additional information about the allergy"
            minHeight="100px"
          />
        </div>

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
            {isSubmitting ? 'Saving...' : allergy ? 'Update' : 'Add'} Allergy
          </button>
        </div>
      </form>
    </Modal>
  );
};