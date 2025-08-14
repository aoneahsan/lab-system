import React, { useState } from 'react';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { Select } from '@/components/ui/Select';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface OccupationFieldProps extends BaseFormFieldProps {
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  customPlaceholder?: string;
  allowCustom?: boolean;
}

const defaultOccupations = [
  // Healthcare
  'Doctor',
  'Nurse',
  'Pharmacist',
  'Dentist',
  'Medical Technician',
  'Healthcare Worker',
  
  // Education
  'Teacher',
  'Professor',
  'Lecturer',
  'Student',
  'Researcher',
  
  // Technology
  'Software Engineer',
  'Data Scientist',
  'IT Specialist',
  'Web Developer',
  'System Administrator',
  
  // Business
  'Business Owner',
  'Manager',
  'Accountant',
  'Sales Representative',
  'Marketing Professional',
  'Entrepreneur',
  'Consultant',
  
  // Government & Public Service
  'Government Employee',
  'Police Officer',
  'Military Personnel',
  'Civil Servant',
  'Politician',
  
  // Legal
  'Lawyer',
  'Judge',
  'Legal Assistant',
  'Paralegal',
  
  // Engineering
  'Engineer',
  'Civil Engineer',
  'Mechanical Engineer',
  'Electrical Engineer',
  'Chemical Engineer',
  
  // Creative & Media
  'Artist',
  'Designer',
  'Writer',
  'Journalist',
  'Photographer',
  'Videographer',
  'Actor',
  'Musician',
  
  // Service Industry
  'Chef',
  'Waiter',
  'Retail Worker',
  'Customer Service Representative',
  'Delivery Driver',
  'Security Guard',
  
  // Skilled Trades
  'Electrician',
  'Plumber',
  'Carpenter',
  'Mechanic',
  'Construction Worker',
  'Welder',
  
  // Agriculture
  'Farmer',
  'Agricultural Worker',
  
  // Transportation
  'Driver',
  'Pilot',
  'Flight Attendant',
  
  // Finance
  'Banker',
  'Financial Analyst',
  'Insurance Agent',
  'Stock Broker',
  
  // Other
  'Homemaker',
  'Retired',
  'Unemployed',
  'Self-employed',
  'Freelancer',
];

export const OccupationField: React.FC<OccupationFieldProps> = ({
  label = 'Occupation',
  name,
  value = '',
  onChange,
  placeholder = 'Select occupation',
  customPlaceholder = 'Enter custom occupation',
  allowCustom = true,
  error,
  required = false,
  disabled = false,
  loading = false,
  helpText,
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  showLabel = true,
}) => {
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [localValue, setLocalValue] = useState(value);

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedValue = e.target.value;
    if (selectedValue === 'Other' && allowCustom) {
      setShowCustomInput(true);
      setLocalValue('');
      onChange?.('');
    } else {
      setLocalValue(selectedValue);
      onChange?.(selectedValue);
      setShowCustomInput(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    setLocalValue(inputValue);
    onChange?.(inputValue);
  };

  const handleBackToSelect = () => {
    setShowCustomInput(false);
    setLocalValue('');
    onChange?.('');
  };

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={disabled}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      {!showCustomInput ? (
        <Select
          value={localValue}
          onChange={handleSelectChange}
          disabled={disabled || loading}
          className={error ? 'border-red-500' : ''}
        >
          <option value="">{placeholder}</option>
          {defaultOccupations.map((occupation) => (
            <option key={occupation} value={occupation}>
              {occupation}
            </option>
          ))}
          {allowCustom && <option value="Other">Other (Custom)</option>}
        </Select>
      ) : (
        <div className="flex gap-2">
          <Input
            type="text"
            value={localValue}
            onChange={handleInputChange}
            disabled={disabled || loading}
            placeholder={customPlaceholder}
            className={`flex-1 ${error ? 'border-red-500' : ''}`}
            autoFocus
          />
          <Button
            type="button"
            onClick={handleBackToSelect}
            variant="outline"
            size="sm"
            disabled={disabled || loading}
          >
            Back
          </Button>
        </div>
      )}
    </FormFieldWrapper>
  );
};