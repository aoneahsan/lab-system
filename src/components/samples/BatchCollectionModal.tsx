import React, { useState } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useTests } from '@/hooks/useTests';
import { toast } from '@/stores/toast.store';

interface BatchSample {
  id: string;
  patientId: string;
  tests: string[];
  type: string;
  priority: 'routine' | 'urgent' | 'stat';
}

interface BatchCollectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (samples: BatchSample[]) => void;
}

const BatchCollectionModal: React.FC<BatchCollectionModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const { data: patientsData } = usePatients();
  const { data: testsData } = useTests();
  const patients = patientsData?.patients || [];
  const tests = testsData || [];
  
  const [samples, setSamples] = useState<BatchSample[]>([
    {
      id: '1',
      patientId: '',
      tests: [],
      type: 'blood',
      priority: 'routine',
    },
  ]);

  const addSample = () => {
    setSamples([
      ...samples,
      {
        id: Date.now().toString(),
        patientId: '',
        tests: [],
        type: 'blood',
        priority: 'routine',
      },
    ]);
  };

  const removeSample = (id: string) => {
    setSamples(samples.filter((s) => s.id !== id));
  };

  const updateSample = (id: string, updates: Partial<BatchSample>) => {
    setSamples(samples.map((s) => (s.id === id ? { ...s, ...updates } : s)));
  };

  const handleSubmit = () => {
    const validSamples = samples.filter(s => s.patientId && s.tests.length > 0);
    
    if (validSamples.length === 0) {
      toast.error('Invalid Batch', 'Please add at least one valid sample');
      return;
    }

    onSubmit(validSamples);
    setSamples([{
      id: '1',
      patientId: '',
      tests: [],
      type: 'blood',
      priority: 'routine',
    }]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">Batch Collection</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
            <div className="space-y-4">
              {samples.map((sample, index) => (
                <div key={sample.id} className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="text-sm font-medium text-gray-900">
                      Sample #{index + 1}
                    </h4>
                    {samples.length > 1 && (
                      <button
                        onClick={() => removeSample(sample.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Patient
                      </label>
                      <select
                        value={sample.patientId}
                        onChange={(e) => updateSample(sample.id, { patientId: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="">Select patient</option>
                        {patients.map((patient) => (
                          <option key={patient.id} value={patient.id}>
                            {patient.fullName} - {patient.patientId}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Sample Type
                      </label>
                      <select
                        value={sample.type}
                        onChange={(e) => updateSample(sample.id, { type: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="blood">Blood</option>
                        <option value="urine">Urine</option>
                        <option value="stool">Stool</option>
                        <option value="swab">Swab</option>
                        <option value="tissue">Tissue</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Tests
                      </label>
                      <select
                        multiple
                        value={sample.tests}
                        onChange={(e) => {
                          const selected = Array.from(e.target.selectedOptions, option => option.value);
                          updateSample(sample.id, { tests: selected });
                        }}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        size={3}
                      >
                        {tests.map((test: any) => (
                          <option key={test.id} value={test.id}>
                            {test.name} ({test.code})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Priority
                      </label>
                      <select
                        value={sample.priority}
                        onChange={(e) => updateSample(sample.id, { priority: e.target.value as 'routine' | 'urgent' | 'stat' })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="routine">Routine</option>
                        <option value="urgent">Urgent</option>
                        <option value="stat">STAT</option>
                      </select>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button
              onClick={addSample}
              className="mt-4 w-full py-2 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Another Sample
            </button>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Create Batch ({samples.filter(s => s.patientId && s.tests.length > 0).length} samples)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BatchCollectionModal;