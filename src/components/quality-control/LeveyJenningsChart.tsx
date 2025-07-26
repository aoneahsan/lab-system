import { useState, useEffect } from 'react';
import { TrendingUp, Download } from 'lucide-react';
import { useQualityControlStore } from '@/stores/quality-control.store';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  ResponsiveContainer,
  ResponsiveContainer
} from 'recharts';

export default function LeveyJenningsChart() {
  const [selectedTest, setSelectedTest] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('');
  const [dateRange, setDateRange] = useState(30);
  
  const { qcTests, leveyJenningsData, fetchQCTests, fetchLeveyJenningsData } = useQualityControlStore();

  useEffect(() => {
    fetchQCTests({ status: 'active' });
  }, [fetchQCTests]);

  useEffect(() => {
    if (selectedTest && selectedLevel) {
      fetchLeveyJenningsData(selectedTest, selectedLevel, dateRange);
    }
  }, [selectedTest, selectedLevel, dateRange, fetchLeveyJenningsData]);

  const selectedQCTest = qcTests.find(t => t.id === selectedTest);
  const levels = selectedQCTest?.levels || [];

  const CustomDot = (props: any) => {
    const { cx, cy, payload } = props;
    let fill = '#10B981'; // green for accepted
    
    if (payload.status === 'warning') {
      fill = '#F59E0B'; // yellow for warning
    } else if (payload.status === 'rejected') {
      fill = '#EF4444'; // red for rejected
    }
    
    return <circle cx={cx} cy={cy} r={4} fill={fill} stroke={fill} />;
  };

  const formatDate = (date: Date) => {
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              QC Test
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Level
            </label>
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
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Date Range
            </label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(Number(e.target.value))}
              className="input"
            >
              <option value={7}>Last 7 days</option>
              <option value={14}>Last 14 days</option>
              <option value={30}>Last 30 days</option>
              <option value={60}>Last 60 days</option>
              <option value={90}>Last 90 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Chart */}
      {selectedTest && selectedLevel && leveyJenningsData.length > 0 ? (
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium text-gray-900">Levey-Jennings Chart</h3>
            <button className="btn btn-secondary">
              <Download className="h-4 w-4" />
              Export
            </button>
          </div>

          <ResponsiveContainer width="100%" height={400}>
            <LineChart
              data={leveyJenningsData}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(date) => formatDate(new Date(date))}
                angle={-45}
                textAnchor="end"
                height={60}
              />
              <YAxis />
              <Tooltip 
                labelFormatter={(value) => new Date(value).toLocaleDateString()}
                formatter={(value: any) => value.toFixed(2)}
              />
              <Legend />
              
              {/* Reference lines for SD ranges */}
              <ReferenceLine y={leveyJenningsData[0]?.mean} stroke="#000" strokeDasharray="5 5" label="Mean" />
              <ReferenceLine y={leveyJenningsData[0]?.plusOneSD} stroke="#FFC107" strokeDasharray="3 3" label="+1SD" />
              <ReferenceLine y={leveyJenningsData[0]?.minusOneSD} stroke="#FFC107" strokeDasharray="3 3" label="-1SD" />
              <ReferenceLine y={leveyJenningsData[0]?.plusTwoSD} stroke="#FF9800" strokeDasharray="3 3" label="+2SD" />
              <ReferenceLine y={leveyJenningsData[0]?.minusTwoSD} stroke="#FF9800" strokeDasharray="3 3" label="-2SD" />
              <ReferenceLine y={leveyJenningsData[0]?.plusThreeSD} stroke="#F44336" strokeDasharray="3 3" label="+3SD" />
              <ReferenceLine y={leveyJenningsData[0]?.minusThreeSD} stroke="#F44336" strokeDasharray="3 3" label="-3SD" />
              
              <Line 
                type="monotone" 
                dataKey="value" 
                stroke="#2563EB"
                strokeWidth={2}
                dot={<CustomDot />}
                name="QC Value"
              />
            </LineChart>
          </ResponsiveContainer>

          <div className="mt-4 grid grid-cols-3 gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded-full"></div>
              <span>Accepted</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full"></div>
              <span>Rejected</span>
            </div>
          </div>
        </div>
      ) : selectedTest && selectedLevel ? (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">No QC data available for the selected period</p>
        </div>
      ) : (
        <div className="bg-white p-12 rounded-lg shadow-sm border border-gray-200 text-center">
          <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-500">Select a QC test and level to view the Levey-Jennings chart</p>
        </div>
      )}
    </div>
  );
}