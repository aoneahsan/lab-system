import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import type { User } from '@/types/auth.types';
import type { UserFormData } from '@/types/user-management.types';
import { SYSTEM_ROLES } from '@/constants/tenant.constants';

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  firstName: yup.string().required('First name is required'),
  lastName: yup.string().required('Last name is required'),
  phoneNumber: yup.string().optional(),
  role: yup.string().oneOf(Object.values(SYSTEM_ROLES) as string[]).required('Role is required'),
  isActive: yup.boolean().required(),
  metadata: yup.object({
    employeeId: yup.string().optional(),
    department: yup.string().optional(),
    designation: yup.string().optional(),
  }).optional(),
  preferences: yup.object().optional(),
  customFields: yup.object().optional(),
});

interface UserFormProps {
  initialData?: User;
  onSubmit: (data: UserFormData) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export const UserForm = ({ initialData, onSubmit, onCancel, isLoading }: UserFormProps) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UserFormData>({
    resolver: yupResolver(schema),
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
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              First Name
            </label>
            <input {...register('firstName')} className="input w-full" />
            {errors.firstName && (
              <p className="text-red-500 text-sm mt-1">{errors.firstName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Last Name
            </label>
            <input {...register('lastName')} className="input w-full" />
            {errors.lastName && (
              <p className="text-red-500 text-sm mt-1">{errors.lastName.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email
            </label>
            <input {...register('email')} type="email" className="input w-full" />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Phone Number
            </label>
            <input {...register('phoneNumber')} type="tel" className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select {...register('role')} className="input w-full">
              <option value={SYSTEM_ROLES.CLINICIAN}>Clinician</option>
              <option value={SYSTEM_ROLES.FRONT_DESK}>Front Desk</option>
              <option value={SYSTEM_ROLES.PHLEBOTOMIST}>Phlebotomist</option>
              <option value={SYSTEM_ROLES.LAB_TECHNICIAN}>Lab Technician</option>
              <option value={SYSTEM_ROLES.LAB_MANAGER}>Lab Manager</option>
              <option value={SYSTEM_ROLES.BILLING_STAFF}>Billing Staff</option>
              <option value={SYSTEM_ROLES.LAB_ADMIN}>Lab Admin</option>
            </select>
            {errors.role && (
              <p className="text-red-500 text-sm mt-1">{errors.role.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select {...register('isActive')} className="input w-full">
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Additional Information
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Employee ID
            </label>
            <input {...register('metadata.employeeId')} className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <input {...register('metadata.department')} className="input w-full" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Designation
            </label>
            <input {...register('metadata.designation')} className="input w-full" />
          </div>
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