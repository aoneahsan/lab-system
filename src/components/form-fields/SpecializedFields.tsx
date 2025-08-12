import React, { useState } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import validator from 'validator';
import { TextField } from './TextField';
import { NumberField } from './NumberField';

interface ZipCodeFieldProps {
  label?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  error?: any;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helpText?: string;
  containerClassName?: string;
  country?: string;
}

export const ZipCodeField: React.FC<ZipCodeFieldProps> = ({
  label = 'Zip/Postal Code',
  country = 'US',
  helpText,
  ...props
}) => {
  const getPattern = () => {
    switch (country) {
      case 'US':
        return '[0-9]{5}(-[0-9]{4})?';
      case 'CA':
        return '[A-Za-z][0-9][A-Za-z] ?[0-9][A-Za-z][0-9]';
      case 'UK':
      case 'GB':
        return '[A-Z]{1,2}[0-9]{1,2}[A-Z]? ?[0-9][A-Z]{2}';
      default:
        return undefined;
    }
  };

  const getPlaceholder = () => {
    switch (country) {
      case 'US':
        return '12345 or 12345-6789';
      case 'CA':
        return 'K1A 0B1';
      case 'UK':
      case 'GB':
        return 'SW1A 1AA';
      default:
        return 'Enter postal code';
    }
  };

  return (
    <TextField
      label={label}
      placeholder={getPlaceholder()}
      pattern={getPattern()}
      helpText={helpText || `Enter a valid ${country} postal code`}
      {...props}
    />
  );
};

interface UrlFieldProps {
  label?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  error?: any;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helpText?: string;
  containerClassName?: string;
  protocols?: string[];
  requireProtocol?: boolean;
}

export const UrlField: React.FC<UrlFieldProps> = ({
  label = 'Website URL',
  protocols = ['http', 'https'],
  requireProtocol = true,
  helpText = 'Enter a valid URL (e.g., https://example.com)',
  ...props
}) => {
  const [localError, setLocalError] = useState<string>('');

  const validateUrl = (url: string): string => {
    if (!url && props.required) {
      return 'URL is required';
    }
    if (url) {
      const options = {
        protocols: protocols as any,
        require_protocol: requireProtocol,
        require_valid_protocol: true,
      };
      if (!validator.isURL(url, options)) {
        return 'Please enter a valid URL';
      }
    }
    return '';
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const error = validateUrl(e.target.value);
    setLocalError(error);
    props.onBlur?.(e);
  };

  return (
    <TextField
      label={label}
      type="url"
      placeholder="https://example.com"
      helpText={helpText}
      error={props.error || localError}
      onBlur={handleBlur}
      {...props}
    />
  );
};

interface SsnFieldProps {
  label?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  error?: any;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helpText?: string;
  containerClassName?: string;
  showLastFourOnly?: boolean;
}

export const SsnField: React.FC<SsnFieldProps> = ({
  label = 'Social Security Number',
  showLastFourOnly = false,
  helpText = 'Enter 9-digit SSN (XXX-XX-XXXX)',
  ...props
}) => {
  const [maskedValue, setMaskedValue] = useState('');
  const [actualValue, setActualValue] = useState(props.value || '');

  const formatSsn = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 3) return cleaned;
    if (cleaned.length <= 5) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
    return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5, 9)}`;
  };

  const maskSsn = (value: string): string => {
    if (!showLastFourOnly) return value;
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length < 4) return value;
    return `XXX-XX-${cleaned.slice(-4)}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatSsn(e.target.value);
    setActualValue(formatted);
    setMaskedValue(maskSsn(formatted));
    
    if (props.onChange) {
      e.target.value = formatted.replace(/\D/g, '');
      props.onChange(e);
    }
  };

  return (
    <TextField
      label={label}
      placeholder="XXX-XX-XXXX"
      pattern="[0-9]{3}-[0-9]{2}-[0-9]{4}"
      maxLength={11}
      helpText={helpText}
      value={showLastFourOnly ? maskedValue : actualValue}
      onChange={handleChange}
      {...props}
    />
  );
};

interface CreditCardFieldProps {
  label?: string;
  name: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  register?: UseFormRegisterReturn;
  error?: any;
  required?: boolean;
  disabled?: boolean;
  loading?: boolean;
  helpText?: string;
  containerClassName?: string;
}

export const CreditCardField: React.FC<CreditCardFieldProps> = ({
  label = 'Card Number',
  helpText = 'Enter 16-digit card number',
  ...props
}) => {
  const [formattedValue, setFormattedValue] = useState(props.value || '');
  const [cardType, setCardType] = useState<string>('');

  const detectCardType = (number: string): string => {
    const cleaned = number.replace(/\s/g, '');
    if (/^4/.test(cleaned)) return 'Visa';
    if (/^5[1-5]/.test(cleaned)) return 'Mastercard';
    if (/^3[47]/.test(cleaned)) return 'American Express';
    if (/^6(?:011|5)/.test(cleaned)) return 'Discover';
    return '';
  };

  const formatCardNumber = (value: string): string => {
    const cleaned = value.replace(/\D/g, '');
    const groups = cleaned.match(/.{1,4}/g) || [];
    return groups.join(' ');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCardNumber(e.target.value);
    setFormattedValue(formatted);
    setCardType(detectCardType(formatted));
    
    if (props.onChange) {
      e.target.value = formatted.replace(/\s/g, '');
      props.onChange(e);
    }
  };

  const validateCard = (value: string): boolean => {
    const cleaned = value.replace(/\D/g, '');
    return validator.isCreditCard(cleaned);
  };

  return (
    <TextField
      label={`${label}${cardType ? ` (${cardType})` : ''}`}
      placeholder="1234 5678 9012 3456"
      maxLength={19}
      helpText={helpText}
      value={formattedValue}
      onChange={handleChange}
      {...props}
    />
  );
};