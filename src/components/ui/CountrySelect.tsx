import { useState, useRef, useEffect } from 'react';
import { countries, type Country } from '@/utils/countries';
import { ChevronDown, Search } from 'lucide-react';

interface CountrySelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export const CountrySelect: React.FC<CountrySelectProps> = ({
  value,
  onChange,
  className = '',
  placeholder = 'Select country',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedCountry = countries.find(c => c.code === value);

  const filteredCountries = countries.filter(country =>
    country.name.toLowerCase().includes(search.toLowerCase()) ||
    country.code.toLowerCase().includes(search.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleSelect = (country: Country) => {
    onChange(country.code);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 flex items-center justify-between ${
          required && !value ? 'border-red-300' : ''
        }`}
      >
        <span className="flex items-center gap-2">
          {selectedCountry ? (
            <>
              <span>{selectedCountry.flag}</span>
              <span>{selectedCountry.name}</span>
            </>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>
          )}
        </span>
        <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-10 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-80 overflow-hidden">
          <div className="sticky top-0 bg-white dark:bg-gray-800 p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search countries..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredCountries.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                No countries found
              </div>
            ) : (
              filteredCountries.map((country) => (
                <button
                  key={country.code}
                  type="button"
                  onClick={() => handleSelect(country)}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 ${
                    country.code === value ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  <span>{country.flag}</span>
                  <span>{country.name}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};