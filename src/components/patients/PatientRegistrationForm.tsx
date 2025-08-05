import { useForm, Controller, FormProvider } from 'react-hook-form';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { useCreatePatient } from '@/hooks/usePatients';
import { useCustomFieldsByModule, useValidateCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import type { CreatePatientData } from '@/types/patient.types';

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
  } = formMethods;

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
          <div>
            <label htmlFor="firstName" className="label">
              First Name *
            </label>
            <input
              id="firstName"
              type="text"
              className={`input ${errors.firstName ? 'border-danger-500' : ''}`}
              {...register('firstName', { required: 'First name is required' })}
            />
            {errors.firstName && (
              <p className="text-sm text-danger-600 mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="middleName" className="label">
              Middle Name
            </label>
            <input id="middleName" type="text" className="input" {...register('middleName')} />
          </div>

          <div>
            <label htmlFor="lastName" className="label">
              Last Name *
            </label>
            <input
              id="lastName"
              type="text"
              className={`input ${errors.lastName ? 'border-danger-500' : ''}`}
              {...register('lastName', { required: 'Last name is required' })}
            />
            {errors.lastName && (
              <p className="text-sm text-danger-600 mt-1">{errors.lastName.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div>
            <label htmlFor="dateOfBirth" className="label">
              Date of Birth *
            </label>
            <Controller
              name="dateOfBirth"
              control={control}
              rules={{ required: 'Date of birth is required' }}
              render={({ field }) => (
                <DatePicker
                  selected={field.value}
                  onChange={field.onChange}
                  dateFormat="MM/dd/yyyy"
                  showYearDropdown
                  scrollableYearDropdown
                  yearDropdownItemNumber={100}
                  placeholderText="Select date"
                  className={`input ${errors.dateOfBirth ? 'border-danger-500' : ''}`}
                  maxDate={new Date()}
                />
              )}
            />
            {errors.dateOfBirth && (
              <p className="text-sm text-danger-600 mt-1">{errors.dateOfBirth.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="gender" className="label">
              Gender *
            </label>
            <select
              id="gender"
              className={`input ${errors.gender ? 'border-danger-500' : ''}`}
              {...register('gender', { required: 'Gender is required' })}
            >
              <option value="">Select Gender</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
              <option value="other">Other</option>
              <option value="unknown">Prefer not to say</option>
            </select>
            {errors.gender && (
              <p className="text-sm text-danger-600 mt-1">{errors.gender.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="bloodGroup" className="label">
              Blood Group
            </label>
            <select id="bloodGroup" className="input" {...register('bloodGroup')}>
              <option value="">Select Blood Group</option>
              <option value="A+">A+</option>
              <option value="A-">A-</option>
              <option value="B+">B+</option>
              <option value="B-">B-</option>
              <option value="AB+">AB+</option>
              <option value="AB-">AB-</option>
              <option value="O+">O+</option>
              <option value="O-">O-</option>
              <option value="unknown">Unknown</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label htmlFor="maritalStatus" className="label">
              Marital Status
            </label>
            <select id="maritalStatus" className="input" {...register('maritalStatus')}>
              <option value="">Select Status</option>
              <option value="single">Single</option>
              <option value="married">Married</option>
              <option value="divorced">Divorced</option>
              <option value="widowed">Widowed</option>
              <option value="separated">Separated</option>
              <option value="unknown">Prefer not to say</option>
            </select>
          </div>

          <div>
            <label htmlFor="nationality" className="label">
              Nationality
            </label>
            <input id="nationality" type="text" className="input" {...register('nationality')} />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Contact Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="phoneNumber" className="label">
              Phone Number *
            </label>
            <input
              id="phoneNumber"
              type="tel"
              className={`input ${errors.phoneNumber ? 'border-danger-500' : ''}`}
              {...register('phoneNumber', {
                required: 'Phone number is required',
                pattern: {
                  value: /^[\d\s\-+()]+$/,
                  message: 'Invalid phone number format',
                },
              })}
            />
            {errors.phoneNumber && (
              <p className="text-sm text-danger-600 mt-1">{errors.phoneNumber.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className={`input ${errors.email ? 'border-danger-500' : ''}`}
              {...register('email', {
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
            />
            {errors.email && <p className="text-sm text-danger-600 mt-1">{errors.email.message}</p>}
          </div>
        </div>

        <div className="space-y-4 mt-4">
          <h4 className="font-medium text-gray-900 dark:text-white">Address</h4>

          <div>
            <label htmlFor="line1" className="label">
              Address Line 1 *
            </label>
            <input
              id="line1"
              type="text"
              className={`input ${errors.address?.line1 ? 'border-danger-500' : ''}`}
              {...register('address.line1', {
                required: 'Address is required',
              })}
            />
            {errors.address?.line1 && (
              <p className="text-sm text-danger-600 mt-1">{errors.address.line1.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="line2" className="label">
              Address Line 2
            </label>
            <input id="line2" type="text" className="input" {...register('address.line2')} />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label htmlFor="city" className="label">
                City *
              </label>
              <input
                id="city"
                type="text"
                className={`input ${errors.address?.city ? 'border-danger-500' : ''}`}
                {...register('address.city', { required: 'City is required' })}
              />
              {errors.address?.city && (
                <p className="text-sm text-danger-600 mt-1">{errors.address.city.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="state" className="label">
                State *
              </label>
              <input
                id="state"
                type="text"
                className={`input ${errors.address?.state ? 'border-danger-500' : ''}`}
                {...register('address.state', {
                  required: 'State is required',
                })}
              />
              {errors.address?.state && (
                <p className="text-sm text-danger-600 mt-1">{errors.address.state.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="country" className="label">
                Country *
              </label>
              <input
                id="country"
                type="text"
                className={`input ${errors.address?.country ? 'border-danger-500' : ''}`}
                {...register('address.country', {
                  required: 'Country is required',
                })}
              />
              {errors.address?.country && (
                <p className="text-sm text-danger-600 mt-1">{errors.address.country.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="postalCode" className="label">
                Postal Code *
              </label>
              <input
                id="postalCode"
                type="text"
                className={`input ${errors.address?.postalCode ? 'border-danger-500' : ''}`}
                {...register('address.postalCode', {
                  required: 'Postal code is required',
                })}
              />
              {errors.address?.postalCode && (
                <p className="text-sm text-danger-600 mt-1">{errors.address.postalCode.message}</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Emergency Contact
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="emergencyName" className="label">
              Contact Name
            </label>
            <input
              id="emergencyName"
              type="text"
              className="input"
              {...register('emergencyContact.name')}
            />
          </div>

          <div>
            <label htmlFor="emergencyRelationship" className="label">
              Relationship
            </label>
            <input
              id="emergencyRelationship"
              type="text"
              className="input"
              {...register('emergencyContact.relationship')}
            />
          </div>

          <div>
            <label htmlFor="emergencyPhone" className="label">
              Phone Number
            </label>
            <input
              id="emergencyPhone"
              type="tel"
              className="input"
              {...register('emergencyContact.phone')}
            />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Additional Information
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="occupation" className="label">
              Occupation
            </label>
            <input id="occupation" type="text" className="input" {...register('occupation')} />
          </div>

          <div>
            <label htmlFor="notes" className="label">
              Notes
            </label>
            <textarea id="notes" rows={3} className="input" {...register('notes')} />
          </div>
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
