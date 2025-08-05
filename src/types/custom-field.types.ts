export type CustomFieldType = 
  | 'text'
  | 'number'
  | 'date'
  | 'datetime'
  | 'select'
  | 'multiselect'
  | 'checkbox'
  | 'radio'
  | 'textarea'
  | 'email'
  | 'phone'
  | 'url'
  | 'file';

export type CustomFieldValidationType = 
  | 'required'
  | 'min'
  | 'max'
  | 'minLength'
  | 'maxLength'
  | 'pattern'
  | 'email'
  | 'url';

export interface CustomFieldValidation {
  type: CustomFieldValidationType;
  value?: string | number | boolean;
  message?: string;
}

export interface CustomFieldOption {
  label: string;
  value: string;
  isDefault?: boolean;
}

export interface CustomFieldDefinition {
  id: string;
  tenantId: string;
  module: 'patient' | 'test' | 'sample' | 'billing' | 'inventory'; // Can be extended
  fieldKey: string; // Unique key for the field
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  options?: CustomFieldOption[]; // For select, multiselect, radio
  validations?: CustomFieldValidation[];
  isRequired?: boolean;
  isActive: boolean;
  displayOrder: number;
  section?: string; // To group fields in sections
  showInList?: boolean; // Show in list views
  showInSearch?: boolean; // Include in search
  showInReports?: boolean; // Include in reports
  metadata?: Record<string, any>;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
}

export interface CustomFieldValue {
  fieldKey: string;
  value: any;
  updatedAt?: Date;
  updatedBy?: string;
}

export interface CustomFieldData {
  [fieldKey: string]: any;
}

export interface CustomFieldFormData {
  fieldDefinition: CustomFieldDefinition;
  value: any;
  error?: string;
}

export interface CreateCustomFieldData {
  module: CustomFieldDefinition['module'];
  fieldKey: string;
  label: string;
  type: CustomFieldType;
  placeholder?: string;
  helperText?: string;
  defaultValue?: any;
  options?: CustomFieldOption[];
  validations?: CustomFieldValidation[];
  isRequired?: boolean;
  section?: string;
  showInList?: boolean;
  showInSearch?: boolean;
  showInReports?: boolean;
  displayOrder?: number;
}

export interface UpdateCustomFieldData extends Partial<CreateCustomFieldData> {
  isActive?: boolean;
}

export interface CustomFieldSection {
  name: string;
  label: string;
  fields: CustomFieldDefinition[];
  displayOrder: number;
}