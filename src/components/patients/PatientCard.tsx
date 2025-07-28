import React from 'react';
import type { Patient } from '@/types/patient.types';
import {
  PhoneIcon,
  EnvelopeIcon,
  CalendarIcon,
  ShieldCheckIcon,
  UserIcon,
} from '@heroicons/react/24/outline';
import { format } from 'date-fns';

interface PatientCardProps {
  patient: Patient;
  onClick?: (patient: Patient) => void;
}

export const PatientCard: React.FC<PatientCardProps> = ({ patient, onClick }) => {
  const calculateAge = (dateOfBirth: Date) => {
    const birthDate = new Date(dateOfBirth);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  };

  const age = calculateAge(patient.dateOfBirth);
  const primaryInsurance = patient.insurances?.find((ins) => ins.isPrimary);

  return (
    <article
      className={`
        bg-white rounded-lg border border-gray-200 p-6 
        transition-all duration-200
        ${onClick ? 'cursor-pointer hover:shadow-md hover:border-gray-300' : ''}
      `}
      onClick={() => onClick?.(patient)}
    >
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className="h-12 w-12 rounded-full bg-primary-100 flex items-center justify-center">
            <UserIcon className="h-6 w-6 text-primary-600" />
          </div>
          <div>
            <h3 className="font-medium text-gray-900">
              {patient.firstName} {patient.lastName}
            </h3>
            <p className="text-sm text-gray-500">MRN: {patient.mrn}</p>
          </div>
        </div>
      </div>

      {/* Demographics */}
      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <CalendarIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {age} years • {patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1)}
          </span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <span className="text-gray-600">
            DOB: {format(new Date(patient.dateOfBirth), 'MM/dd/yyyy')}
          </span>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-2 mb-4">
        <div className="flex items-center space-x-2 text-sm">
          <PhoneIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{patient.phoneNumbers?.[0]?.value || 'No phone'}</span>
        </div>
        <div className="flex items-center space-x-2 text-sm">
          <EnvelopeIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">{patient.email}</span>
        </div>
      </div>

      {/* Insurance Information */}
      <div className="border-t pt-4">
        <div className="flex items-center space-x-2 text-sm">
          <ShieldCheckIcon className="h-4 w-4 text-gray-400" />
          <span className="text-gray-600">
            {primaryInsurance
              ? `${primaryInsurance.provider} - ${primaryInsurance.policyNumber}`
              : 'No insurance on file'}
          </span>
        </div>
      </div>
    </article>
  );
};
