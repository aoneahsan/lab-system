import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { usePatients, usePatientStats } from '@/hooks/usePatients';
import { PatientSearchFilters } from '@/components/patients/PatientSearchFilters';
import { PatientListTable } from '@/components/patients/PatientListTable';
import { PatientRegistrationForm } from '@/components/patients/PatientRegistrationForm';
import type { PatientSearchFilters as Filters } from '@/types/patient.types';

const PatientsPage = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showRegistrationForm, setShowRegistrationForm] = useState(false);
  const [filters, setFilters] = useState<Filters>({});

  const { data: patientsData, isLoading } = usePatients(filters);
  const { data: stats } = usePatientStats();

  // Check URL params on mount
  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      setShowRegistrationForm(true);
      // Remove the action param after opening the form
      searchParams.delete('action');
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleSearch = () => {
    // Trigger re-fetch with new filters
    // The query will automatically re-run when filters change
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Patients</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage patient records and medical information
          </p>
        </div>
        <button onClick={() => setShowRegistrationForm(true)} className="btn btn-primary">
          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Patient
        </button>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Total Patients
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.totalPatients.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-primary-100 rounded-full">
                <svg
                  className="w-6 h-6 text-primary-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  Active Patients
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.activePatients.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-success-100 rounded-full">
                <svg
                  className="w-6 h-6 text-success-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  New This Month
                </p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.newPatientsThisMonth.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-info-100 rounded-full">
                <svg
                  className="w-6 h-6 text-info-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center">
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400">VIP Patients</p>
                <p className="text-2xl font-semibold text-gray-900 dark:text-white">
                  {stats.vipPatients.toLocaleString()}
                </p>
              </div>
              <div className="p-3 bg-warning-100 rounded-full">
                <svg
                  className="w-6 h-6 text-warning-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Registration Form Modal */}
      {showRegistrationForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Register New Patient
                </h2>
                <button
                  onClick={() => setShowRegistrationForm(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <PatientRegistrationForm
                onSuccess={() => {
                  setShowRegistrationForm(false);
                }}
                onCancel={() => setShowRegistrationForm(false)}
              />
            </div>
          </div>
        </div>
      )}

      {/* Search and Filters */}
      <PatientSearchFilters onFiltersChange={setFilters} onSearch={handleSearch} />

      {/* Patient List */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
        <PatientListTable
          patients={patientsData?.patients || []}
          isLoading={isLoading}
          onPatientSelect={(patient) => navigate(`/patients/${patient.id}`)}
        />

        {/* Pagination */}
        {patientsData && patientsData.hasMore && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <button className="btn btn-secondary">Load More</button>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientsPage;
