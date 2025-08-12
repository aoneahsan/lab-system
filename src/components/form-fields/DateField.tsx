import React from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { Controller, Control } from 'react-hook-form';
import { BaseFormFieldProps, FormFieldWrapper, getInputClassName } from './BaseFormField';
import { CalendarIcon } from '@heroicons/react/24/outline';

interface DateFieldProps extends BaseFormFieldProps {
  value?: Date | null;
  onChange?: (date: Date | null) => void;
  control?: Control<any>;
  minDate?: Date;
  maxDate?: Date;
  placeholder?: string;
  dateFormat?: string;
  showTimeSelect?: boolean;
  timeFormat?: string;
  timeIntervals?: number;
  showYearDropdown?: boolean;
  showMonthDropdown?: boolean;
  dropdownMode?: 'scroll' | 'select';
  autoFocus?: boolean;
  isClearable?: boolean;
}

export const DateField: React.FC<DateFieldProps> = ({
  label = 'Date',
  name,
  value,
  onChange,
  control,
  minDate,
  maxDate,
  placeholder = 'Select date',
  dateFormat = 'MM/dd/yyyy',
  showTimeSelect = false,
  timeFormat = 'HH:mm',
  timeIntervals = 15,
  showYearDropdown = true,
  showMonthDropdown = true,
  dropdownMode = 'select',
  autoFocus = false,
  isClearable = true,
  error,
  required = false,
  disabled = false,
  loading = false,
  helpText,
  className = '',
  containerClassName = '',
  labelClassName = '',
  errorClassName = '',
  showLabel = true,
}) => {
  const renderDatePicker = (fieldValue?: Date | null, fieldOnChange?: (date: Date | null) => void) => (
    <div className="relative">
      <DatePicker
        id={name}
        selected={fieldValue}
        onChange={(date: any) => fieldOnChange?.(Array.isArray(date) ? date[0] : date)}
        dateFormat={showTimeSelect ? `${dateFormat} ${timeFormat}` : dateFormat}
        minDate={minDate}
        maxDate={maxDate}
        placeholderText={placeholder}
        showTimeSelect={showTimeSelect}
        timeFormat={timeFormat}
        timeIntervals={timeIntervals}
        showYearDropdown={showYearDropdown}
        showMonthDropdown={showMonthDropdown}
        dropdownMode={dropdownMode}
        autoFocus={autoFocus}
        isClearable={isClearable}
        disabled={disabled || loading}
        className={getInputClassName(`pl-10 ${className}`, error, disabled)}
        wrapperClassName="w-full"
        popperClassName="date-picker-popper"
      />
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <CalendarIcon className="h-5 w-5 text-gray-400" />
      </div>
    </div>
  );

  return (
    <FormFieldWrapper
      label={label}
      name={name}
      error={error}
      required={required}
      disabled={disabled}
      loading={loading}
      helpText={helpText}
      containerClassName={containerClassName}
      labelClassName={labelClassName}
      errorClassName={errorClassName}
      showLabel={showLabel}
    >
      <style>{`
        .date-picker-popper {
          z-index: 9999 !important;
        }
        
        .react-datepicker {
          font-family: inherit;
          border: 1px solid #d1d5db;
          border-radius: 0.5rem;
          background-color: white;
        }
        
        .dark .react-datepicker {
          background-color: #374151;
          border-color: #4b5563;
        }
        
        .react-datepicker__header {
          background-color: #f3f4f6;
          border-bottom: 1px solid #d1d5db;
        }
        
        .dark .react-datepicker__header {
          background-color: #4b5563;
          border-bottom-color: #6b7280;
        }
        
        .react-datepicker__current-month,
        .react-datepicker__day-name,
        .react-datepicker__time-name {
          color: #111827;
        }
        
        .dark .react-datepicker__current-month,
        .dark .react-datepicker__day-name,
        .dark .react-datepicker__time-name {
          color: white;
        }
        
        .react-datepicker__day {
          color: #111827;
        }
        
        .dark .react-datepicker__day {
          color: white;
        }
        
        .react-datepicker__day:hover {
          background-color: #f3f4f6;
        }
        
        .dark .react-datepicker__day:hover {
          background-color: #4b5563;
        }
        
        .react-datepicker__day--selected {
          background-color: #3b82f6;
          color: white;
        }
        
        .react-datepicker__day--selected:hover {
          background-color: #2563eb;
        }
        
        .react-datepicker__day--disabled {
          color: #9ca3af;
          cursor: not-allowed;
        }
        
        .dark .react-datepicker__day--disabled {
          color: #6b7280;
        }
        
        .react-datepicker__time-container {
          border-left: 1px solid #d1d5db;
        }
        
        .dark .react-datepicker__time-container {
          border-left-color: #4b5563;
        }
        
        .react-datepicker__time {
          background-color: white;
        }
        
        .dark .react-datepicker__time {
          background-color: #374151;
        }
        
        .react-datepicker__time-list-item {
          color: #111827;
        }
        
        .dark .react-datepicker__time-list-item {
          color: white;
        }
        
        .react-datepicker__time-list-item:hover {
          background-color: #f3f4f6;
        }
        
        .dark .react-datepicker__time-list-item:hover {
          background-color: #4b5563;
        }
        
        .react-datepicker__time-list-item--selected {
          background-color: #3b82f6 !important;
          color: white !important;
        }
      `}</style>
      
      {control ? (
        <Controller
          name={name}
          control={control}
          render={({ field }) => renderDatePicker(field.value, field.onChange)}
        />
      ) : (
        renderDatePicker(value, onChange)
      )}
    </FormFieldWrapper>
  );
};

export const DateTimeField: React.FC<DateFieldProps> = (props) => {
  return (
    <DateField
      {...props}
      label={props.label || 'Date & Time'}
      showTimeSelect={true}
      dateFormat={props.dateFormat || 'MM/dd/yyyy'}
      timeFormat={props.timeFormat || 'HH:mm'}
    />
  );
};

export const TimeField: React.FC<DateFieldProps> = (props) => {
  return (
    <DateField
      {...props}
      label={props.label || 'Time'}
      showTimeSelect={true}
      dateFormat="HH:mm"
      timeFormat="HH:mm"
      timeIntervals={props.timeIntervals || 15}
    />
  );
};