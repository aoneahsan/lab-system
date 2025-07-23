import React from 'react';
import { TrendingUp, AlertCircle } from 'lucide-react';
import type { LeveyJenningsData } from '@/types/qc.types';

interface LeveyJenningsChartProps {
  data: LeveyJenningsData;
  height?: number;
}

const LeveyJenningsChart: React.FC<LeveyJenningsChartProps> = ({ data, height = 400 }) => {
  // Simple text-based chart for now
  // In production, use a charting library like recharts or chart.js
  
  const getPointSymbol = (value: number): { symbol: string; color: string } => {
    if (value > data.ucl || value < data.lcl) {
      return { symbol: '✕', color: 'text-red-600' };
    }
    if (value > data.uwl || value < data.lwl) {
      return { symbol: '⚠', color: 'text-yellow-600' };
    }
    return { symbol: '●', color: 'text-green-600' };
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="mb-4">
        <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Levey-Jennings Chart - {data.testName}
        </h3>
        <p className="text-sm text-gray-600 mt-1">
          Mean: {data.mean.toFixed(2)} {data.unit} | SD: {data.sd.toFixed(2)}
        </p>
      </div>

      {/* Control Limits Legend */}
      <div className="mb-4 flex flex-wrap gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-12 border-t-2 border-red-600"></div>
          <span>±3SD (Control Limits)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 border-t-2 border-yellow-600"></div>
          <span>±2SD (Warning Limits)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-12 border-t-2 border-blue-600"></div>
          <span>Mean</span>
        </div>
      </div>

      {/* Simple Chart Display */}
      <div className="border rounded-lg p-4 bg-gray-50" style={{ minHeight: height }}>
        <div className="space-y-2">
          {/* Control Limits */}
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>UCL</span>
            <span>{data.ucl.toFixed(2)} {data.unit}</span>
          </div>
          <div className="border-t border-red-400"></div>
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>UWL</span>
            <span>{data.uwl.toFixed(2)} {data.unit}</span>
          </div>
          <div className="border-t border-yellow-400"></div>
          
          <div className="flex items-center justify-between text-xs font-medium text-gray-700">
            <span>Mean</span>
            <span>{data.mean.toFixed(2)} {data.unit}</span>
          </div>
          <div className="border-t-2 border-blue-600"></div>
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>LWL</span>
            <span>{data.lwl.toFixed(2)} {data.unit}</span>
          </div>
          <div className="border-t border-yellow-400"></div>
          
          <div className="flex items-center justify-between text-xs text-gray-600">
            <span>LCL</span>
            <span>{data.lcl.toFixed(2)} {data.unit}</span>
          </div>
          <div className="border-t border-red-400"></div>
        </div>

        {/* Data Points Table */}
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-700 mb-2">Recent Data Points</h4>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-1">Date</th>
                  <th className="text-center py-1">Value</th>
                  <th className="text-center py-1">Status</th>
                  <th className="text-left py-1">Violations</th>
                </tr>
              </thead>
              <tbody>
                {data.points.slice(-10).reverse().map((point, index) => {
                  const { symbol, color } = getPointSymbol(point.value);
                  return (
                    <tr key={index} className="border-b">
                      <td className="py-1">{formatDate(point.date)}</td>
                      <td className="text-center py-1">
                        <span className={color}>
                          {point.value.toFixed(2)} {symbol}
                        </span>
                      </td>
                      <td className="text-center py-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          point.status === 'pass' ? 'bg-green-100 text-green-800' :
                          point.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {point.status}
                        </span>
                      </td>
                      <td className="py-1 text-xs text-gray-600">
                        {point.violatedRules.join(', ') || '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart Note */}
      <div className="mt-4 flex items-start gap-2 text-sm text-gray-600">
        <AlertCircle className="h-4 w-4 mt-0.5" />
        <p>
          This is a simplified view. In production, a full charting library would display
          the data points plotted over time with control and warning limits.
        </p>
      </div>
    </div>
  );
};

export default LeveyJenningsChart;