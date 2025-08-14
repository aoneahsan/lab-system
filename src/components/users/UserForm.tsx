import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { User } from '@/types/auth.types';
import type { UserFormData } from '@/types/user-management.types';
import { SYSTEM_ROLES } from '@/constants/tenant.constants';
import {
  TextField,
  EmailField,
  PhoneField,
  SelectField,
  SwitchField,
} from '@/components/form-fields';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phoneNumber: yup.string().optional().nullable().default(undefined),
  role: yup.string().oneOf(Object.values(SYSTEM_ROLES) as string[]).required('Role is required'),
  isActive: yup.boolean().required(),
  metadata: yup.object({
    employeeId: yup.string().optional().nullable().default(undefined),
    department: yup.string().optional().nullable().default(undefined),
    designation: yup.string().optional().nullable().default(undefined),
  }).optional().nullable().default(undefined),
  preferences: yup.object().optional().nullable().default(undefined),
  customFields: yup.object().optional().nullable().default(undefined),
}).required();

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserForm = ({ initialData, onSubmit, onCancel, isLoading }: UserFormProps) => {
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema) as any,
    defaultValues: {
      email: initialData?.email || '',
      firstName: initialData?.firstName || '',
      lastName: initialData?.lastName || '',
      phoneNumber: initialData?.phoneNumber || '',
      role: initialData?.role || SYSTEM_ROLES.CLINICIAN,
      isActive: initialData?.isActive ?? true,
      metadata: {
        employeeId: initialData?.metadata?.employeeId || '',
        department: initialData?.metadata?.department || '',
        designation: initialData?.metadata?.designation || '',
      },
    },
  });

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Basic Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="First Name"
            name="firstName"
            register={register('firstName')}
            error={errors.firstName}
            required
          />
          
          <TextField
            label="Last Name"
            name="lastName"
            register={register('lastName')}
            error={errors.lastName}
            required
          />
          
          <EmailField
            label="Email"
            name="email"
            register={register('email')}
            error={errors.email}
            required
          />
          
          <PhoneField
            label="Phone Number"
            name="phoneNumber"
            value={watch('phoneNumber')}
            onChange={(value) => setValue('phoneNumber', value || '')}
            error={errors.phoneNumber}
          />
          
          <Controller
            name="role"
            control={control}
            rules={{ required: 'Role is required' }}
            render={({ field }) => (
              <SelectField
                label="Role"
                name="role"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: SYSTEM_ROLES.CLINICIAN, label: 'Clinician' },
                  { value: SYSTEM_ROLES.FRONT_DESK, label: 'Front Desk' },
                  { value: SYSTEM_ROLES.PHLEBOTOMIST, label: 'Phlebotomist' },
                  { value: SYSTEM_ROLES.LAB_TECHNICIAN, label: 'Lab Technician' },
                  { value: SYSTEM_ROLES.LAB_MANAGER, label: 'Lab Manager' },
                  { value: SYSTEM_ROLES.BILLING_STAFF, label: 'Billing Staff' },
                  { value: SYSTEM_ROLES.LAB_ADMIN, label: 'Lab Admin' },
                ]}
                error={errors.role?.message}
                required
              />
            )}
          />
          
          <SwitchField
            label="Active Status"
            name="isActive"
            checked={watch('isActive')}
            onChange={(checked) => setValue('isActive', checked)}
            error={errors.isActive}
            helpText="Enable or disable user access"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Additional Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TextField
            label="Employee ID"
            name="metadata.employeeId"
            register={register('metadata.employeeId')}
            error={errors.metadata?.employeeId}
          />
          
          <TextField
            label="Department"
            name="metadata.department"
            register={register('metadata.department')}
            error={errors.metadata?.department}
          />
          
          <TextField
            label="Designation"
            name="metadata.designation"
            register={register('metadata.designation')}
            error={errors.metadata?.designation}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="btn btn-secondary"
          disabled={isLoading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="btn btn-primary"
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : initialData ? 'Update User' : 'Create User'}
        </button>
      </div>
    </form>
  );
};