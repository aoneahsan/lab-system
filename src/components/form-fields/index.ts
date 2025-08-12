// Base components
export { FormFieldWrapper, getInputClassName } from './BaseFormField';
export type { BaseFormFieldProps } from './BaseFormField';

// Core field components
export { TextField } from './TextField';
export { EmailField } from './EmailField';
export { PasswordField, ConfirmPasswordField } from './PasswordField';
export { NumberField, AgeField, PercentageField, CurrencyField } from './NumberField';
export { PhoneField } from './PhoneField';
export { TextareaField } from './TextareaField';

// Date and time components
export { DateField, DateTimeField, TimeField } from './DateField';

// Selection components
export { SelectField } from './SelectField';
export type { SelectOption } from './SelectField';
export { RelationshipField } from './RelationshipField';
export { CountryField, StateField, CityField } from './CountryField';

// Checkbox and switch components
export { CheckboxField, SwitchField } from './CheckboxField';

// Specialized field components
export {
  ZipCodeField,
  UrlField,
  SsnField,
  CreditCardField,
} from './SpecializedFields';

// Commonly used field groups
export const AddressFields = {
  TextField,
  CountryField,
  StateField,
  CityField,
  ZipCodeField,
};

export const ContactFields = {
  EmailField,
  PhoneField,
  UrlField,
};

export const PersonalInfoFields = {
  TextField,
  EmailField,
  PhoneField,
  DateField,
  SelectField,
  RelationshipField,
  AgeField,
};

export const PaymentFields = {
  CreditCardField,
  CurrencyField,
  NumberField,
};

// Validation helpers
export { default as validator } from 'validator';
export { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';