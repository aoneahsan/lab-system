import React, { useState } from 'react';
import {
  ClipboardCheck,
  AlertCircle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Activity,
  Calendar,
  Filter,
  Plus,
  BarChart3,
  AlertTriangle,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { useNavigate } from 'react-router-dom';

interface QCResult {
  id: string;
  controlName: string;
  testName: string;
  level: 'low' | 'normal' | 'high';
  result: number;
  target: number;
  sd: number;
  status: 'pass' | 'warning' | 'fail';
  runTime: Date;
  operator: string;
  instrument: string;
  lot: string;
}

interface QCRule {
  name: string;
  violated: boolean;
  description: string;
}

export const QualityControlScreen: React.FC = () => {
  const navigate = useNavigate();
  const [filterTest, setFilterTest] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date());

  const [qcResults] = useState<QCResult[]>([
    {
      id: '1',
      controlName: 'Chemistry Control',
      testName: 'Glucose',
      level: 'normal',
      result: 98.5,
      target: 100,
      sd: 2.5,
      status: 'pass',
      runTime: new Date(Date.now() - 2 * 60 * 60 * 1000),
      operator: 'John Smith',
      instrument: 'Cobas 6000',
      lot: 'LOT123456'
    },
    {
      id: '2',
      controlName: 'Chemistry Control',
      testName: 'Creatinine',
      level: 'high',
      result: 4.8,
      target: 4.5,
      sd: 0.2,
      status: 'warning',
      runTime: new Date(Date.now() - 3 * 60 * 60 * 1000),
      operator: 'John Smith',
      instrument: 'Cobas 6000',
      lot: 'LOT123456'
    },
    {
      id: '3',
      controlName: 'Hematology Control',
      testName: 'WBC',
      level: 'normal',
      result: 7.2,
      target: 7.5,
      sd: 0.5,
      status: 'pass',
      runTime: new Date(Date.now() - 4 * 60 * 60 * 1000),
      operator: 'Mary Johnson',
      instrument: 'Sysmex XN-1000',
      lot: 'LOT789012'
    }
  ]);

  const [westgardRules] = useState<QCRule[]>([
    { name: '1-2s', violated: false, description: 'One control exceeds ±2SD' },
    { name: '1-3s', violated: false, description: 'One control exceeds ±3SD' },
    { name: '2-2s', violated: true, description: 'Two consecutive controls exceed ±2SD' },
    { name: 'R-4s', violated: false, description: 'Range between controls exceeds 4SD' },
    { name: '4-1s', violated: false, description: 'Four consecutive controls exceed ±1SD' },
    { name: '10x', violated: false, description: 'Ten consecutive controls on same side of mean' }
  ]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pass':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'fail':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case 'fail':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const calculateZScore = (result: number, target: number, sd: number) => {
    return ((result - target) / sd).toFixed(1);
  };

  const filteredResults = qcResults.filter(result => {
    if (filterTest !== 'all' && !result.testName.toLowerCase().includes(filterTest.toLowerCase())) {
      return false;
    }
    if (filterStatus !== 'all' && result.status !== filterStatus) {
      return false;
    }
    return true;
  });

  const violatedRulesCount = westgardRules.filter(rule => rule.violated).length;

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-xl font-semibold text-gray-900">Quality Control</h1>
            <button
              onClick={() => navigate('/lab-staff/qc/run')}
              className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-600">
                {qcResults.filter(r => r.status === 'pass').length}
              </p>
              <p className="text-xs text-green-700">Passed</p>
            </div>
            <div className="bg-yellow-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-yellow-600">
                {qcResults.filter(r => r.status === 'warning').length}
              </p>
              <p className="text-xs text-yellow-700">Warning</p>
            </div>
            <div className="bg-red-50 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-600">
                {qcResults.filter(r => r.status === 'fail').length}
              </p>
              <p className="text-xs text-red-700">Failed</p>
            </div>
          </div>

          {/* Westgard Rules Alert */}
          {violatedRulesCount > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">
                    {violatedRulesCount} Westgard Rule{violatedRulesCount > 1 ? 's' : ''} Violated
                  </span>
                </div>
                <button
                  onClick={() => navigate('/lab-staff/qc/rules')}
                  className="text-sm text-red-600 font-medium"
                >
                  View Details
                </button>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex space-x-2">
            <select
              value={filterTest}
              onChange={(e) => setFilterTest(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Tests</option>
              <option value="glucose">Glucose</option>
              <option value="creatinine">Creatinine</option>
              <option value="wbc">WBC</option>
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Status</option>
              <option value="pass">Pass</option>
              <option value="warning">Warning</option>
              <option value="fail">Fail</option>
            </select>
          </div>
        </div>
      </div>

      {/* QC Results List */}
      <div className="p-4 space-y-3">
        <h2 className="font-medium text-gray-900 mb-2">Today's QC Results</h2>
        
        {filteredResults.map((result) => {
          const zScore = calculateZScore(result.result, result.target, result.sd);
          
          return (
            <div
              key={result.id}
              onClick={() => navigate(`/lab-staff/qc/${result.id}`)}
              className="bg-white rounded-lg shadow-sm p-4 cursor-pointer hover:shadow-md transition-shadow"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-start space-x-3">
                  {getStatusIcon(result.status)}
                  <div>
                    <h3 className="font-medium text-gray-900">{result.testName}</h3>
                    <p className="text-sm text-gray-600">{result.controlName} - {result.level}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                  {result.status.toUpperCase()}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Result</p>
                  <p className="font-semibold">{result.result}</p>
                </div>
                <div>
                  <p className="text-gray-500">Target</p>
                  <p className="font-semibold">{result.target}</p>
                </div>
                <div>
                  <p className="text-gray-500">Z-Score</p>
                  <p className="font-semibold">{zScore}σ</p>
                </div>
              </div>

              <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
                <span>{format(result.runTime, 'h:mm a')}</span>
                <span>{result.instrument}</span>
              </div>
            </div>
          );
        })}

        {filteredResults.length === 0 && (
          <div className="bg-white rounded-lg p-8 text-center">
            <ClipboardCheck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No QC results found</p>
            <p className="text-sm text-gray-400 mt-1">Run quality control to see results</p>
          </div>
        )}

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3 mt-6">
          <button
            onClick={() => navigate('/lab-staff/qc/charts')}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-gray-50"
          >
            <BarChart3 className="h-8 w-8 text-indigo-600" />
            <span className="text-sm font-medium text-gray-900">Levey-Jennings</span>
          </button>
          <button
            onClick={() => navigate('/lab-staff/qc/history')}
            className="bg-white p-4 rounded-lg shadow-sm flex flex-col items-center space-y-2 hover:bg-gray-50"
          >
            <Calendar className="h-8 w-8 text-purple-600" />
            <span className="text-sm font-medium text-gray-900">QC History</span>
          </button>
        </div>
      </div>
    </div>
  );
};