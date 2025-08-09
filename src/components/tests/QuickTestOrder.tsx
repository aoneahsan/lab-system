import React, { useState } from 'react';
import { Search, X, Zap } from 'lucide-react';
import { useTests, useCreateTestOrder } from '@/hooks/useTests';
import { usePatients } from '@/hooks/usePatients';
import { toast } from '@/stores/toast.store';
import type { PatientListItem } from '@/types/patient.types';

interface QuickTestOrderProps {
  preselectedPatientId?: string;
  onSuccess?: () => void;
}

const QuickTestOrder: React.FC<QuickTestOrderProps> = ({ preselectedPatientId, onSuccess }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [patientSearch, setPatientSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const [priority, setPriority] = useState<'routine' | 'stat' | 'asap'>('routine');
  const [notes, setNotes] = useState('');

  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];
  const { data: tests = [] } = useTests({ isActive: true });
  const createOrderMutation = useCreateTestOrder();

  // Common test groups for quick selection
  const commonTestGroups = [
    {
      name: 'Basic Metabolic Panel',
      tests: ['GLUCOSE', 'BUN', 'CREAT', 'NA', 'K', 'CL', 'CO2', 'CA'],
    },
    {
      name: 'Complete Blood Count',
      tests: ['CBC', 'HGB', 'HCT', 'WBC', 'PLT'],
    },
    {
      name: 'Liver Function Tests',
      tests: ['ALT', 'AST', 'ALP', 'TBILI', 'DBILI', 'ALB', 'TP'],
    },
    {
      name: 'Lipid Panel',
      tests: ['CHOL', 'TRIG', 'HDL', 'LDL'],
    },
    {
      name: 'Thyroid Panel',
      tests: ['TSH', 'FT4', 'FT3'],
    },
  ];

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const handleQuickSelect = (testCodes: string[]) => {
    const testIds = tests
      .filter((test) => testCodes.includes(test.code))
      .map((test) => test.id);
    setSelectedTests([...new Set([...selectedTests, ...testIds])]);
  };

  const handleSubmit = async () => {
    if (!selectedPatient && !preselectedPatientId) {
      toast.error('Please select a patient');
      return;
    }

    if (selectedTests.length === 0) {
      toast.error('Please select at least one test');
      return;
    }

    try {
      await createOrderMutation.mutateAsync({
        patientId: preselectedPatientId || selectedPatient!.id,
        tests: selectedTests,
        priority,
        notes,
        fasting: false,
      });

      toast.success('Test order created successfully');
      setIsOpen(false);
      resetForm();
      onSuccess?.();
    } catch {
      toast.error('Failed to create test order');
    }
  };

  const resetForm = () => {
    setSelectedPatient(null);
    setSelectedTests([]);
    setPriority('routine');
    setNotes('');
    setPatientSearch('');
  };

  const selectedTestDetails = tests.filter((test) => selectedTests.includes(test.id));

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="btn btn-primary flex items-center gap-2"
      >
        <Zap className="h-4 w-4" />
        Quick Order
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-gray-900 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  Quick Test Order
                </h2>
                <button
                  onClick={() => {
                    setIsOpen(false);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">
                {/* Patient Selection */}
                {!preselectedPatientId && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Patient
                    </label>
                    {!selectedPatient ? (
                      <div>
                        <div className="relative">
                          <input
                            type="text"
                            value={patientSearch}
                            onChange={(e) => setPatientSearch(e.target.value)}
                            placeholder="Search by name or MRN..."
                            className="input pl-10"
                          />
                          <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                        </div>
                        {patientSearch && filteredPatients.length > 0 && (
                          <div className="mt-2 max-h-40 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded-md">
                            {filteredPatients.slice(0, 5).map((patient) => (
                              <button
                                key={patient.id}
                                onClick={() => {
                                  setSelectedPatient(patient);
                                  setPatientSearch('');
                                }}
                                className="w-full px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-800"
                              >
                                <div className="font-medium text-gray-900 dark:text-white">
                                  {patient.fullName}
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">
                                  MRN: {patient.patientId}
                                </div>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium text-gray-900 dark:text-white">
                            {selectedPatient.fullName}
                          </div>
                          <div className="text-sm text-gray-500 dark:text-gray-400">
                            MRN: {selectedPatient.patientId}
                          </div>
                        </div>
                        <button
                          onClick={() => setSelectedPatient(null)}
                          className="text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Quick Test Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Quick Select Common Tests
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {commonTestGroups.map((group) => (
                      <button
                        key={group.name}
                        onClick={() => handleQuickSelect(group.tests)}
                        className="p-3 text-left border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                      >
                        <div className="font-medium text-sm text-gray-900 dark:text-white">
                          {group.name}
                        </div>
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {group.tests.join(', ')}
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Selected Tests */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Selected Tests ({selectedTests.length})
                  </label>
                  {selectedTestDetails.length > 0 ? (
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {selectedTestDetails.map((test) => (
                        <div
                          key={test.id}
                          className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded"
                        >
                          <div>
                            <span className="font-medium text-sm">{test.name}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">
                              ({test.code})
                            </span>
                          </div>
                          <button
                            onClick={() =>
                              setSelectedTests(selectedTests.filter((id) => id !== test.id))
                            }
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      No tests selected. Use quick select above or search for specific tests.
                    </p>
                  )}
                </div>

                {/* Priority */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Priority
                  </label>
                  <div className="flex gap-4">
                    {(['routine', 'asap', 'stat'] as const).map((p) => (
                      <label key={p} className="flex items-center">
                        <input
                          type="radio"
                          value={p}
                          checked={priority === p}
                          onChange={(e) => setPriority(e.target.value as typeof priority)}
                          className="mr-2"
                        />
                        <span className="text-sm capitalize">{p}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={2}
                    className="input"
                    placeholder="Additional instructions or notes..."
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
              <button
                onClick={() => {
                  setIsOpen(false);
                  resetForm();
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                disabled={
                  createOrderMutation.isPending ||
                  (!selectedPatient && !preselectedPatientId) ||
                  selectedTests.length === 0
                }
                className="btn btn-primary"
              >
                {createOrderMutation.isPending ? 'Creating...' : 'Create Order'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default QuickTestOrder;