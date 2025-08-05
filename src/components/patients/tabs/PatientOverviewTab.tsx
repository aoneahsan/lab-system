import { format } from 'date-fns';
import { CustomFieldsManager } from '@/components/custom-fields/CustomFieldsManager';
import type { Patient } from '@/types/patient.types';

interface PatientOverviewTabProps {
  patient: Patient;
}

export const PatientOverviewTab = ({ patient }: PatientOverviewTabProps) => {
  const primaryPhone = patient.phoneNumbers.find((p) => p.isPrimary) || patient.phoneNumbers[0];
  const defaultAddress = patient.addresses.find((a) => a.isDefault) || patient.addresses[0];
  const primaryEmergencyContact = patient.emergencyContacts[0];

  return (
    <div className="space-y-6">
      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Phone Number
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {primaryPhone?.value || 'Not provided'}
              {primaryPhone?.isVerified && (
                <span className="ml-2 text-success-600">✓ Verified</span>
              )}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Email Address
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{patient.email || 'Not provided'}</p>
          </div>
        </div>
      </div>

      {/* Address */}
      {defaultAddress && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Address</h3>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-900 dark:text-white">
              {defaultAddress.line1}
              {defaultAddress.line2 && (
                <>
                  <br />
                  {defaultAddress.line2}
                </>
              )}
              <br />
              {defaultAddress.city}, {defaultAddress.state} {defaultAddress.postalCode}
              <br />
              {defaultAddress.country}
            </p>
          </div>
        </div>
      )}

      {/* Personal Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Date of Birth
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {format(patient.dateOfBirth, 'MMMM dd, yyyy')}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Gender
            </label>
            <p className="mt-1 text-gray-900 dark:text-white capitalize">{patient.gender}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Blood Group
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{patient.bloodGroup || 'Unknown'}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Marital Status
            </label>
            <p className="mt-1 text-gray-900 dark:text-white capitalize">
              {patient.maritalStatus || 'Unknown'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Nationality
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {patient.nationality || 'Not specified'}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
              Occupation
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {patient.occupation || 'Not specified'}
            </p>
          </div>
        </div>
      </div>

      {/* Emergency Contact */}
      {primaryEmergencyContact && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Emergency Contact
          </h3>
          <div className="bg-danger-50 dark:bg-danger-900/20 border border-danger-200 dark:border-danger-800 p-4 rounded-lg">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Name
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">{primaryEmergencyContact.name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Relationship
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {primaryEmergencyContact.relationship}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400">
                  Phone Number
                </label>
                <p className="mt-1 text-gray-900 dark:text-white">
                  {primaryEmergencyContact.phone}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Insurances */}
      {patient.insurances.length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Insurance Information
          </h3>
          <div className="space-y-4">
            {patient.insurances.map((insurance, index) => (
              <div key={insurance.id} className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {insurance.provider}
                  </h4>
                  {index === 0 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary-100 text-primary-800">
                      Primary
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Policy #:</span>
                    <p className="text-gray-900 dark:text-white">{insurance.policyNumber}</p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Group #:</span>
                    <p className="text-gray-900 dark:text-white">
                      {insurance.groupNumber || 'N/A'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-600 dark:text-gray-400">Valid From:</span>
                    <p className="text-gray-900 dark:text-white">
                      {format(insurance.validFrom, 'MM/dd/yyyy')}
                    </p>
                  </div>
                  {insurance.validTo && (
                    <div>
                      <span className="text-gray-600 dark:text-gray-400">Valid To:</span>
                      <p className="text-gray-900 dark:text-white">
                        {format(insurance.validTo, 'MM/dd/yyyy')}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Additional Notes */}
      {patient.notes && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Additional Notes
          </h3>
          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg">
            <p className="text-gray-900 dark:text-white whitespace-pre-wrap">{patient.notes}</p>
          </div>
        </div>
      )}

      {/* Custom Fields */}
      {patient.customFields && Object.keys(patient.customFields).length > 0 && (
        <CustomFieldsManager
          module="patient"
          values={patient.customFields}
          readOnly={true}
          showSections={true}
        />
      )}

      {/* Record Information */}
      <div>
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
          Record Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400">Created On</label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {format(patient.createdAt, 'MMM dd, yyyy hh:mm a')}
            </p>
          </div>
          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400">
              Last Updated
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">
              {format(patient.updatedAt, 'MMM dd, yyyy hh:mm a')}
            </p>
          </div>
          <div>
            <label className="block font-medium text-gray-600 dark:text-gray-400">
              Total Visits
            </label>
            <p className="mt-1 text-gray-900 dark:text-white">{patient.totalVisits}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
