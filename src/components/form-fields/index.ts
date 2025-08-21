// Base components
export { FormFieldWrapper, getInputClassName } from './BaseFormField';
export type { BaseFormFieldProps } from './BaseFormField';

// Core field components
export { TextField } from './TextField';
export { EmailField } from './EmailField';
export { PasswordField, ConfirmPasswordField } from './PasswordField';
export { NumberField, AgeField, PercentageField, CurrencyField } from './NumberField';
export { PhoneField } from './PhoneField';
export { CustomPhoneField } from './CustomPhoneField';
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

// Additional specialized fields
export { OccupationField } from './OccupationField';
export { LexicalEditorField } from './LexicalEditorField';

// Re-import for field groups
import { TextField } from './TextField';
import { EmailField } from './EmailField';
import { PhoneField } from './PhoneField';
import { DateField } from './DateField';
import { SelectField } from './SelectField';
import { RelationshipField } from './RelationshipField';
import { AgeField, NumberField, CurrencyField } from './NumberField';
import { CountryField, StateField, CityField } from './CountryField';
import { ZipCodeField, UrlField, CreditCardField } from './SpecializedFields';
import { OccupationField } from './OccupationField';
import { LexicalEditorField } from './LexicalEditorField';

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
  OccupationField,
  LexicalEditorField,
};

export const PaymentFields = {
  CreditCardField,
  CurrencyField,
  NumberField,
};

// Validation helpers
export { default as validator } from 'validator';
export { isValidPhoneNumber, parsePhoneNumber } from 'libphonenumber-js';