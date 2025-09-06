import React, { useState, useCallback } from 'react';
import { UseFormRegisterReturn } from 'react-hook-form';
import validator from 'validator';
import { Info } from 'lucide-react';
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
  protocols = ['https'],
  requireProtocol = true,
  helpText,
  value = '',
  onChange,
  onBlur,
  ...props
}) => {
  const [localError, setLocalError] = useState<string>('');
  const [showHttpsInfo, setShowHttpsInfo] = useState<boolean>(false);

  const normalizeUrl = useCallback((url: string): string => {
    if (!url) return '';
    
    // Remove any whitespace
    url = url.trim();
    
    // If URL doesn't start with a protocol, add https://
    if (!url.match(/^https?:\/\//i)) {
      url = `https://${url}`;
    }
    
    // If URL starts with http://, replace with https:// and show info
    if (url.match(/^http:\/\//i)) {
      url = url.replace(/^http:/i, 'https:');
      setShowHttpsInfo(true);
    }
    
    return url;
  }, []);

  const validateUrl = useCallback((url: string): string => {
    if (!url && props.required) {
      return 'URL is required';
    }
    if (url) {
      // Validate the normalized URL
      const normalizedUrl = normalizeUrl(url);
      const options = {
        protocols: ['https', 'http'] as any,
        require_protocol: true,
        require_valid_protocol: true,
      };
      if (!validator.isURL(normalizedUrl, options)) {
        return 'Please enter a valid URL';
      }
    }
    return '';
  }, [normalizeUrl, props.required]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    
    // Don't normalize while user is typing, only on blur
    if (onChange) {
      onChange(e);
    }
    
    // Hide HTTPS info when user modifies the field
    setShowHttpsInfo(false);
  }, [onChange]);

  const handleBlur = useCallback((e: React.FocusEvent<HTMLInputElement>) => {
    const normalizedUrl = normalizeUrl(e.target.value);
    
    // Update the field with normalized URL
    if (normalizedUrl !== e.target.value) {
      const syntheticEvent = {
        ...e,
        target: {
          ...e.target,
          value: normalizedUrl,
          name: props.name || '',
        },
      } as React.ChangeEvent<HTMLInputElement>;
      
      if (onChange) {
        onChange(syntheticEvent);
      }
    }
    
    const error = validateUrl(normalizedUrl);
    setLocalError(error);
    
    if (onBlur) {
      onBlur(e);
    }
  }, [normalizeUrl, validateUrl, onChange, onBlur, props.name]);

  const customHelpText = (
    <div className="flex items-start space-x-1">
      {showHttpsInfo && (
        <div className="flex items-center space-x-1 text-blue-600">
          <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span className="text-xs">We automatically upgrade HTTP to HTTPS for security</span>
        </div>
      )}
      {!showHttpsInfo && helpText && (
        <span className="text-xs text-gray-500">{helpText}</span>
      )}
      {!showHttpsInfo && !helpText && (
        <div className="flex items-center space-x-1 text-gray-500">
          <Info className="h-3 w-3 flex-shrink-0 mt-0.5" />
          <span className="text-xs">Enter your website URL (e.g., example.com). We'll add https:// automatically</span>
        </div>
      )}
    </div>
  );

  return (
    <TextField
      label={label}
      type="url"
      placeholder="example.com"
      helpText={customHelpText}
      error={props.error || localError}
      value={value}
      onChange={handleChange}
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