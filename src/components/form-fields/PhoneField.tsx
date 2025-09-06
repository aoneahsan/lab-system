import React, { useState, useCallback, useEffect } from 'react';
import Select from 'react-select';
import { BaseFormFieldProps, FormFieldWrapper } from './BaseFormField';
import { Phone } from 'lucide-react';
import {
  parsePhoneNumber,
  AsYouType,
  getCountries,
  getCountryCallingCode,
  CountryCode
} from 'libphonenumber-js';

interface PhoneFieldProps extends BaseFormFieldProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  country?: string;
  placeholder?: string;
  autoFocus?: boolean;
}

interface CountryOption {
  value: string;
  label: string;
  flag: string;
  dialCode: string;
}

// Country names mapping (most common countries)
const countryNames: Record<string, string> = {
  US: 'United States',
  GB: 'United Kingdom',
  CA: 'Canada',
  AU: 'Australia',
  NZ: 'New Zealand',
  IE: 'Ireland',
  IN: 'India',
  PK: 'Pakistan',
  BD: 'Bangladesh',
  CN: 'China',
  JP: 'Japan',
  KR: 'South Korea',
  DE: 'Germany',
  FR: 'France',
  IT: 'Italy',
  ES: 'Spain',
  NL: 'Netherlands',
  BE: 'Belgium',
  CH: 'Switzerland',
  AT: 'Austria',
  SE: 'Sweden',
  NO: 'Norway',
  DK: 'Denmark',
  FI: 'Finland',
  PL: 'Poland',
  RU: 'Russia',
  BR: 'Brazil',
  MX: 'Mexico',
  AR: 'Argentina',
  CL: 'Chile',
  CO: 'Colombia',
  PE: 'Peru',
  ZA: 'South Africa',
  EG: 'Egypt',
  NG: 'Nigeria',
  KE: 'Kenya',
  SA: 'Saudi Arabia',
  AE: 'United Arab Emirates',
  IL: 'Israel',
  TR: 'Turkey',
  SG: 'Singapore',
  MY: 'Malaysia',
  TH: 'Thailand',
  ID: 'Indonesia',
  PH: 'Philippines',
  VN: 'Vietnam',
  HK: 'Hong Kong',
  TW: 'Taiwan',
  GR: 'Greece',
  PT: 'Portugal',
  CZ: 'Czech Republic',
  HU: 'Hungary',
  RO: 'Romania',
  BG: 'Bulgaria',
  HR: 'Croatia',
  RS: 'Serbia',
  SI: 'Slovenia',
  SK: 'Slovakia',
  UA: 'Ukraine',
  BY: 'Belarus',
  LT: 'Lithuania',
  LV: 'Latvia',
  EE: 'Estonia',
  IS: 'Iceland',
  MT: 'Malta',
  CY: 'Cyprus',
  LU: 'Luxembourg',
  MC: 'Monaco',
  AD: 'Andorra',
  LI: 'Liechtenstein',
  VA: 'Vatican City',
  BA: 'Bosnia and Herzegovina',
  MK: 'North Macedonia',
  AL: 'Albania',
  ME: 'Montenegro',
  MD: 'Moldova',
  GE: 'Georgia',
  AM: 'Armenia',
  AZ: 'Azerbaijan',
  KZ: 'Kazakhstan',
  UZ: 'Uzbekistan',
  TM: 'Turkmenistan',
  KG: 'Kyrgyzstan',
  TJ: 'Tajikistan',
  AF: 'Afghanistan',
  IR: 'Iran',
  IQ: 'Iraq',
  SY: 'Syria',
  LB: 'Lebanon',
  JO: 'Jordan',
  PS: 'Palestine',
  KW: 'Kuwait',
  BH: 'Bahrain',
  QA: 'Qatar',
  OM: 'Oman',
  YE: 'Yemen',
  LK: 'Sri Lanka',
  NP: 'Nepal',
  BT: 'Bhutan',
  MM: 'Myanmar',
  LA: 'Laos',
  KH: 'Cambodia',
  BN: 'Brunei',
  TL: 'Timor-Leste',
  MN: 'Mongolia',
  KP: 'North Korea',
  MA: 'Morocco',
  DZ: 'Algeria',
  TN: 'Tunisia',
  LY: 'Libya',
  SD: 'Sudan',
  SS: 'South Sudan',
  ET: 'Ethiopia',
  ER: 'Eritrea',
  DJ: 'Djibouti',
  SO: 'Somalia',
  UG: 'Uganda',
  RW: 'Rwanda',
  BI: 'Burundi',
  TZ: 'Tanzania',
  MW: 'Malawi',
  ZM: 'Zambia',
  ZW: 'Zimbabwe',
  MZ: 'Mozambique',
  BW: 'Botswana',
  NA: 'Namibia',
  SZ: 'Eswatini',
  LS: 'Lesotho',
  AO: 'Angola',
  CD: 'DR Congo',
  CG: 'Congo',
  GA: 'Gabon',
  GQ: 'Equatorial Guinea',
  CM: 'Cameroon',
  CF: 'Central African Republic',
  TD: 'Chad',
  NE: 'Niger',
  ML: 'Mali',
  BF: 'Burkina Faso',
  MR: 'Mauritania',
  SN: 'Senegal',
  GM: 'Gambia',
  GW: 'Guinea-Bissau',
  GN: 'Guinea',
  SL: 'Sierra Leone',
  LR: 'Liberia',
  CI: 'Ivory Coast',
  GH: 'Ghana',
  TG: 'Togo',
  BJ: 'Benin',
  CV: 'Cape Verde',
  VE: 'Venezuela',
  GY: 'Guyana',
  SR: 'Suriname',
  UY: 'Uruguay',
  PY: 'Paraguay',
  BO: 'Bolivia',
  EC: 'Ecuador',
  CR: 'Costa Rica',
  PA: 'Panama',
  NI: 'Nicaragua',
  HN: 'Honduras',
  SV: 'El Salvador',
  GT: 'Guatemala',
  BZ: 'Belize',
  CU: 'Cuba',
  DO: 'Dominican Republic',
  HT: 'Haiti',
  JM: 'Jamaica',
  TT: 'Trinidad and Tobago',
  BB: 'Barbados',
  BS: 'Bahamas',
  PR: 'Puerto Rico',
};

// Country data with flags and dial codes
const getCountryOptions = (): CountryOption[] => {
  const countries = getCountries();
  return countries
    .map((countryCode) => {
      try {
        const dialCode = getCountryCallingCode(countryCode as CountryCode);
        return {
          value: countryCode,
          label: countryNames[countryCode] || countryCode,
          flag: getFlagEmoji(countryCode),
          dialCode: `+${dialCode}`,
        };
      } catch {
        return null;
      }
    })
    .filter(Boolean) as CountryOption[];
};

// Convert country code to flag emoji
const getFlagEmoji = (countryCode: string): string => {
  const codePoints = countryCode
    .toUpperCase()
    .split('')
    .map((char) => 127397 + char.charCodeAt(0));
  return String.fromCodePoint(...codePoints);
};

export const PhoneField: React.FC<PhoneFieldProps> = ({
  label = 'Phone Number',
  name,
  value = '',
  onChange,
  country = 'US',
  placeholder = 'Enter phone number',
  autoFocus = false,
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
  const [selectedCountry, setSelectedCountry] = useState<CountryOption | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [localError, setLocalError] = useState<string>('');
  const [touched, setTouched] = useState(false);
  const countryOptions = getCountryOptions();

  // Initialize selected country
  useEffect(() => {
    const option = countryOptions.find((opt) => opt.value === country);
    if (option) {
      setSelectedCountry(option);
    }
  }, [country]);

  // Parse initial value if provided
  useEffect(() => {
    if (value) {
      try {
        const parsed = parsePhoneNumber(value);
        if (parsed) {
          const countryOpt = countryOptions.find((opt) => opt.value === parsed.country);
          if (countryOpt) {
            setSelectedCountry(countryOpt);
            setPhoneNumber(parsed.nationalNumber);
          }
        } else {
          // If can't parse, just set the raw number
          setPhoneNumber(value.replace(/^\+\d+\s*/, ''));
        }
      } catch {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const formatPhoneNumber = useCallback((input: string, countryCode: string): string => {
    try {
      // Clean input for formatting
      const cleanInput = input.replace(/[\s()-]/g, '');
      const formatter = new AsYouType(countryCode as CountryCode);
      return formatter.input(cleanInput);
    } catch {
      return input;
    }
  }, []);

  const validatePhoneNumber = useCallback(
    (number: string, countryCode: string): boolean => {
      if (!number) return !required;
      try {
        // Clean the number first - remove any spaces, dashes, parentheses
        const cleanNumber = number.replace(/[\s()-]/g, '');
        if (!cleanNumber) return !required;
        
        const fullNumber = `${selectedCountry?.dialCode || ''}${cleanNumber}`;
        const parsed = parsePhoneNumber(fullNumber, countryCode as CountryCode);
        return parsed ? parsed.isValid() : false;
      } catch {
        return false;
      }
    },
    [required, selectedCountry]
  );

  const handlePhoneChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      let input = e.target.value.replace(/[^\d\s()-]/g, '');
      
      if (selectedCountry) {
        // Remove country code if user accidentally includes it
        const dialCodeWithoutPlus = selectedCountry.dialCode.replace('+', '');
        if (input.startsWith(dialCodeWithoutPlus)) {
          input = input.substring(dialCodeWithoutPlus.length);
        }
        // Also check if it starts with 0 followed by country code (common mistake)
        if (input.startsWith('0' + dialCodeWithoutPlus)) {
          input = input.substring(dialCodeWithoutPlus.length + 1);
        }
        // Remove leading zeros (common in some countries but not needed for international format)
        input = input.replace(/^0+/, '');
      }
      
      setPhoneNumber(input);

      if (selectedCountry) {
        const formatted = formatPhoneNumber(input, selectedCountry.value);
        const fullNumber = `${selectedCountry.dialCode}${input}`;

        // Create synthetic event with full international number
        const syntheticEvent = {
          ...e,
          target: {
            ...e.target,
            value: fullNumber,
            name: name || '',
          },
        } as React.ChangeEvent<HTMLInputElement>;

        onChange?.(syntheticEvent);

        if (touched) {
          const isValid = validatePhoneNumber(input, selectedCountry.value);
          setLocalError(isValid ? '' : 'Please enter a valid phone number');
        }
      }
    },
    [selectedCountry, touched, formatPhoneNumber, validatePhoneNumber, onChange, name]
  );

  const handleCountryChange = useCallback(
    (option: CountryOption | null) => {
      setSelectedCountry(option);
      setPhoneNumber('');
      setLocalError('');

      // Clear the field when country changes
      if (onChange) {
        const syntheticEvent = {
          target: {
            value: '',
            name: name || '',
          },
        } as React.ChangeEvent<HTMLInputElement>;
        onChange(syntheticEvent);
      }
    },
    [onChange, name]
  );

  const handleBlur = useCallback(() => {
    setTouched(true);
    if (phoneNumber && selectedCountry) {
      const isValid = validatePhoneNumber(phoneNumber, selectedCountry.value);
      setLocalError(isValid ? '' : 'Please enter a valid phone number');
    } else if (required && !phoneNumber) {
      setLocalError('Phone number is required');
    }
  }, [phoneNumber, selectedCountry, required, validatePhoneNumber]);

  const customStyles = {
    control: (provided: any, state: any) => ({
      ...provided,
      minHeight: '36px',
      height: '36px',
      backgroundColor: 'white',
      borderColor: error || localError ? '#ef4444' : state.isFocused ? '#3b82f6' : '#d1d5db',
      boxShadow: state.isFocused ? '0 0 0 2px rgba(59, 130, 246, 0.1)' : 'none',
      '&:hover': {
        borderColor: error || localError ? '#ef4444' : '#9ca3af',
      },
      fontSize: '0.875rem',
    }),
    valueContainer: (provided: any) => ({
      ...provided,
      height: '36px',
      padding: '0 4px',
      display: 'flex',
      alignItems: 'center',
    }),
    input: (provided: any) => ({
      ...provided,
      margin: '0px',
      padding: '0px',
      height: 'auto',
    }),
    indicatorsContainer: (provided: any) => ({
      ...provided,
      height: '36px',
    }),
    menu: (provided: any) => ({
      ...provided,
      zIndex: 9999,
      minWidth: '280px',
      width: 'auto',
    }),
    menuList: (provided: any) => ({
      ...provided,
      maxHeight: '200px',
    }),
    menuPortal: (provided: any) => ({
      ...provided,
      zIndex: 9999,
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      padding: '8px 12px',
      backgroundColor: state.isSelected ? '#3b82f6' : state.isFocused ? '#f3f4f6' : 'white',
      color: state.isSelected ? 'white' : '#111827',
      cursor: 'pointer',
      fontSize: '0.875rem',
      whiteSpace: 'nowrap',
    }),
    singleValue: (provided: any) => ({
      ...provided,
      display: 'flex',
      alignItems: 'center',
      margin: '0px',
      position: 'static',
      transform: 'none',
      maxWidth: '100%',
    }),
    placeholder: (provided: any) => ({
      ...provided,
      color: '#9ca3af',
      margin: '0px',
    }),
    dropdownIndicator: (provided: any) => ({
      ...provided,
      padding: '0 4px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
    }),
    clearIndicator: (provided: any) => ({
      ...provided,
      padding: '0 4px',
      height: '36px',
      display: 'flex',
      alignItems: 'center',
    }),
  };

  const formatOptionLabel = (option: CountryOption) => (
    <div className="flex items-center space-x-2 w-full">
      <span className="text-lg flex-shrink-0">{option.flag}</span>
      <span className="text-sm flex-grow">{option.label}</span>
      <span className="text-xs text-gray-500 flex-shrink-0">{option.dialCode}</span>
    </div>
  );

  const formatSingleValue = (option: CountryOption) => (
    <div className="flex items-center space-x-1">
      <span className="text-base">{option.flag}</span>
      <span className="text-xs text-gray-600 font-medium">{option.dialCode}</span>
    </div>
  );

  const displayError = error || localError;

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={displayError}
      required={required}
      disabled={disabled}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <div className="flex space-x-2">
        <div className="w-24" style={{ minWidth: '96px' }}>
          <Select
            value={selectedCountry}
            onChange={handleCountryChange}
            options={countryOptions}
            formatOptionLabel={formatOptionLabel}
            styles={customStyles}
            isDisabled={disabled || loading}
            isSearchable
            placeholder="+"
            className="react-select-container"
            classNamePrefix="react-select"
            menuPlacement="bottom"
            menuPosition="absolute"
            menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
            components={{
              SingleValue: ({ data }) => formatSingleValue(data as CountryOption),
            }}
          />
        </div>

        <div className="flex-1 relative">
          <div className="absolute inset-y-0 left-0 pl-2 flex items-center pointer-events-none">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
          </div>
          <input
            type="tel"
            name={name}
            value={phoneNumber}
            onChange={handlePhoneChange}
            onBlur={handleBlur}
            placeholder={placeholder}
            disabled={disabled || loading || !selectedCountry}
            autoFocus={autoFocus}
            className={`
              block w-full h-9 pl-8 pr-3 py-1.5 text-sm border rounded-lg
              focus:ring-2 focus:ring-primary-500 focus:border-primary-500
              ${
                displayError
                  ? 'border-red-500 focus:ring-red-500 focus:border-red-500'
                  : 'border-gray-300'
              }
              ${disabled || loading ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
              dark:bg-gray-800 dark:border-gray-600 dark:text-white
            `}
          />
        </div>
      </div>

      {selectedCountry && phoneNumber && (
        <p className="mt-1 text-xs text-gray-500">
          International format: {selectedCountry.dialCode} {formatPhoneNumber(phoneNumber, selectedCountry.value)}
        </p>
      )}
    </FormFieldWrapper>
  );
};
