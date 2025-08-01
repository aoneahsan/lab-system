import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Activity,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
  TrendingDown,
  Filter,
  Search,
  FileText,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';

interface Result {
  id: string;
  patientName: string;
  patientMrn: string;
  testName: string;
  orderDate: string;
  resultDate: string;
  status: 'critical' | 'abnormal' | 'normal' | 'pending';
  reviewed: boolean;
  values: Array<{
    parameter: string;
    value: string;
    unit: string;
    reference: string;
    flag?: 'H' | 'L' | 'C';
  }>;
}

export const ResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState<'all' | 'critical' | 'unreviewed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const results: Result[] = [
    {
      id: 'RES001',
      patientName: 'John Doe',
      patientMrn: 'MRN123456',
      testName: 'Complete Blood Count',
      orderDate: '2024-10-26T10:00:00',
      resultDate: '2024-10-27T14:30:00',
      status: 'critical',
      reviewed: false,
      values: [
        { parameter: 'Hemoglobin', value: '7.2', unit: 'g/dL', reference: '13.5-17.5', flag: 'C' },
        { parameter: 'WBC', value: '15.8', unit: 'K/μL', reference: '4.5-11.0', flag: 'H' },
        { parameter: 'Platelets', value: '450', unit: 'K/μL', reference: '150-400', flag: 'H' },
      ],
    },
    {
      id: 'RES002',
      patientName: 'Jane Smith',
      patientMrn: 'MRN123457',
      testName: 'Lipid Panel',
      orderDate: '2024-10-25T09:00:00',
      resultDate: '2024-10-26T11:00:00',
      status: 'abnormal',
      reviewed: true,
      values: [
        { parameter: 'Total Cholesterol', value: '280', unit: 'mg/dL', reference: '<200', flag: 'H' },
        { parameter: 'LDL', value: '180', unit: 'mg/dL', reference: '<100', flag: 'H' },
        { parameter: 'HDL', value: '35', unit: 'mg/dL', reference: '>40', flag: 'L' },
      ],
    },
    {
      id: 'RES003',
      patientName: 'Bob Johnson',
      patientMrn: 'MRN123458',
      testName: 'Basic Metabolic Panel',
      orderDate: '2024-10-26T08:00:00',
      resultDate: '2024-10-27T10:00:00',
      status: 'normal',
      reviewed: true,
      values: [
        { parameter: 'Glucose', value: '95', unit: 'mg/dL', reference: '70-100' },
        { parameter: 'Creatinine', value: '0.9', unit: 'mg/dL', reference: '0.6-1.2' },
        { parameter: 'Sodium', value: '140', unit: 'mEq/L', reference: '136-145' },
      ],
    },
  ];

  const filteredResults = results.filter(result => {
    const matchesSearch = 
      result.patientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.patientMrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      result.testName.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesFilter = 
      filterStatus === 'all' ||
      (filterStatus === 'critical' && result.status === 'critical') ||
      (filterStatus === 'unreviewed' && !result.reviewed);

    return matchesSearch && matchesFilter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'critical':
        return 'bg-red-100 text-red-700 border-red-200';
      case 'abnormal':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200';
      case 'normal':
        return 'bg-green-100 text-green-700 border-green-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getFlagIcon = (flag?: string) => {
    switch (flag) {
      case 'H':
        return <TrendingUp className="h-4 w-4 text-orange-600" />;
      case 'L':
        return <TrendingDown className="h-4 w-4 text-blue-600" />;
      case 'C':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Lab Results</h1>
          <p className="text-sm text-gray-500 mt-1">
            Review and manage patient test results
          </p>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search patient or test..."
              className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {/* Filter Options */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'all' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setFilterStatus('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'critical' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Critical Only
            </button>
            <button
              onClick={() => setFilterStatus('unreviewed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterStatus === 'unreviewed' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Unreviewed
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="p-4 space-y-3">
        {filteredResults.map((result) => (
          <div
            key={result.id}
            className="bg-white rounded-lg shadow-sm overflow-hidden"
            onClick={() => navigate(`/clinician/result/${result.id}`)}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{result.patientName}</h3>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full border ${getStatusColor(result.status)}`}>
                      {result.status.toUpperCase()}
                    </span>
                    {!result.reviewed && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-indigo-100 text-indigo-700">
                        Unreviewed
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">{result.patientMrn} • {result.testName}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Result: {format(new Date(result.resultDate), 'MMM dd, h:mm a')}
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400" />
              </div>

              {/* Key Results Preview */}
              <div className="space-y-2">
                {result.values.slice(0, 2).map((value, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{value.parameter}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${value.flag ? 'text-red-600' : 'text-gray-900'}`}>
                        {value.value} {value.unit}
                      </span>
                      {getFlagIcon(value.flag)}
                    </div>
                  </div>
                ))}
                {result.values.length > 2 && (
                  <p className="text-xs text-gray-500">+{result.values.length - 2} more parameters</p>
                )}
              </div>

              {/* Action Buttons */}
              {!result.reviewed && result.status === 'critical' && (
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle mark as reviewed
                    }}
                    className="flex-1 btn btn-primary btn-sm"
                  >
                    Mark as Reviewed
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      // Handle contact patient
                    }}
                    className="flex-1 btn btn-outline btn-sm"
                  >
                    Contact Patient
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="p-8 text-center">
          <Activity className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No results found</p>
          <p className="text-sm text-gray-400 mt-1">
            Try adjusting your search or filters
          </p>
        </div>
      )}
    </div>
  );
};