import { useState } from 'react';
import { useForm, FormProvider } from 'react-hook-form';
import type { Patient, UpdatePatientData } from '@/types/patient.types';
import { useCustomFieldsByModule, useValidateCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
// import { countries } from '@/utils/countries'; // Not used in this component
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
  const { data: customFields = [] } = useCustomFieldsByModule('patient');
  const validateCustomFields = useValidateCustomFields();
  
  const formMethods = useForm({
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
      customFields: patient.customFields || {},
    },
  });

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    setError,
  } = formMethods;

  const tabs = [
    { id: 'basic', label: 'Basic Information' },
    { id: 'contact', label: 'Contact Details' },
    { id: 'address', label: 'Addresses' },
    { id: 'emergency', label: 'Emergency Contacts' },
    { id: 'medical', label: 'Medical Information' },
    { id: 'additional', label: 'Additional Info' },
    ...(customFields.length > 0 ? [{ id: 'custom', label: 'Custom Fields' }] : []),
  ];

  const onFormSubmit = (data: any) => {
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
      setActiveTab('custom');
      return;
    }

    onSubmit({
      ...data,
      dateOfBirth: new Date(data.dateOfBirth),
    });
  };

  return (
    <FormProvider {...formMethods}>
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
        
        {activeTab === 'custom' && customFields.length > 0 && (
          <CustomFieldsManager
            module="patient"
            errors={(errors.customFields as any) || {}}
            showSections={false}
          />
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
    </FormProvider>
  );
};

// Basic Information Tab
const BasicInfoTab = ({ register: _register, errors: _errors, _watch }: any) => (
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

// Contact Tab Implementation
const ContactTab = ({ _register, _errors, watch, setValue, phoneNumbers }: any) => {
  const handleAddPhone = () => {
    const currentPhones = watch('phoneNumbers') || [];
    setValue('phoneNumbers', [
      ...currentPhones,
      { type: 'mobile', value: '', isPrimary: currentPhones.length === 0, isVerified: false }
    ]);
  };

  const handleRemovePhone = (index: number) => {
    const currentPhones = watch('phoneNumbers') || [];
    setValue('phoneNumbers', currentPhones.filter((_: any, i: number) => i !== index));
  };

  const handlePhoneChange = (index: number, field: string, value: any) => {
    const currentPhones = watch('phoneNumbers') || [];
    const updated = [...currentPhones];
    updated[index] = { ...updated[index], [field]: value };
    
    // If setting as primary, unset others
    if (field === 'isPrimary' && value) {
      updated.forEach((phone, i) => {
        if (i !== index) phone.isPrimary = false;
      });
    }
    
    setValue('phoneNumbers', updated);
  };

  return (
    <div className="space-y-6">
      {/* Email */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Email Address
        </label>
        <input
          type="email"
          {..._register('email', { 
            pattern: {
              value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
              message: 'Invalid email address'
            }
          })}
          className="input"
        />
        {_errors.email && (
          <p className="mt-1 text-sm text-red-600">{_errors.email.message}</p>
        )}
      </div>

      {/* Phone Numbers */}
      <div>
        <div className="flex justify-between items-center mb-3">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Phone Numbers
          </label>
          <button
            type="button"
            onClick={handleAddPhone}
            className="btn btn-secondary btn-sm flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Phone
          </button>
        </div>

        <div className="space-y-3">
          {(phoneNumbers || []).map((phone: any, index: number) => (
            <div key={index} className="flex gap-3 items-start">
              <select
                value={phone.type}
                onChange={(e) => handlePhoneChange(index, 'type', e.target.value)}
                className="input w-32"
              >
                <option value="mobile">Mobile</option>
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="emergency">Emergency</option>
              </select>
              
              <div className="flex-1">
                <PhoneInput
                  value={phone.value}
                  onChange={(value) => handlePhoneChange(index, 'value', value)}
                  placeholder="Phone number"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={phone.isPrimary}
                    onChange={(e) => handlePhoneChange(index, 'isPrimary', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Primary</span>
                </label>

                <button
                  type="button"
                  onClick={() => handleRemovePhone(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}

          {(!phoneNumbers || phoneNumbers.length === 0) && (
            <p className="text-sm text-gray-500 dark:text-gray-400">
              No phone numbers added. Click "Add Phone" to add one.
            </p>
          )}
        </div>
      </div>

      {/* Occupation */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Occupation
        </label>
        <input
          type="text"
          {..._register('occupation')}
          className="input"
        />
      </div>

      {/* Employer */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Employer
        </label>
        <input
          type="text"
          {..._register('employer')}
          className="input"
        />
      </div>
    </div>
  );
};

const AddressTab = ({ _register, _errors, watch, setValue, addresses }: any) => {
  const handleAddAddress = () => {
    const currentAddresses = watch('addresses') || [];
    setValue('addresses', [
      ...currentAddresses,
      {
        type: 'home',
        line1: '',
        line2: '',
        city: '',
        state: '',
        country: 'US',
        postalCode: '',
        isDefault: currentAddresses.length === 0
      }
    ]);
  };

  const handleRemoveAddress = (index: number) => {
    const currentAddresses = watch('addresses') || [];
    setValue('addresses', currentAddresses.filter((_: any, i: number) => i !== index));
  };

  const handleAddressChange = (index: number, field: string, value: any) => {
    const currentAddresses = watch('addresses') || [];
    const updated = [...currentAddresses];
    updated[index] = { ...updated[index], [field]: value };
    
    // If setting as default, unset others
    if (field === 'isDefault' && value) {
      updated.forEach((addr, i) => {
        if (i !== index) addr.isDefault = false;
      });
    }
    
    setValue('addresses', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Addresses
        </label>
        <button
          type="button"
          onClick={handleAddAddress}
          className="btn btn-secondary btn-sm flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Address
        </button>
      </div>

      <div className="space-y-4">
        {(addresses || []).map((address: any, index: number) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-center mb-4">
              <select
                value={address.type}
                onChange={(e) => handleAddressChange(index, 'type', e.target.value)}
                className="input w-40"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="temporary">Temporary</option>
                <option value="other">Other</option>
              </select>
              
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={address.isDefault}
                    onChange={(e) => handleAddressChange(index, 'isDefault', e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400">Default</span>
                </label>
                
                <button
                  type="button"
                  onClick={() => handleRemoveAddress(index)}
                  className="p-1 text-red-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 1
                </label>
                <input
                  type="text"
                  value={address.line1}
                  onChange={(e) => handleAddressChange(index, 'line1', e.target.value)}
                  className="input"
                  placeholder="Street address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Line 2
                </label>
                <input
                  type="text"
                  value={address.line2 || ''}
                  onChange={(e) => handleAddressChange(index, 'line2', e.target.value)}
                  className="input"
                  placeholder="Apartment, suite, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City
                </label>
                <input
                  type="text"
                  value={address.city}
                  onChange={(e) => handleAddressChange(index, 'city', e.target.value)}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  State/Province
                </label>
                <StateSelect
                  value={address.state}
                  onChange={(value) => handleAddressChange(index, 'state', value)}
                  country={address.country}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Country
                </label>
                <CountrySelect
                  value={address.country}
                  onChange={(value) => handleAddressChange(index, 'country', value)}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Postal Code
                </label>
                <input
                  type="text"
                  value={address.postalCode}
                  onChange={(e) => handleAddressChange(index, 'postalCode', e.target.value)}
                  className="input"
                />
              </div>
            </div>
          </div>
        ))}

        {(!addresses || addresses.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No addresses added. Click "Add Address" to add one.
          </p>
        )}
      </div>
    </div>
  );
};

const EmergencyTab = ({ _register, _errors, watch, setValue, emergencyContacts }: any) => {
  const handleAddContact = () => {
    const currentContacts = watch('emergencyContacts') || [];
    setValue('emergencyContacts', [
      ...currentContacts,
      {
        name: '',
        relationship: '',
        phone: '',
        email: '',
        address: ''
      }
    ]);
  };

  const handleRemoveContact = (index: number) => {
    const currentContacts = watch('emergencyContacts') || [];
    setValue('emergencyContacts', currentContacts.filter((_: any, i: number) => i !== index));
  };

  const handleContactChange = (index: number, field: string, value: any) => {
    const currentContacts = watch('emergencyContacts') || [];
    const updated = [...currentContacts];
    updated[index] = { ...updated[index], [field]: value };
    setValue('emergencyContacts', updated);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Emergency Contacts
        </label>
        <button
          type="button"
          onClick={handleAddContact}
          className="btn btn-secondary btn-sm flex items-center gap-1"
        >
          <Plus className="h-4 w-4" />
          Add Contact
        </button>
      </div>

      <div className="space-y-4">
        {(emergencyContacts || []).map((contact: any, index: number) => (
          <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
            <div className="flex justify-end mb-4">
              <button
                type="button"
                onClick={() => handleRemoveContact(index)}
                className="p-1 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={contact.name}
                  onChange={(e) => handleContactChange(index, 'name', e.target.value)}
                  className="input"
                  placeholder="Full name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Relationship <span className="text-red-500">*</span>
                </label>
                <select
                  value={contact.relationship}
                  onChange={(e) => handleContactChange(index, 'relationship', e.target.value)}
                  className="input"
                >
                  <option value="">Select relationship</option>
                  {relationships.map((rel) => (
                    <option key={rel} value={rel}>{rel}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <PhoneInput
                  value={contact.phone}
                  onChange={(value) => handleContactChange(index, 'phone', value)}
                  placeholder="Contact phone"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  value={contact.email || ''}
                  onChange={(e) => handleContactChange(index, 'email', e.target.value)}
                  className="input"
                  placeholder="Email address"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address
                </label>
                <textarea
                  value={contact.address || ''}
                  onChange={(e) => handleContactChange(index, 'address', e.target.value)}
                  className="input"
                  rows={2}
                  placeholder="Full address"
                />
              </div>
            </div>
          </div>
        ))}

        {(!emergencyContacts || emergencyContacts.length === 0) && (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No emergency contacts added. Click "Add Contact" to add one.
          </p>
        )}
      </div>
    </div>
  );
};

const MedicalTab = ({ register, _errors, _watch }: any) => (
  <div className="space-y-6">
    {/* Allergies */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Allergies
      </label>
      <textarea
        {...register('allergies')}
        className="input"
        rows={3}
        placeholder="List any known allergies (medications, food, environmental, etc.)"
      />
    </div>

    {/* Current Medications */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Current Medications
      </label>
      <textarea
        {...register('medications')}
        className="input"
        rows={3}
        placeholder="List current medications with dosages"
      />
    </div>

    {/* Medical History */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Medical History
      </label>
      <textarea
        {...register('medicalHistory')}
        className="input"
        rows={4}
        placeholder="List significant medical conditions, surgeries, hospitalizations"
      />
    </div>

    {/* Family History */}
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        Family Medical History
      </label>
      <textarea
        {...register('familyHistory')}
        className="input"
        rows={3}
        placeholder="List significant family medical conditions"
      />
    </div>

    {/* Insurance Information */}
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900 dark:text-white">Insurance Information</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Insurance Provider
          </label>
          <input
            type="text"
            {...register('insuranceProvider')}
            className="input"
            placeholder="Insurance company name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Policy Number
          </label>
          <input
            type="text"
            {...register('insurancePolicyNumber')}
            className="input"
            placeholder="Policy number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Group Number
          </label>
          <input
            type="text"
            {...register('insuranceGroupNumber')}
            className="input"
            placeholder="Group number"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Policy Holder Name
          </label>
          <input
            type="text"
            {...register('insurancePolicyHolder')}
            className="input"
            placeholder="Name of policy holder"
          />
        </div>
      </div>
    </div>
  </div>
);

const AdditionalTab = ({ register, _errors, _watch, _setValue }: any) => {
  const nationalities = [
    'American', 'British', 'Canadian', 'Australian', 'Indian', 'Chinese', 'Japanese',
    'German', 'French', 'Italian', 'Spanish', 'Brazilian', 'Mexican', 'Russian',
    'South Korean', 'Saudi', 'Emirati', 'Singaporean', 'Malaysian', 'Indonesian',
    'Filipino', 'Thai', 'Vietnamese', 'Pakistani', 'Bangladeshi', 'Nigerian',
    'Egyptian', 'South African', 'Kenyan', 'Ghanaian', 'Ethiopian', 'Dutch',
    'Belgian', 'Swiss', 'Austrian', 'Swedish', 'Norwegian', 'Danish', 'Finnish',
    'Irish', 'Portuguese', 'Polish', 'Czech', 'Hungarian', 'Romanian', 'Bulgarian',
    'Greek', 'Turkish', 'Ukrainian', 'Israeli', 'New Zealander', 'Argentinian',
    'Chilean', 'Colombian', 'Peruvian', 'Venezuelan', 'Ecuadorian', 'Other'
  ].sort();

  const languages = [
    'English', 'Spanish', 'Mandarin', 'Hindi', 'Arabic', 'Portuguese', 'Bengali',
    'Russian', 'Japanese', 'Punjabi', 'German', 'Javanese', 'Wu (Chinese)',
    'Malay', 'Telugu', 'Vietnamese', 'Korean', 'French', 'Marathi', 'Tamil',
    'Urdu', 'Turkish', 'Italian', 'Yue (Cantonese)', 'Thai', 'Gujarati',
    'Jin (Chinese)', 'Min (Chinese)', 'Persian', 'Polish', 'Pashto', 'Kannada',
    'Xiang (Chinese)', 'Malayalam', 'Sundanese', 'Hausa', 'Odia', 'Burmese',
    'Hakka (Chinese)', 'Ukrainian', 'Bhojpuri', 'Tagalog', 'Yoruba', 'Maithili',
    'Uzbek', 'Sindhi', 'Amharic', 'Fula', 'Romanian', 'Oromo', 'Igbo', 'Azerbaijani',
    'Awadhi', 'Gan (Chinese)', 'Cebuano', 'Dutch', 'Kurdish', 'Serbo-Croatian',
    'Malagasy', 'Saraiki', 'Nepali', 'Sinhala', 'Chittagonian', 'Zhuang', 'Khmer',
    'Turkmen', 'Assamese', 'Madurese', 'Somali', 'Marwari', 'Magahi', 'Haryanvi',
    'Hungarian', 'Chhattisgarhi', 'Greek', 'Chewa', 'Deccan', 'Akan', 'Kazakh',
    'Min Bei (Chinese)', 'Sylheti', 'Zulu', 'Czech', 'Kinyarwanda', 'Dhundhari',
    'Haitian Creole', 'Min Dong (Chinese)', 'Ilokano', 'Quechua', 'Kirundi',
    'Swedish', 'Hmong', 'Shona', 'Uyghur', 'Hiligaynon', 'Mossi', 'Xhosa',
    'Belarusian', 'Balochi', 'Konkani', 'Other'
  ].sort();

  const religions = [
    'Christianity', 'Islam', 'Hinduism', 'Buddhism', 'Sikhism', 'Judaism',
    'Bahá\'í Faith', 'Jainism', 'Shinto', 'Cao Dai', 'Zoroastrianism',
    'Tenrikyo', 'Animism', 'Neo-Paganism', 'Unitarian Universalism',
    'Rastafari', 'Scientology', 'Atheist', 'Agnostic', 'No Religion',
    'Prefer not to say', 'Other'
  ].sort();

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Nationality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Nationality
          </label>
          <select {...register('nationality')} className="input">
            <option value="">Select nationality</option>
            {nationalities.map((nat) => (
              <option key={nat} value={nat}>{nat}</option>
            ))}
          </select>
        </div>

        {/* Language */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Preferred Language
          </label>
          <select {...register('language')} className="input">
            <option value="">Select language</option>
            {languages.map((lang) => (
              <option key={lang} value={lang}>{lang}</option>
            ))}
          </select>
        </div>

        {/* Religion */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Religion
          </label>
          <select {...register('religion')} className="input">
            <option value="">Select religion</option>
            {religions.map((rel) => (
              <option key={rel} value={rel}>{rel}</option>
            ))}
          </select>
        </div>

        {/* VIP Status */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            VIP Status
          </label>
          <div className="flex items-center gap-4 mt-2">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                {...register('isVip')}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">Mark as VIP patient</span>
            </label>
          </div>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Additional Notes
        </label>
        <textarea
          {...register('notes')}
          className="input"
          rows={4}
          placeholder="Any additional information or special instructions"
        />
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          Tags
        </label>
        <input
          type="text"
          {...register('tags')}
          className="input"
          placeholder="Enter tags separated by commas (e.g., diabetic, high-risk, frequent-visitor)"
        />
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Tags help in quickly identifying patient categories and special needs
        </p>
      </div>
    </div>
  );
};