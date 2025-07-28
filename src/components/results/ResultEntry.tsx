import { useState } from 'react';
import { Save, AlertCircle, CheckCircle } from 'lucide-react';
import { useResultStore } from '@/stores/result.store';
import { useAuthStore } from '@/stores/auth.store';
import type { ResultEntryTest } from '@/types/result.types';

interface ResultEntryProps {
  orderId: string;
  sampleId: string;
  tests: Array<{
    id: string;
    name: string;
    unit?: string;
    referenceRange?: {
      min?: number;
      max?: number;
      normal?: string;
    };
  }>;
}

export default function ResultEntry({ orderId, sampleId, tests }: ResultEntryProps) {
  const { currentUser } = useAuthStore();
  const { enterResults, loading, validationWarnings, validationErrors } = useResultStore();
  const [results, setResults] = useState<Record<string, ResultEntryTest>>({});
  const [saved, setSaved] = useState(false);

  const handleValueChange = (testId: string, testName: string, value: string, unit?: string) => {
    const numValue = parseFloat(value);
    const flag =
      unit && !isNaN(numValue)
        ? calculateFlag(numValue, tests.find((t) => t.id === testId)?.referenceRange)
        : undefined;

    setResults((prev) => ({
      ...prev,
      [testId]: {
        testId,
        testName,
        value: isNaN(numValue) ? value : numValue,
        unit,
        flag,
      },
    }));
  };

  const calculateFlag = (value: number, range?: { min?: number; max?: number }) => {
    if (!range) return undefined;
    if (range.min !== undefined && value < range.min) return 'L';
    if (range.max !== undefined && value > range.max) return 'H';
    return undefined;
  };

  const handleSubmit = async () => {
    if (!currentUser?.tenantId || !currentUser?.id) return;

    const testResults = Object.values(results).filter((r) => r.value !== '');
    if (testResults.length === 0) return;

    try {
      await enterResults(currentUser.tenantId, currentUser.id, {
        orderId,
        sampleId,
        tests: testResults,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error('Error saving results:', error);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">Result Entry</h3>
        <p className="text-sm text-gray-500 mt-1">
          Order: {orderId} | Sample: {sampleId}
        </p>
      </div>

      <div className="p-6">
        <div className="space-y-4">
          {tests.map((test) => {
            const result = results[test.id];
            const hasFlag = result?.flag;

            return (
              <div key={test.id} className="grid grid-cols-12 gap-4 items-center">
                <div className="col-span-5">
                  <label className="block text-sm font-medium text-gray-700">{test.name}</label>
                  {test.referenceRange?.normal && (
                    <p className="text-xs text-gray-500">Normal: {test.referenceRange.normal}</p>
                  )}
                </div>

                <div className="col-span-3">
                  <input
                    type="text"
                    placeholder="Value"
                    onChange={(e) =>
                      handleValueChange(test.id, test.name, e.target.value, test.unit)
                    }
                    className="input"
                  />
                </div>

                <div className="col-span-2">
                  <span className="text-sm text-gray-600">{test.unit || '-'}</span>
                </div>

                <div className="col-span-2">
                  {hasFlag && (
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                        hasFlag === 'H' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {hasFlag}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {validationErrors.length > 0 && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-2" />
              <p className="text-sm text-red-600">Validation Errors:</p>
            </div>
            <ul className="mt-1 list-disc list-inside text-sm text-red-600">
              {validationErrors.map((error, idx) => (
                <li key={idx}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        {validationWarnings.length > 0 && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-yellow-600 mr-2" />
              <p className="text-sm text-yellow-600">Warnings:</p>
            </div>
            <ul className="mt-1 list-disc list-inside text-sm text-yellow-600">
              {validationWarnings.map((warning, idx) => (
                <li key={idx}>{warning}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          {saved && (
            <div className="flex items-center text-green-600">
              <CheckCircle className="h-4 w-4 mr-1" />
              <span className="text-sm">Saved successfully</span>
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || Object.keys(results).length === 0}
            className="btn btn-primary"
          >
            <Save className="h-4 w-4" />
            {loading ? 'Saving...' : 'Save Results'}
          </button>
        </div>
      </div>
    </div>
  );
}
