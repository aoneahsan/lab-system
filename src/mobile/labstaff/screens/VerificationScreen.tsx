import React, { useState } from 'react';
import { 
  Barcode,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  FileText,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from '@/stores/toast.store';

interface ResultForVerification {
  id: string;
  sampleId: string;
  barcode: string;
  patientName: string;
  patientMrn: string;
  testName: string;
  enteredBy: string;
  enteredAt: string;
  priority: 'stat' | 'urgent' | 'routine';
  status: 'pending_verification' | 'verified' | 'rejected';
  criticalResults: boolean;
  results: Array<{
    parameter: string;
    value: string;
    unit: string;
    reference: string;
    flag?: 'H' | 'L' | 'C';
    previousValue?: string;
    delta?: string;
  }>;
  notes?: string;
}

export const VerificationScreen: React.FC = () => {
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'stat'>('all');
  const [selectedResult, setSelectedResult] = useState<string | null>(null);

  const resultsForVerification: ResultForVerification[] = [
    {
      id: 'VER001',
      sampleId: 'LAB001',
      barcode: 'B123456789',
      patientName: 'John Doe',
      patientMrn: 'MRN123456',
      testName: 'Complete Blood Count',
      enteredBy: 'Sarah J.',
      enteredAt: '2024-10-27T10:30:00',
      priority: 'stat',
      status: 'pending_verification',
      criticalResults: true,
      results: [
        { 
          parameter: 'Hemoglobin', 
          value: '7.2', 
          unit: 'g/dL', 
          reference: '13.5-17.5', 
          flag: 'C',
          previousValue: '8.5',
          delta: '-15.3%'
        },
        { 
          parameter: 'WBC', 
          value: '15.8', 
          unit: 'K/�L', 
          reference: '4.5-11.0', 
          flag: 'H',
          previousValue: '12.1',
          delta: '+30.6%'
        },
        { 
          parameter: 'Platelets', 
          value: '450', 
          unit: 'K/�L', 
          reference: '150-400', 
          flag: 'H' 
        },
      ],
      notes: 'Sample slightly hemolyzed',
    },
    {
      id: 'VER002',
      sampleId: 'LAB002',
      barcode: 'B123456790',
      patientName: 'Jane Smith',
      patientMrn: 'MRN123457',
      testName: 'Lipid Panel',
      enteredBy: 'Mike R.',
      enteredAt: '2024-10-27T10:15:00',
      priority: 'routine',
      status: 'pending_verification',
      criticalResults: false,
      results: [
        { 
          parameter: 'Total Cholesterol', 
          value: '195', 
          unit: 'mg/dL', 
          reference: '<200' 
        },
        { 
          parameter: 'LDL', 
          value: '120', 
          unit: 'mg/dL', 
          reference: '<100', 
          flag: 'H' 
        },
        { 
          parameter: 'HDL', 
          value: '45', 
          unit: 'mg/dL', 
          reference: '>40' 
        },
      ],
    },
  ];

  const filteredResults = resultsForVerification.filter(result => {
    if (filterType === 'critical') return result.criticalResults;
    if (filterType === 'stat') return result.priority === 'stat';
    return true;
  });

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

  const handleVerify = (_resultId: string) => {
    // Verification logic here
    toast.success('Result Verified', 'Result has been verified and released');
    setSelectedResult(null);
  };

  const handleReject = (_resultId: string) => {
    // Rejection logic here
    toast.error('Result Rejected', 'Result has been rejected and sent back for review');
    setSelectedResult(null);
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Result Verification</h1>
          <p className="text-sm text-gray-500 mt-1">
            {filteredResults.filter(r => r.status === 'pending_verification').length} results pending verification
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2">
            <button
              onClick={() => setFilterType('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'all' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setFilterType('critical')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'critical' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              Critical Only
            </button>
            <button
              onClick={() => setFilterType('stat')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filterType === 'stat' 
                  ? 'bg-indigo-100 text-indigo-700' 
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              STAT Only
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="p-4 space-y-3">
        {filteredResults.map((result) => (
          <div
            key={result.id}
            className={`bg-white rounded-lg shadow-sm overflow-hidden ${
              selectedResult === result.id ? 'ring-2 ring-indigo-500' : ''
            }`}
          >
            <div className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-medium text-gray-900">{result.testName}</h3>
                    {result.priority === 'stat' && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-700 border border-red-200">
                        STAT
                      </span>
                    )}
                    {result.criticalResults && (
                      <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-600 text-white">
                        Critical
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600">
                    {result.patientName} " {result.patientMrn}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    <span className="flex items-center gap-1">
                      <Barcode className="h-3 w-3" />
                      {result.barcode} " Entered by {result.enteredBy} at {format(new Date(result.enteredAt), 'h:mm a')}
                    </span>
                  </p>
                </div>
                <button
                  onClick={() => setSelectedResult(selectedResult === result.id ? null : result.id)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Eye className="h-5 w-5 text-gray-600" />
                </button>
              </div>

              {/* Results Preview */}
              <div className="space-y-2 mb-3">
                {result.results.map((res, index) => (
                  <div key={index} className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{res.parameter}</span>
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${res.flag ? 'text-red-600' : 'text-gray-900'}`}>
                        {res.value} {res.unit}
                      </span>
                      {getFlagIcon(res.flag)}
                      {res.delta && (
                        <span className={`text-xs ${res.delta.startsWith('+') ? 'text-red-600' : 'text-blue-600'}`}>
                          {res.delta}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {result.notes && (
                <div className="p-2 bg-yellow-50 rounded text-xs text-yellow-800 mb-3">
                  Note: {result.notes}
                </div>
              )}

              {/* Expanded Details */}
              {selectedResult === result.id && (
                <div className="border-t pt-3 mt-3">
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-gray-900 text-sm">Reference Ranges</h4>
                    {result.results.map((res, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">{res.parameter}</span>
                        <span className="text-gray-500">{res.reference} {res.unit}</span>
                      </div>
                    ))}
                  </div>

                  {/* Previous Results */}
                  <div className="space-y-2 mb-4">
                    <h4 className="font-medium text-gray-900 text-sm">Previous Results</h4>
                    {result.results.filter(r => r.previousValue).map((res, index) => (
                      <div key={index} className="flex items-center justify-between text-sm bg-gray-50 p-2 rounded">
                        <span className="text-gray-600">{res.parameter}</span>
                        <span className="text-gray-500">
                          {res.previousValue} � {res.value} {res.unit}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              {result.status === 'pending_verification' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleReject(result.id)}
                    className="flex-1 btn btn-outline btn-sm text-red-600 border-red-300 hover:bg-red-50"
                  >
                    <XCircle className="h-4 w-4 mr-1" />
                    Reject
                  </button>
                  <button
                    onClick={() => handleVerify(result.id)}
                    className="flex-1 btn btn-primary btn-sm"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    Verify & Release
                  </button>
                </div>
              )}

              {result.status === 'verified' && (
                <div className="flex items-center justify-center gap-2 mt-3 text-green-600">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Verified</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {filteredResults.length === 0 && (
        <div className="p-8 text-center">
          <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No results to verify</p>
          <p className="text-sm text-gray-400 mt-1">
            Results requiring verification will appear here
          </p>
        </div>
      )}
    </div>
  );
};