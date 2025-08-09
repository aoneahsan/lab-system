import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TestTube2,
  AlertCircle,
  CheckCircle,
  Camera,
  FileText,
  Clock,
  Save
} from 'lucide-react';
import { toast } from '@/stores/toast.store';

interface TestResult {
  id: string;
  name: string;
  value: string;
  unit: string;
  reference: string;
  flag?: 'H' | 'L' | 'C';
  status: 'pending' | 'entered' | 'verified';
}

interface ProcessingSample {
  id: string;
  barcode: string;
  patientName: string;
  patientMrn: string;
  tests: TestResult[];
  notes: string;
  startTime: string;
  instrumentId?: string;
}

export const ProcessingScreen: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'manual' | 'batch'>('manual');
  const [selectedTest, setSelectedTest] = useState<string | null>(null);

  // Mock current processing sample
  const [currentSample] = useState<ProcessingSample>({
    id: 'LAB001',
    barcode: 'B123456789',
    patientName: 'John Doe',
    patientMrn: 'MRN123456',
    startTime: new Date().toISOString(),
    notes: '',
    tests: [
      {
        id: '1',
        name: 'Hemoglobin',
        value: '',
        unit: 'g/dL',
        reference: '13.5-17.5',
        status: 'pending',
      },
      {
        id: '2',
        name: 'WBC',
        value: '',
        unit: 'K/�L',
        reference: '4.5-11.0',
        status: 'pending',
      },
      {
        id: '3',
        name: 'Platelets',
        value: '',
        unit: 'K/�L',
        reference: '150-400',
        status: 'pending',
      },
      {
        id: '4',
        name: 'Total Cholesterol',
        value: '',
        unit: 'mg/dL',
        reference: '<200',
        status: 'pending',
      },
      {
        id: '5',
        name: 'LDL',
        value: '',
        unit: 'mg/dL',
        reference: '<100',
        status: 'pending',
      },
      {
        id: '6',
        name: 'HDL',
        value: '',
        unit: 'mg/dL',
        reference: '>40',
        status: 'pending',
      },
    ],
  });

  const [testResults, setTestResults] = useState<TestResult[]>(currentSample.tests);
  const [notes, setNotes] = useState(currentSample.notes);

  const updateTestValue = (testId: string, value: string) => {
    setTestResults(prev => prev.map(test => 
      test.id === testId 
        ? { ...test, value, status: 'entered' as const }
        : test
    ));
  };

  const calculateFlag = (value: string, reference: string): 'H' | 'L' | 'C' | undefined => {
    // Simple logic for demo - in real app, this would be more sophisticated
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return undefined;

    if (reference.includes('-')) {
      const [min, max] = reference.split('-').map(v => parseFloat(v));
      if (numValue < min) return 'L';
      if (numValue > max) return 'H';
    } else if (reference.startsWith('<')) {
      const max = parseFloat(reference.substring(1));
      if (numValue > max) return 'H';
    } else if (reference.startsWith('>')) {
      const min = parseFloat(reference.substring(1));
      if (numValue < min) return 'L';
    }

    return undefined;
  };

  const handleSaveResults = () => {
    const incompleteTests = testResults.filter(test => !test.value);
    if (incompleteTests.length > 0) {
      toast.error('Incomplete Results', `Please enter values for all tests (${incompleteTests.length} remaining)`);
      return;
    }

    // Save logic here
    toast.success('Results Saved', 'Test results have been saved successfully');
    navigate('/labstaff/verification');
  };

  const completedCount = testResults.filter(test => test.status === 'entered').length;
  const progress = (completedCount / testResults.length) * 100;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-semibold text-gray-900">Result Entry</h1>
            <button
              onClick={() => navigate('/labstaff/samples')}
              className="text-sm text-gray-600"
            >
              Cancel
            </button>
          </div>
          
          {/* Sample Info */}
          <div className="bg-gray-100 rounded-lg p-3">
            <div className="flex items-start justify-between">
              <div>
                <p className="font-medium text-gray-900">{currentSample.id} " {currentSample.barcode}</p>
                <p className="text-sm text-gray-600">{currentSample.patientName} " {currentSample.patientMrn}</p>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Clock className="h-4 w-4" />
                  <span>Started 5m ago</span>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mt-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">Progress</span>
              <span className="font-medium">{completedCount}/{testResults.length} tests</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-indigo-600 transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('manual')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'manual' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Manual Entry
            </button>
            <button
              onClick={() => setActiveTab('batch')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeTab === 'batch' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Batch Import
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'manual' ? (
        <>
          {/* Test Results Entry */}
          <div className="p-4 space-y-3">
            {testResults.map((test) => (
              <div
                key={test.id}
                className={`bg-white rounded-lg shadow-sm p-4 ${
                  selectedTest === test.id ? 'ring-2 ring-indigo-500' : ''
                }`}
                onClick={() => setSelectedTest(test.id)}
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium text-gray-900">{test.name}</h3>
                  {test.status === 'entered' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs text-gray-500">Result</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="text"
                        value={test.value}
                        onChange={(e) => updateTestValue(test.id, e.target.value)}
                        placeholder="Enter value"
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-gray-600">{test.unit}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs text-gray-500">Reference</label>
                    <div className="mt-1">
                      <p className="px-3 py-2 bg-gray-100 rounded-lg text-sm">
                        {test.reference} {test.unit}
                      </p>
                    </div>
                  </div>
                </div>

                {test.value && (
                  <div className="mt-2">
                    {(() => {
                      const flag = calculateFlag(test.value, test.reference);
                      if (flag === 'H') {
                        return (
                          <div className="flex items-center gap-1 text-orange-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Above reference range</span>
                          </div>
                        );
                      } else if (flag === 'L') {
                        return (
                          <div className="flex items-center gap-1 text-blue-600 text-sm">
                            <AlertCircle className="h-4 w-4" />
                            <span>Below reference range</span>
                          </div>
                        );
                      } else {
                        return (
                          <div className="flex items-center gap-1 text-green-600 text-sm">
                            <CheckCircle className="h-4 w-4" />
                            <span>Within normal range</span>
                          </div>
                        );
                      }
                    })()}
                  </div>
                )}
              </div>
            ))}

            {/* Notes Section */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <h3 className="font-medium text-gray-900 mb-2">Additional Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Enter any additional notes or observations..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 space-y-3">
            <button className="w-full btn btn-outline flex items-center justify-center gap-2">
              <Camera className="h-5 w-5" />
              Attach Image
            </button>
            <button
              onClick={handleSaveResults}
              disabled={completedCount === 0}
              className="w-full btn btn-primary flex items-center justify-center gap-2"
            >
              <Save className="h-5 w-5" />
              Save Results ({completedCount}/{testResults.length})
            </button>
          </div>
        </>
      ) : (
        /* Batch Import Tab */
        <div className="p-4">
          <div className="bg-white rounded-lg shadow-sm p-6 text-center">
            <TestTube2 className="h-12 w-12 text-gray-400 mx-auto mb-3" />
            <h3 className="font-medium text-gray-900 mb-2">Import from Instrument</h3>
            <p className="text-sm text-gray-600 mb-4">
              Connect to an analyzer to import results automatically
            </p>
            <div className="space-y-3">
              <button className="w-full btn btn-outline">
                Connect to Analyzer
              </button>
              <button className="w-full btn btn-outline flex items-center justify-center gap-2">
                <FileText className="h-5 w-5" />
                Import CSV File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};