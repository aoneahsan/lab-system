import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';

interface StateSelectProps {
  value: string;
  onChange: (value: string) => void;
  country?: string;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

// Sample states for common countries - in production, this would be more comprehensive
const statesByCountry: Record<string, string[]> = {
  US: [
    'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
    'Delaware', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois', 'Indiana', 'Iowa',
    'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts', 'Michigan',
    'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada', 'New Hampshire',
    'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota', 'Ohio',
    'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
    'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
    'Wisconsin', 'Wyoming'
  ],
  CA: [
    'Alberta', 'British Columbia', 'Manitoba', 'New Brunswick', 'Newfoundland and Labrador',
    'Northwest Territories', 'Nova Scotia', 'Nunavut', 'Ontario', 'Prince Edward Island',
    'Quebec', 'Saskatchewan', 'Yukon'
  ],
  AU: [
    'Australian Capital Territory', 'New South Wales', 'Northern Territory', 'Queensland',
    'South Australia', 'Tasmania', 'Victoria', 'Western Australia'
  ],
  IN: [
    'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa',
    'Gujarat', 'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala',
    'Madhya Pradesh', 'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland',
    'Odisha', 'Punjab', 'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura',
    'Uttar Pradesh', 'Uttarakhand', 'West Bengal'
  ],
};

export const StateSelect: React.FC<StateSelectProps> = ({
  value,
  onChange,
  country = 'US',
  className = '',
  placeholder = 'Select state/province',
  required = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const states = statesByCountry[country] || [];
  const showAsInput = states.length === 0;

  const filteredStates = states.filter(state =>
    state.toLowerCase().includes(search.toLowerCase())
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

  if (showAsInput) {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500 ${className}`}
      />
    );
  }

  return (
    <div ref={dropdownRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full px-3 py-2 text-left border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-primary-500 focus:border-primary-500 flex items-center justify-between ${
          required && !value ? 'border-red-300' : ''
        }`}
      >
        <span>
          {value || <span className="text-gray-500 dark:text-gray-400">{placeholder}</span>}
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
                placeholder="Search states..."
                className="w-full pl-9 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-primary-500 focus:border-primary-500"
              />
            </div>
          </div>
          <div className="max-h-60 overflow-y-auto">
            {filteredStates.length === 0 ? (
              <div className="px-3 py-4 text-center text-gray-500 dark:text-gray-400">
                No states found
              </div>
            ) : (
              filteredStates.map((state) => (
                <button
                  key={state}
                  type="button"
                  onClick={() => {
                    onChange(state);
                    setIsOpen(false);
                    setSearch('');
                  }}
                  className={`w-full px-3 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 ${
                    state === value ? 'bg-primary-50 dark:bg-primary-900/20' : ''
                  }`}
                >
                  {state}
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};