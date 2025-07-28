import { format } from 'date-fns';
import type { Patient } from '@/types/patient.types';

interface PatientMedicalHistoryTabProps {
  patient: Patient;
}

export const PatientMedicalHistoryTab = ({ patient }: PatientMedicalHistoryTabProps) => {
  return (
    <div className="space-y-6">
      {/* Allergies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allergies</h3>
          <button className="btn btn-sm btn-primary">Add Allergy</button>
        </div>

        {patient.allergies.length > 0 ? (
          <div className="space-y-3">
            {patient.allergies.map((allergy, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  allergy.severity === 'severe'
                    ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                    : allergy.severity === 'moderate'
                      ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {allergy.allergen}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Reaction: {allergy.reaction}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          allergy.severity === 'severe'
                            ? 'bg-danger-100 text-danger-800'
                            : allergy.severity === 'moderate'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {allergy.severity}
                      </span>
                      {allergy.confirmedDate && (
                        <span className="text-gray-500">
                          Confirmed: {format(allergy.confirmedDate, 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-gray-600">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No known allergies</p>
          </div>
        )}
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Medications</h3>
          <button className="btn btn-sm btn-primary">Add Medication</button>
        </div>

        {patient.medications.length > 0 ? (
          <div className="space-y-3">
            {patient.medications
              .filter((med) => !med.endDate || new Date(med.endDate) >= new Date())
              .map((medication, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {medication.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                          <p className="text-gray-900 dark:text-white">{medication.dosage}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                          <p className="text-gray-900 dark:text-white">{medication.frequency}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Prescribed by:</span>
                          <p className="text-gray-900 dark:text-white">
                            {medication.prescribedBy || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Started: {format(medication.startDate, 'MMM dd, yyyy')}
                      </p>
                      {medication.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Notes: {medication.notes}
                        </p>
                      )}
                    </div>
                    <button className="text-gray-400 hover:text-gray-600 ml-4">
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No current medications</p>
          </div>
        )}
      </div>

      {/* Medical History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical History</h3>
          <button className="btn btn-sm btn-primary">Add Condition</button>
        </div>

        {patient.medicalHistory.length > 0 ? (
          <div className="space-y-3">
            {patient.medicalHistory.map((history, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {history.condition}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <p className="text-gray-900 dark:text-white">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              history.status === 'active'
                                ? 'bg-warning-100 text-warning-800'
                                : history.status === 'resolved'
                                  ? 'bg-success-100 text-success-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {history.status}
                          </span>
                        </p>
                      </div>
                      {history.diagnosedDate && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Diagnosed:</span>
                          <p className="text-gray-900 dark:text-white">
                            {format(history.diagnosedDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                    {history.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {history.notes}
                      </p>
                    )}
                  </div>
                  <button className="text-gray-400 hover:text-gray-600 ml-4">
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                      />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No medical history recorded</p>
          </div>
        )}
      </div>

      {/* Past Medications */}
      {patient.medications.filter((med) => med.endDate && new Date(med.endDate) < new Date())
        .length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Past Medications
          </h3>
          <div className="space-y-3">
            {patient.medications
              .filter((med) => med.endDate && new Date(med.endDate) < new Date())
              .map((medication, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {medication.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {medication.dosage} - {medication.frequency}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {format(medication.startDate, 'MMM dd, yyyy')} -{' '}
                        {medication.endDate && format(medication.endDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
