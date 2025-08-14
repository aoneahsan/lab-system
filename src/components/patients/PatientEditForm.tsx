import { useState } from 'react';
import { useForm, FormProvider, Controller } from 'react-hook-form';
import { useUrlState } from '@/hooks/useUrlState';
import type { Patient, UpdatePatientData } from '@/types/patient.types';
import { useCustomFieldsByModule, useValidateCustomFields } from '@/hooks/useCustomFields';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import { relationships } from '@/utils/relationships';
import { Plus, Trash2 } from 'lucide-react';

// Import all custom form fields
import {
  TextField,
  EmailField,
  PhoneField,
  DateField,
  SelectField,
  CountryField,
  StateField,
  CityField,
  CheckboxField,
  OccupationField,
  LexicalEditorField,
} from '@/components/form-fields';

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
  const [activeTab, setActiveTab] = useUrlState('tab', {
    defaultValue: 'basic',
    removeDefault: true
  });
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
      allergies: patient.allergies || '',
      medications: patient.medications || '',
      medicalHistory: patient.medicalHistory || '',
      familyHistory: patient.familyHistory || '',
      insuranceProvider: patient.insuranceProvider || '',
      insurancePolicyNumber: patient.insurancePolicyNumber || '',
      insuranceGroupNumber: patient.insuranceGroupNumber || '',
      insurancePolicyHolder: patient.insurancePolicyHolder || '',
      isVip: patient.isVip || false,
      tags: patient.tags || '',
    },
  });

  const {
    control,
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

  const phoneNumbers = watch('phoneNumbers');
  const addresses = watch('addresses');
  const emergencyContacts = watch('emergencyContacts');
  const selectedCountry = watch('addresses.0.country');
  const selectedState = watch('addresses.0.state');

  const handlePhoneChange = (index: number, field: string, value: any) => {
    const updatedPhones = [...phoneNumbers];
    updatedPhones[index] = { ...updatedPhones[index], [field]: value };
    setValue('phoneNumbers', updatedPhones);
  };

  const addPhone = () => {
    setValue('phoneNumbers', [...phoneNumbers, { type: 'mobile', number: '', isPrimary: false }]);
  };

  const removePhone = (index: number) => {
    setValue('phoneNumbers', phoneNumbers.filter((_: any, i: number) => i !== index));
  };

  const handleAddressChange = (index: number, field: string, value: any) => {
    const updatedAddresses = [...addresses];
    updatedAddresses[index] = { ...updatedAddresses[index], [field]: value };
    setValue('addresses', updatedAddresses);
  };

  const addAddress = () => {
    setValue('addresses', [...addresses, { 
      type: 'home', 
      line1: '', 
      city: '', 
      state: '', 
      country: '', 
      postalCode: '', 
      isDefault: false 
    }]);
  };

  const removeAddress = (index: number) => {
    setValue('addresses', addresses.filter((_: any, i: number) => i !== index));
  };

  const handleContactChange = (index: number, field: string, value: any) => {
    const updatedContacts = [...emergencyContacts];
    updatedContacts[index] = { ...updatedContacts[index], [field]: value };
    setValue('emergencyContacts', updatedContacts);
  };

  const addContact = () => {
    setValue('emergencyContacts', [...emergencyContacts, { 
      name: '', 
      relationship: '', 
      phone: '', 
      email: '', 
      address: '' 
    }]);
  };

  const removeContact = (index: number) => {
    setValue('emergencyContacts', emergencyContacts.filter((_: any, i: number) => i !== index));
  };

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

  const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  const maritalStatuses = [
    { value: 'single', label: 'Single' },
    { value: 'married', label: 'Married' },
    { value: 'divorced', label: 'Divorced' },
    { value: 'widowed', label: 'Widowed' },
    { value: 'separated', label: 'Separated' }
  ];
  
  const genders = [
    { value: 'male', label: 'Male' },
    { value: 'female', label: 'Female' },
    { value: 'other', label: 'Other' }
  ];

  const nationalities = [
    'Pakistani', 'Indian', 'American', 'British', 'Canadian', 
    'Australian', 'Chinese', 'Japanese', 'German', 'French'
  ];

  const languages = [
    'English', 'Urdu', 'Hindi', 'Arabic', 'Spanish', 
    'French', 'German', 'Chinese', 'Japanese', 'Korean'
  ];

  const religions = [
    'Islam', 'Christianity', 'Hinduism', 'Buddhism', 
    'Sikhism', 'Judaism', 'Other', 'None'
  ];

  const phoneTypes = [
    { value: 'mobile', label: 'Mobile' },
    { value: 'home', label: 'Home' },
    { value: 'work', label: 'Work' },
    { value: 'other', label: 'Other' }
  ];

  const addressTypes = [
    { value: 'home', label: 'Home' },
    { value: 'work', label: 'Work' },
    { value: 'other', label: 'Other' }
  ];

  return (
    <FormProvider {...formMethods}>
      <form onSubmit={handleSubmit(onFormSubmit)} className="divide-y divide-gray-200 dark:divide-gray-700">
      {/* Tabs */}
      <div className="px-6 py-4">
        <div className="flex space-x-1 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                activeTab === tab.id
                  ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Form Content */}
      <div className="px-6 py-6">
        {/* Basic Information */}
        {activeTab === 'basic' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <TextField
                name="firstName"
                control={control}
                label="First Name"
                required
                error={errors.firstName?.message}
              />
              
              <TextField
                name="middleName"
                control={control}
                label="Middle Name"
                error={errors.middleName?.message}
              />
              
              <TextField
                name="lastName"
                control={control}
                label="Last Name"
                required
                error={errors.lastName?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <DateField
                name="dateOfBirth"
                control={control}
                label="Date of Birth"
                required
                error={errors.dateOfBirth?.message}
              />
              
              <SelectField
                name="gender"
                control={control}
                label="Gender"
                options={genders}
                required
                error={errors.gender?.message}
              />
              
              <SelectField
                name="bloodGroup"
                control={control}
                label="Blood Group"
                options={bloodGroups.map(bg => ({ value: bg, label: bg }))}
                error={errors.bloodGroup?.message}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SelectField
                name="maritalStatus"
                control={control}
                label="Marital Status"
                options={maritalStatuses}
                error={errors.maritalStatus?.message}
              />
            </div>
          </div>
        )}

        {/* Contact Details */}
        {activeTab === 'contact' && (
          <div className="space-y-6">
            <EmailField
              name="email"
              control={control}
              label="Email Address"
              error={errors.email?.message}
            />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Phone Numbers</h3>
                <button
                  type="button"
                  onClick={addPhone}
                  className="btn btn-sm btn-secondary"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Add Phone
                </button>
              </div>
              
              {(phoneNumbers || []).map((phone: any, index: number) => (
                <div key={index} className="flex gap-3 items-start">
                  <Controller
                    name={`phoneNumbers.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        {...field}
                        options={phoneTypes}
                        containerClassName="w-32"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`phoneNumbers.${index}.number`}
                    control={control}
                    render={({ field }) => (
                      <PhoneField
                        {...field}
                        containerClassName="flex-1"
                        defaultCountry="PK"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`phoneNumbers.${index}.isPrimary`}
                    control={control}
                    render={({ field }) => (
                      <CheckboxField
                        {...field}
                        label="Primary"
                      />
                    )}
                  />
                  
                  <button
                    type="button"
                    onClick={() => removePhone(index)}
                    className="btn btn-sm btn-ghost text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <OccupationField
                name="occupation"
                control={control}
                label="Occupation"
                error={errors.occupation?.message}
              />
              
              <TextField
                name="employer"
                control={control}
                label="Employer"
                error={errors.employer?.message}
              />
            </div>
          </div>
        )}

        {/* Addresses */}
        {activeTab === 'address' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Addresses</h3>
              <button
                type="button"
                onClick={addAddress}
                className="btn btn-sm btn-secondary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Address
              </button>
            </div>

            {(addresses || []).map((address: any, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-4">
                  <Controller
                    name={`addresses.${index}.type`}
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        {...field}
                        options={addressTypes}
                        containerClassName="w-32"
                      />
                    )}
                  />
                  
                  <div className="flex items-center gap-3">
                    <Controller
                      name={`addresses.${index}.isDefault`}
                      control={control}
                      render={({ field }) => (
                        <CheckboxField
                          {...field}
                          label="Default"
                        />
                      )}
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeAddress(index)}
                      className="btn btn-sm btn-ghost text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name={`addresses.${index}.line1`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Address Line 1"
                        containerClassName="md:col-span-2"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`addresses.${index}.line2`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Address Line 2"
                        containerClassName="md:col-span-2"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`addresses.${index}.city`}
                    control={control}
                    render={({ field }) => (
                      <CityField
                        {...field}
                        label="City"
                        countryName={address.country}
                        stateName={address.state}
                      />
                    )}
                  />
                  
                  <Controller
                    name={`addresses.${index}.state`}
                    control={control}
                    render={({ field }) => (
                      <StateField
                        {...field}
                        label="State/Province"
                        countryId={address.countryId}
                      />
                    )}
                  />
                  
                  <Controller
                    name={`addresses.${index}.country`}
                    control={control}
                    render={({ field }) => (
                      <CountryField
                        {...field}
                        label="Country"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`addresses.${index}.postalCode`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Postal Code"
                      />
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Emergency Contacts */}
        {activeTab === 'emergency' && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium">Emergency Contacts</h3>
              <button
                type="button"
                onClick={addContact}
                className="btn btn-sm btn-secondary"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Contact
              </button>
            </div>

            {(emergencyContacts || []).map((contact: any, index: number) => (
              <div key={index} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                <div className="flex justify-end mb-4">
                  <button
                    type="button"
                    onClick={() => removeContact(index)}
                    className="btn btn-sm btn-ghost text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Controller
                    name={`emergencyContacts.${index}.name`}
                    control={control}
                    render={({ field }) => (
                      <TextField
                        {...field}
                        label="Contact Name"
                        required
                      />
                    )}
                  />
                  
                  <Controller
                    name={`emergencyContacts.${index}.relationship`}
                    control={control}
                    render={({ field }) => (
                      <SelectField
                        {...field}
                        label="Relationship"
                        options={relationships.map(r => ({ value: r.value, label: r.label }))}
                        required
                      />
                    )}
                  />
                  
                  <Controller
                    name={`emergencyContacts.${index}.phone`}
                    control={control}
                    render={({ field }) => (
                      <PhoneField
                        {...field}
                        label="Phone Number"
                        defaultCountry="PK"
                        required
                      />
                    )}
                  />
                  
                  <Controller
                    name={`emergencyContacts.${index}.email`}
                    control={control}
                    render={({ field }) => (
                      <EmailField
                        {...field}
                        label="Email Address"
                      />
                    )}
                  />
                  
                  <Controller
                    name={`emergencyContacts.${index}.address`}
                    control={control}
                    render={({ field }) => (
                      <LexicalEditorField
                        {...field}
                        label="Address"
                        containerClassName="md:col-span-2"
                        minHeight="100px"
                        showToolbar={false}
                      />
                    )}
                  />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Medical Information */}
        {activeTab === 'medical' && (
          <div className="space-y-6">
            <LexicalEditorField
              name="allergies"
              control={control}
              label="Allergies"
              placeholder="List any known allergies..."
              minHeight="100px"
              error={errors.allergies?.message}
            />
            
            <LexicalEditorField
              name="medications"
              control={control}
              label="Current Medications"
              placeholder="List current medications..."
              minHeight="100px"
              error={errors.medications?.message}
            />
            
            <LexicalEditorField
              name="medicalHistory"
              control={control}
              label="Medical History"
              placeholder="Describe medical history..."
              minHeight="150px"
              error={errors.medicalHistory?.message}
            />
            
            <LexicalEditorField
              name="familyHistory"
              control={control}
              label="Family Medical History"
              placeholder="Describe family medical history..."
              minHeight="150px"
              error={errors.familyHistory?.message}
            />

            <div className="border-t pt-6">
              <h3 className="text-lg font-medium mb-4">Insurance Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <TextField
                  name="insuranceProvider"
                  control={control}
                  label="Insurance Provider"
                  error={errors.insuranceProvider?.message}
                />
                
                <TextField
                  name="insurancePolicyNumber"
                  control={control}
                  label="Policy Number"
                  error={errors.insurancePolicyNumber?.message}
                />
                
                <TextField
                  name="insuranceGroupNumber"
                  control={control}
                  label="Group Number"
                  error={errors.insuranceGroupNumber?.message}
                />
                
                <TextField
                  name="insurancePolicyHolder"
                  control={control}
                  label="Policy Holder Name"
                  error={errors.insurancePolicyHolder?.message}
                />
              </div>
            </div>
          </div>
        )}

        {/* Additional Information */}
        {activeTab === 'additional' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <SelectField
                name="nationality"
                control={control}
                label="Nationality"
                options={nationalities.map(n => ({ value: n, label: n }))}
                error={errors.nationality?.message}
              />
              
              <SelectField
                name="language"
                control={control}
                label="Preferred Language"
                options={languages.map(l => ({ value: l, label: l }))}
                error={errors.language?.message}
              />
              
              <SelectField
                name="religion"
                control={control}
                label="Religion"
                options={religions.map(r => ({ value: r, label: r }))}
                error={errors.religion?.message}
              />
            </div>

            <CheckboxField
              name="isVip"
              control={control}
              label="VIP Patient"
              helpText="Mark if patient requires special attention"
            />

            <LexicalEditorField
              name="notes"
              control={control}
              label="Additional Notes"
              placeholder="Any additional information about the patient..."
              minHeight="200px"
              error={errors.notes?.message}
            />

            <TextField
              name="tags"
              control={control}
              label="Tags"
              placeholder="Enter comma-separated tags"
              helpText="Add tags to help categorize and search for this patient"
              error={errors.tags?.message}
            />
          </div>
        )}

        {/* Custom Fields */}
        {activeTab === 'custom' && customFields.length > 0 && (
          <CustomFieldsManager
            fields={customFields}
            values={watch('customFields')}
            onChange={(values) => setValue('customFields', values)}
            errors={errors.customFields}
          />
        )}
      </div>

      {/* Form Actions */}
      <div className="px-6 py-4 bg-gray-50 dark:bg-gray-800/50 flex justify-end gap-3">
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