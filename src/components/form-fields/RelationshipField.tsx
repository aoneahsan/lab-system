import React from 'react';
import { SelectField, SelectOption } from './SelectField';

const RELATIONSHIP_OPTIONS: SelectOption[] = [
  { value: 'spouse', label: 'Spouse' },
  { value: 'parent', label: 'Parent' },
  { value: 'child', label: 'Child' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'grandparent', label: 'Grandparent' },
  { value: 'grandchild', label: 'Grandchild' },
  { value: 'aunt', label: 'Aunt' },
  { value: 'uncle', label: 'Uncle' },
  { value: 'niece', label: 'Niece' },
  { value: 'nephew', label: 'Nephew' },
  { value: 'cousin', label: 'Cousin' },
  { value: 'friend', label: 'Friend' },
  { value: 'partner', label: 'Partner' },
  { value: 'guardian', label: 'Guardian' },
  { value: 'caregiver', label: 'Caregiver' },
  { value: 'other', label: 'Other' },
];

interface RelationshipFieldProps {
  label?: string;
  name: string;
  value?: string;
  onChange?: (value: string | null) => void;
  error?: any;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helpText?: string;
  containerClassName?: string;
  labelClassName?: string;
  errorClassName?: string;
  showLabel?: boolean;
  placeholder?: string;
  customOptions?: SelectOption[];
}

export const RelationshipField: React.FC<RelationshipFieldProps> = ({
  label = 'Relationship',
  customOptions,
  ...props
}) => {
  const options = customOptions || RELATIONSHIP_OPTIONS;
  
  return (
    <SelectField
      label={label}
      options={options}
      placeholder="Select relationship"
      isSearchable={true}
      isClearable={true}
      {...props}
    />
  );
};