import { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Percent, Activity } from 'lucide-react';
import { useQualityControlStore } from '@/stores/quality-control.store';

export default function QCStatistics() {
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [period, setPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly'>('monthly');

  const { qcTests, statistics, fetchQCTests, calculateStatistics } = useQualityControlStore();

  useEffect(() => {
    fetchQCTests({ status: 'active' });
  }, [fetchQCTests]);

  useEffect(() => {
    if (selectedTest && selectedLevel) {
      calculateStatistics(selectedTest, selectedLevel, period);
    }
  }, [selectedTest, selectedLevel, period, calculateStatistics]);

  const selectedQCTest = qcTests.find((t) => t.id === selectedTest);
  const levels = selectedQCTest?.levels || [];

  const sdDistributionData = statistics
    ? [
        {
          name: 'Within ±1SD',
          value: (statistics.withinSDCount.oneSD / statistics.n) * 100,
          expected: 68.27,
        },
        {
          name: 'Within ±2SD',
          value: (statistics.withinSDCount.twoSD / statistics.n) * 100,
          expected: 95.45,
        },
        {
          name: 'Within ±3SD',
          value: (statistics.withinSDCount.threeSD / statistics.n) * 100,
          expected: 99.73,
        },
      ]
    : [];

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">QC Test</label>
            <select
              value={selectedTest}
              onChange={(e) => {
                setSelectedTest(e.target.value);
                setSelectedLevel('');
              }}
              className="input"
            >
              <option value="">Select a QC test</option>
              {qcTests.map((test) => (
                <option key={test.id} value={test.id}>
                  {test.testName} - Lot: {test.lotNumber}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Level</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="input"
              disabled={!selectedTest}
            >
              <option value="">Select a level</option>
              {levels.map((level) => (
                <option key={level.id} value={level.id}>
                  {level.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value as any)}
              className="input"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="quarterly">Quarterly</option>
            </select>
          </div>
        </div>
      </div>

      {statistics ? (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Mean</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.mean.toFixed(2)}</p>
                </div>
                <Activity className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">SD</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.sd.toFixed(2)}</p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">CV%</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.cv.toFixed(2)}%</p>
                </div>
                <Percent className="h-8 w-8 text-purple-500" />
              </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">n</p>
                  <p className="text-2xl font-bold text-gray-900">{statistics.n}</p>
                </div>
                <Activity className="h-8 w-8 text-indigo-500" />
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* SD Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">SD Distribution</h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={sdDistributionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip formatter={(value: any) => `${value.toFixed(2)}%`} />
                  <Bar dataKey="value" fill="#3B82F6" name="Actual" />
                  <Bar dataKey="expected" fill="#E5E7EB" name="Expected" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Performance Summary */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Performance Summary</h3>
              <div className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Bias</span>
                    <span className="font-medium">{statistics.bias.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full"
                      style={{ width: `${Math.min(Math.abs(statistics.bias), 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Precision (CV%)</span>
                    <span className="font-medium">{statistics.cv.toFixed(2)}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        statistics.cv <= 5
                          ? 'bg-green-600'
                          : statistics.cv <= 10
                            ? 'bg-yellow-600'
                            : 'bg-red-600'
                      }`}
                      style={{ width: `${Math.min(statistics.cv * 10, 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <h4 className="font-medium text-gray-900 mb-2">Performance Assessment</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          statistics.cv <= 5
                            ? 'bg-green-500'
                            : statistics.cv <= 10
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      ></div>
                      <span>
                        Precision:{' '}
                        {statistics.cv <= 5
                          ? 'Excellent'
                          : statistics.cv <= 10
                            ? 'Acceptable'
                            : 'Needs Improvement'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-full ${
                          Math.abs(statistics.bias) <= 5
                            ? 'bg-green-500'
                            : Math.abs(statistics.bias) <= 10
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                      ></div>
                      <span>
                        Accuracy:{' '}
                        {Math.abs(statistics.bias) <= 5
                          ? 'Excellent'
                          : Math.abs(statistics.bias) <= 10
                            ? 'Acceptable'
                            : 'Needs Improvement'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <Activity className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Select a QC test and level to view statistics</p>
        </div>
      )}
    </div>
  );
}
