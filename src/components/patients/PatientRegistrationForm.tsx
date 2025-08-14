import { useForm, FormProvider, Controller } from 'react-hook-form';
import { useCreatePatient } from '@/hooks/usePatients';
import { useCustomFieldsByModule, useValidateCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import type { CreatePatientData } from '@/types/patient.types';
import {
  TextField,
  EmailField,
  PhoneField,
  DateField,
  SelectField,
  LexicalEditorField,
  CountryField,
  StateField,
  CityField,
  ZipCodeField,
  RelationshipField,
} from '@/components/form-fields';
import { useState } from 'react';

interface PatientRegistrationFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const PatientRegistrationForm = ({ onSuccess, onCancel }: PatientRegistrationFormProps) => {
  const { mutate: createPatient, isPending } = useCreatePatient();
  const { data: customFields = [] } = useCustomFieldsByModule('patient');
  const validateCustomFields = useValidateCustomFields();

  const formMethods = useForm<CreatePatientData>({
    defaultValues: {
      gender: 'unknown',
      maritalStatus: 'unknown',
      customFields: {},
    },
  });

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    setError,
    watch,
    setValue,
  } = formMethods;

  const [selectedCountry, setSelectedCountry] = useState<any>(null);
  const [selectedState, setSelectedState] = useState<any>(null);

  const onSubmit = (data: CreatePatientData) => {
    // Validate custom fields
    const { isValid, errors: customErrors } = validateCustomFields(
      customFields,
      data.customFields || {}
    );

    if (!isValid) {
      Object.entries(customErrors).forEach(([fieldKey, message]) => {
        setError(`customFields.${fieldKey}` as any, {
          type: 'manual',
          message,
        });
      });
      return;
    }

    createPatient(data, {
      onSuccess: () => {
        onSuccess?.();
      },
    });
  };

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="First Name"
            name="firstName"
            register={register('firstName', { required: 'First name is required' })}
            error={errors.firstName}
            required
          />
          
          <TextField
            label="Middle Name"
            name="middleName"
            register={register('middleName')}
            error={errors.middleName}
          />
          
          <TextField
            label="Last Name"
            name="lastName"
            register={register('lastName', { required: 'Last name is required' })}
            error={errors.lastName}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <DateField
            label="Date of Birth"
            name="dateOfBirth"
            control={control}
            error={errors.dateOfBirth}
            required
            maxDate={new Date()}
            showYearDropdown
            showMonthDropdown
            dropdownMode="select"
          />
          
          <Controller
            name="gender"
            control={control}
            rules={{ required: 'Gender is required' }}
            render={({ field }) => (
              <SelectField
                label="Gender"
                name="gender"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'male', label: 'Male' },
                  { value: 'female', label: 'Female' },
                  { value: 'other', label: 'Other' },
                  { value: 'unknown', label: 'Prefer not to say' },
                ]}
                error={errors.gender?.message}
                required
                placeholder="Select Gender"
              />
            )}
          />
          
          <Controller
            name="bloodGroup"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Blood Group"
                name="bloodGroup"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'A+', label: 'A+' },
                  { value: 'A-', label: 'A-' },
                  { value: 'B+', label: 'B+' },
                  { value: 'B-', label: 'B-' },
                  { value: 'AB+', label: 'AB+' },
                  { value: 'AB-', label: 'AB-' },
                  { value: 'O+', label: 'O+' },
                  { value: 'O-', label: 'O-' },
                  { value: 'unknown', label: 'Unknown' },
                ]}
                error={errors.bloodGroup?.message}
                placeholder="Select Blood Group"
              />
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <Controller
            name="maritalStatus"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Marital Status"
                name="maritalStatus"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'single', label: 'Single' },
                  { value: 'married', label: 'Married' },
                  { value: 'divorced', label: 'Divorced' },
                  { value: 'widowed', label: 'Widowed' },
                  { value: 'separated', label: 'Separated' },
                  { value: 'unknown', label: 'Prefer not to say' },
                ]}
                error={errors.maritalStatus?.message}
                placeholder="Select Status"
              />
            )}
          />
          
          <TextField
            label="Nationality"
            name="nationality"
            register={register('nationality')}
            error={errors.nationality}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <PhoneField
            label="Phone Number"
            name="phoneNumber"
            value={watch('phoneNumber')}
            onChange={(value) => setValue('phoneNumber', value || '')}
            error={errors.phoneNumber}
            required
            defaultCountry="US"
          />
          
          <EmailField
            label="Email Address"
            name="email"
            register={register('email')}
            error={errors.email}
          />
        </div>

        <div className="space-y-4 mt-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Address</h4>

          <TextField
            label="Address Line 1"
            name="address.line1"
            register={register('address.line1', { required: 'Address is required' })}
            error={errors.address?.line1}
            required
          />
          
          <TextField
            label="Address Line 2"
            name="address.line2"
            register={register('address.line2')}
            error={errors.address?.line2}
          />

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <CountryField
              label="Country"
              name="address.country"
              value={selectedCountry}
              onChange={(country) => {
                setSelectedCountry(country);
                setValue('address.country', country?.name || '');
                setSelectedState(null);
                setValue('address.state', '');
                setValue('address.city', '');
              }}
              error={errors.address?.country}
              required
            />
            
            <StateField
              label="State"
              name="address.state"
              countryId={selectedCountry?.id}
              value={selectedState}
              onChange={(state) => {
                setSelectedState(state);
                setValue('address.state', state?.name || '');
                setValue('address.city', '');
              }}
              error={errors.address?.state}
              required
            />
            
            <CityField
              label="City"
              name="address.city"
              countryId={selectedCountry?.id}
              stateId={selectedState?.id}
              value={watch('address.city')}
              onChange={(city) => setValue('address.city', city?.name || '')}
              error={errors.address?.city}
              required
            />
            
            <ZipCodeField
              label="Postal Code"
              name="address.postalCode"
              register={register('address.postalCode', { required: 'Postal code is required' })}
              error={errors.address?.postalCode}
              required
              country={selectedCountry?.code || 'US'}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Emergency Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <TextField
            label="Contact Name"
            name="emergencyContact.name"
            register={register('emergencyContact.name')}
            error={errors.emergencyContact?.name}
          />
          
          <RelationshipField
            label="Relationship"
            name="emergencyContact.relationship"
            value={watch('emergencyContact.relationship')}
            onChange={(value) => setValue('emergencyContact.relationship', value || '')}
            error={errors.emergencyContact?.relationship}
          />
          
          <PhoneField
            label="Phone Number"
            name="emergencyContact.phone"
            value={watch('emergencyContact.phone')}
            onChange={(value) => setValue('emergencyContact.phone', value || '')}
            error={errors.emergencyContact?.phone}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Additional Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Occupation"
            name="occupation"
            register={register('occupation')}
            error={errors.occupation}
          />
          
          <LexicalEditorField
            name="notes"
            control={control}
            label="Notes"
            placeholder="Additional notes about the patient"
            minHeight="100px"
          />
        </div>
      </div>

      {/* Custom Fields */}
      <CustomFieldsManager
        module="patient"
        errors={(errors.customFields as any) || {}}
      />

      <div className="flex justify-end gap-4">
        <button type="button" onClick={onCancel} className="btn btn-secondary" disabled={isPending}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={isPending}>
          {isPending ? 'Creating...' : 'Create Patient'}
        </button>
      </div>
      </form>
    </FormProvider>
  );
};
