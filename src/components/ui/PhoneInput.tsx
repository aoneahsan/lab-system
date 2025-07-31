import { useState, useEffect } from 'react';
import { countries } from '@/utils/countries';

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const PhoneInput: React.FC<PhoneInputProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Phone number',
  required = false,
}) => {
  const [selectedCountry, setSelectedCountry] = useState(countries[0]);
  const [phoneNumber, setPhoneNumber] = useState('');

  useEffect(() => {
    // Parse value to extract country code and phone number
    if (value) {
      const country = countries.find(c => value.startsWith(c.dialCode));
      if (country) {
        setSelectedCountry(country);
        setPhoneNumber(value.substring(country.dialCode.length));
      } else {
        setPhoneNumber(value);
      }
    }
  }, [value]);

  const formatPhoneNumber = (input: string) => {
    // Remove all non-numeric characters
    const cleaned = input.replace(/\D/g, '');
    
    // Format based on selected country (simplified US/CA formatting)
    if (selectedCountry.code === 'US' || selectedCountry.code === 'CA') {
      if (cleaned.length <= 3) return cleaned;
      if (cleaned.length <= 6) return `${cleaned.slice(0, 3)}-${cleaned.slice(3)}`;
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 6)}-${cleaned.slice(6, 10)}`;
    }
    
    // Default formatting for other countries
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target.value;
    const formatted = formatPhoneNumber(input);
    setPhoneNumber(formatted);
    onChange(`${selectedCountry.dialCode}${formatted.replace(/\D/g, '')}`);
  };

  return (
    <div className={`flex ${className}`}>
      <select
        value={selectedCountry.code}
        onChange={(e) => {
          const country = countries.find(c => c.code === e.target.value);
          if (country) {
            setSelectedCountry(country);
            onChange(`${country.dialCode}${phoneNumber.replace(/\D/g, '')}`);
          }
        }}
        className="flex-shrink-0 px-3 py-2 border border-r-0 border-gray-300 dark:border-gray-600 rounded-l-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500"
      >
        {countries.map((country) => (
          <option key={country.code} value={country.code}>
            {country.flag} {country.dialCode}
          </option>
        ))}
      </select>
      <input
        type="tel"
        value={phoneNumber}
        onChange={handlePhoneChange}
        placeholder={placeholder}
        required={required}
        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-r-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
      />
    </div>
  );
};