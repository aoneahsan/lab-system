import { useState } from 'react';
import { useForm } from 'react-hook-form';
import type { Patient, UpdatePatientData } from '@/types/patient.types';
import { countries } from '@/utils/countries';
import { relationships } from '@/utils/relationships';
import { PhoneInput } from '@/components/ui/PhoneInput';
import { CountrySelect } from '@/components/ui/CountrySelect';
import { StateSelect } from '@/components/ui/StateSelect';
import { Plus, Trash2 } from 'lucide-react';

interface PatientEditFormProps {
  patient: Patient;
  onSubmit: (data: Partial<UpdatePatientData>) => void;
  onCancel: () => void;
  isSubmitting: boolean;
}

export const PatientEditForm: React.FC<PatientEditFormProps> = ({
  patient,
  onSubmit,
  onCancel,
  isSubmitting,
}) => {
  const [activeTab, setActiveTab] = useState('basic');
  
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm({
    defaultValues: {
      firstName: patient.firstName,
      middleName: patient.middleName || '',
      lastName: patient.lastName,
      dateOfBirth: patient.dateOfBirth ? new Date(patient.dateOfBirth).toISOString().split('T')[0] : '',
      gender: patient.gender,
      bloodGroup: patient.bloodGroup || '',
      maritalStatus: patient.maritalStatus || '',
      email: patient.email || '',
      occupation: patient.occupation || '',
      employer: patient.employer || '',
      nationality: patient.nationality || '',
      language: patient.language || '',
      religion: patient.religion || '',
      notes: patient.notes || '',
      phoneNumbers: patient.phoneNumbers || [],
      addresses: patient.addresses || [],
      emergencyContacts: patient.emergencyContacts || [],
    },
  });

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'address', label: 'Addresses' },
    { id: 'emergency', label: 'Emergency Contacts' },
    { id: 'medical', label: 'Medical Information' },
    { id: 'additional', label: 'Additional Info' },
  ];

  const onFormSubmit = (data: any) => {
    onSubmit({
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
    });
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Tabs */}
      <div className="px-6 py-4">
        <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`whitespace-nowrap px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6">
        {activeTab === 'basic' && (
          <BasicInfoTab register={register} errors={errors} watch={watch} />
        )}
        
        {activeTab === 'contact' && (
          <ContactTab 
            register={register} 
            errors={errors} 
            watch={watch}
            setValue={setValue}
            phoneNumbers={watch('phoneNumbers')}
          />
        )}
        
        {activeTab === 'address' && (
          <AddressTab 
            register={register} 
            errors={errors} 
            watch={watch}
            setValue={setValue}
            addresses={watch('addresses')}
          />
        )}
        
        {activeTab === 'emergency' && (
          <EmergencyTab 
            register={register} 
            errors={errors} 
            watch={watch}
            setValue={setValue}
            emergencyContacts={watch('emergencyContacts')}
          />
        )}
        
        {activeTab === 'medical' && (
          <MedicalTab register={register} errors={errors} watch={watch} />
        )}
        
        {activeTab === 'additional' && (
          <AdditionalTab register={register} errors={errors} watch={watch} setValue={setValue} />
        )}
      </div>

      {/* Form Actions */}
      <div className="px-6 py-4 flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
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
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
};

// Basic Information Tab
const BasicInfoTab = ({ register, errors, watch }: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        First Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        {...register('firstName', { required: 'First name is required' })}
        className="input"
      />
      {errors.firstName && (
        <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Middle Name
      </label>
      <input
        type="text"
        {...register('middleName')}
        className="input"
      />
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Last Name <span className="text-red-500">*</span>
      </label>
      <input
        type="text"
        {...register('lastName', { required: 'Last name is required' })}
        className="input"
      />
      {errors.lastName && (
        <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Date of Birth <span className="text-red-500">*</span>
      </label>
      <input
        type="date"
        {...register('dateOfBirth', { required: 'Date of birth is required' })}
        className="input"
        max={new Date().toISOString().split('T')[0]}
      />
      {errors.dateOfBirth && (
        <p className="mt-1 text-sm text-red-600">{errors.dateOfBirth.message}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Gender <span className="text-red-500">*</span>
      </label>
      <select
        {...register('gender', { required: 'Gender is required' })}
        className="input"
      >
        <option value="">Select Gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="other">Other</option>
        <option value="unknown">Prefer not to say</option>
      </select>
      {errors.gender && (
        <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
      )}
    </div>

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Blood Group
      </label>
      <select {...register('bloodGroup')} className="input">
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

    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Marital Status
      </label>
      <select {...register('maritalStatus')} className="input">
        <option value="">Select Status</option>
        <option value="single">Single</option>
        <option value="married">Married</option>
        <option value="divorced">Divorced</option>
        <option value="widowed">Widowed</option>
        <option value="separated">Separated</option>
        <option value="unknown">Prefer not to say</option>
      </select>
    </div>
  </div>
);

// Placeholder for other tabs - will implement in next messages
const ContactTab = ({ register, errors, watch, setValue, phoneNumbers }: any) => (
  <div className="space-y-6">
    <p className="text-gray-500">Contact details form will be implemented here</p>
  </div>
);

const AddressTab = ({ register, errors, watch, setValue, addresses }: any) => (
  <div className="space-y-6">
    <p className="text-gray-500">Address form will be implemented here</p>
  </div>
);

const EmergencyTab = ({ register, errors, watch, setValue, emergencyContacts }: any) => (
  <div className="space-y-6">
    <p className="text-gray-500">Emergency contacts form will be implemented here</p>
  </div>
);

const MedicalTab = ({ register, errors, watch }: any) => (
  <div className="space-y-6">
    <p className="text-gray-500">Medical information form will be implemented here</p>
  </div>
);

const AdditionalTab = ({ register, errors, watch, setValue }: any) => (
  <div className="space-y-6">
    <p className="text-gray-500">Additional information form will be implemented here</p>
  </div>
);