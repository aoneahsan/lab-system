import { useState, useEffect } from 'react';
import { Save, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useQualityControlStore } from '@/stores/quality-control.store';
import { Timestamp } from 'firebase/firestore';
import { uiLogger } from '@/services/logger.service';

export default function QCResultEntry() {
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [value, setValue] = useState('');
  const [comments, setComments] = useState('');
  const [showResult, setShowResult] = useState(false);
  const [lastResult, setLastResult] = useState<{ violations: string[]; status: string } | null>(
    null
  );

  const { qcTests, recordQCResult, loading, fetchQCTests } = useQualityControlStore();

  useEffect(() => {
    fetchQCTests({ status: 'active' });
  }, [fetchQCTests]);

  const selectedQCTest = qcTests.find((t) => t.id === selectedTest);
  const levels = selectedQCTest?.levels || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTest || !selectedLevel || !value) return;

    try {
      const result = await recordQCResult({
        qcTestId: selectedTest,
        levelId: selectedLevel,
        value: parseFloat(value),
        runDate: Timestamp.fromDate(new Date()),
        comments,
      });

      const status =
        result.violations.length === 0
          ? 'accepted'
          : result.violations.includes('1_3s') ||
              result.violations.includes('2_2s') ||
              result.violations.includes('R_4s') ||
              result.violations.includes('4_1s') ||
              result.violations.includes('10x')
            ? 'rejected'
            : 'warning';

      setLastResult({ violations: result.violations, status });
      setShowResult(true);

      // Reset form for next entry
      setValue('');
      setComments('');
    } catch (error) {
      uiLogger.error('Error recording QC result:', error);
    }
  };

  const getViolationDescription = (code: string) => {
    const descriptions: Record<string, string> = {
      '1_2s': 'Control exceeds ±2SD (Warning)',
      '1_3s': 'Control exceeds ±3SD (Rejection)',
      '2_2s': 'Two consecutive values exceed same ±2SD (Rejection)',
      R_4s: 'One value exceeds +2SD, another exceeds -2SD (Rejection)',
      '4_1s': 'Four consecutive values exceed same ±1SD (Rejection)',
      '10x': 'Ten consecutive values on same side of mean (Rejection)',
    };
    return descriptions[code] || code;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Entry Form */}
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Enter QC Result</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QC Test <span className="text-red-500">*</span>
            </label>
            <select
              value={selectedTest}
              onChange={(e) => {
                setSelectedTest(e.target.value);
                setSelectedLevel('');
              }}
              className="input"
              required
            >
              <option value="">Select a QC test</option>
              {qcTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.testName} - Lot: {test.lotNumber}
                </option>
              ))}
            </select>
          </div>

          {selectedTest && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Level <span className="text-red-500">*</span>
              </label>
              <select
                value={selectedLevel}
                onChange={(e) => setSelectedLevel(e.target.value)}
                className="input"
                required
              >
                <option value="">Select a level</option>
                {levels.map((level) => (
                  <option key={level.id} value={level.id}>
                    {level.name} (Target: {level.targetValue} {level.unit})
                  </option>
                ))}
              </select>
            </div>
          )}

          {selectedLevel && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Result Value <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="input"
                  placeholder="Enter result value"
                  required
                />
                {selectedQCTest && selectedLevel && (
                  <p className="text-sm text-gray-500 mt-1">
                    Target: {levels.find((l) => l.id === selectedLevel)?.targetValue}{' '}
                    {levels.find((l) => l.id === selectedLevel)?.unit}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Comments</label>
                <textarea
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  className="input"
                  rows={3}
                  placeholder="Optional comments"
                />
              </div>

              <button type="submit" className="btn btn-primary w-full" disabled={loading}>
                <Save className="h-4 w-4" />
                Submit Result
              </button>
            </>
          )}
        </form>
      </div>

      {/* Result Display */}
      {showResult && lastResult && (
        <div
          className={`bg-white p-6 rounded-lg shadow-sm border ${
            lastResult.status === 'accepted'
              ? 'border-green-200'
              : lastResult.status === 'warning'
                ? 'border-yellow-200'
                : 'border-red-200'
          }`}
        >
          <div className="flex items-start gap-4">
            {lastResult.status === 'accepted' ? (
              <CheckCircle className="h-8 w-8 text-green-500 flex-shrink-0" />
            ) : lastResult.status === 'warning' ? (
              <AlertTriangle className="h-8 w-8 text-yellow-500 flex-shrink-0" />
            ) : (
              <XCircle className="h-8 w-8 text-red-500 flex-shrink-0" />
            )}

            <div className="flex-1">
              <h4
                className={`font-medium text-lg mb-2 ${
                  lastResult.status === 'accepted'
                    ? 'text-green-900'
                    : lastResult.status === 'warning'
                      ? 'text-yellow-900'
                      : 'text-red-900'
                }`}
              >
                QC Result{' '}
                {lastResult.status === 'accepted'
                  ? 'Accepted'
                  : lastResult.status === 'warning'
                    ? 'Warning'
                    : 'Rejected'}
              </h4>

              {lastResult.violations.length > 0 ? (
                <div>
                  <p className="text-sm text-gray-700 mb-2">Violated Rules:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {lastResult.violations.map((violation, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {getViolationDescription(violation)}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-gray-600">
                  All Westgard rules passed. Result is within acceptable limits.
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
