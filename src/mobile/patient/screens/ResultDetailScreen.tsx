import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Share2 } from 'lucide-react';
import { format } from 'date-fns';

export const ResultDetailScreen: React.FC = () => {
  const { id: _id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Mock data - replace with actual API call
  const result = {
    id: '1',
    testName: 'Complete Blood Count',
    testCode: 'CBC',
    orderDate: new Date('2024-10-20'),
    resultDate: new Date('2024-10-25'),
    status: 'ready',
    doctorName: 'Dr. Smith',
    labLocation: 'Main Lab',
    parameters: [
      { name: 'Hemoglobin', value: '14.5', unit: 'g/dL', referenceRange: '13.5-17.5' },
      { name: 'WBC', value: '7.2', unit: 'K/µL', referenceRange: '4.5-11.0' },
      { name: 'Platelets', value: '250', unit: 'K/µL', referenceRange: '150-400' },
    ],
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4 flex items-center space-x-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-xl font-semibold text-gray-900">Test Result</h1>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Test Info */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-semibold text-lg text-gray-900">{result.testName}</h2>
          <p className="text-sm text-gray-500">Code: {result.testCode}</p>
          <div className="mt-3 space-y-2 text-sm">
            <p><span className="text-gray-500">Ordered by:</span> {result.doctorName}</p>
            <p><span className="text-gray-500">Date:</span> {format(result.resultDate, 'MMM dd, yyyy')}</p>
            <p><span className="text-gray-500">Location:</span> {result.labLocation}</p>
          </div>
        </div>

        {/* Parameters */}
        <div className="bg-white rounded-lg shadow-sm p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Test Parameters</h3>
          <div className="space-y-3">
            {result.parameters.map((param, index) => (
              <div key={index} className="border-b border-gray-100 pb-3 last:border-0">
                <div className="flex justify-between items-start">
                  <span className="text-gray-700">{param.name}</span>
                  <div className="text-right">
                    <div className="font-semibold">
                      {param.value} {param.unit}
                    </div>
                    <div className="text-xs text-gray-500">
                      Ref: {param.referenceRange}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-3">
          <button className="flex-1 btn btn-primary flex items-center justify-center">
            <Download className="h-4 w-4 mr-2" />
            Download PDF
          </button>
          <button className="flex-1 btn btn-outline flex items-center justify-center">
            <Share2 className="h-4 w-4 mr-2" />
            Share
          </button>
        </div>
      </div>
    </div>
  );
};