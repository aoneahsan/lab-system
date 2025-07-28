import React, { useState } from 'react';
import {
  ArrowLeft,
  Download,
  Share2,
  TrendingUp,
  TrendingDown,
  Info,
  Calendar,
  User,
  MapPin,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

interface TestParameter {
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'H' | 'L' | 'HH' | 'LL';
  previousValue?: string;
  trend?: number[];
  interpretation?: string;
}

export const ResultDetailScreen: React.FC = () => {
  const navigate = useNavigate();
  const { resultId } = useParams();
  const [expandedParams, setExpandedParams] = useState<string[]>([]);
  const [showInterpretation, setShowInterpretation] = useState(false);

  // Mock data - replace with actual API call
  const result = {
    id: resultId,
    testName: 'Complete Blood Count',
    testCode: 'CBC',
    orderDate: new Date('2024-10-20'),
    resultDate: new Date('2024-10-25'),
    reportedDate: new Date('2024-10-25'),
    status: 'ready',
    doctorName: 'Dr. Smith',
    doctorSpecialty: 'Internal Medicine',
    labLocation: 'LabFlow Main Laboratory',
    labAddress: '123 Medical Center Dr, City, State 12345',
    specimenType: 'Blood',
    collectionTime: '8:30 AM',
    interpretation:
      'All parameters are within normal limits. No significant abnormalities detected.',
    parameters: [
      {
        name: 'Hemoglobin',
        value: '14.5',
        unit: 'g/dL',
        referenceRange: '13.5-17.5',
        previousValue: '14.2',
        trend: [13.8, 14.0, 14.2, 14.5],
        interpretation: 'Normal hemoglobin level indicates adequate oxygen-carrying capacity.',
      },
      {
        name: 'White Blood Cell Count',
        value: '7.2',
        unit: 'K/µL',
        referenceRange: '4.5-11.0',
        previousValue: '6.8',
        trend: [6.5, 6.8, 7.0, 7.2],
        interpretation: 'WBC count is within normal range, suggesting no active infection.',
      },
      {
        name: 'Platelets',
        value: '250',
        unit: 'K/µL',
        referenceRange: '150-400',
        previousValue: '245',
        trend: [240, 242, 245, 250],
        interpretation: 'Platelet count is normal, indicating normal blood clotting ability.',
      },
      {
        name: 'Red Blood Cell Count',
        value: '4.8',
        unit: 'M/µL',
        referenceRange: '4.5-5.9',
        previousValue: '4.7',
        trend: [4.6, 4.7, 4.7, 4.8],
      },
      {
        name: 'MCV',
        value: '89',
        unit: 'fL',
        referenceRange: '80-100',
        previousValue: '88',
        trend: [87, 88, 88, 89],
      },
      {
        name: 'MCH',
        value: '30',
        unit: 'pg',
        referenceRange: '27-33',
        previousValue: '30',
        trend: [29, 30, 30, 30],
      },
      {
        name: 'MCHC',
        value: '34',
        unit: 'g/dL',
        referenceRange: '32-36',
        previousValue: '34',
        trend: [33, 34, 34, 34],
      },
    ],
  };

  const toggleParamExpansion = (paramName: string) => {
    setExpandedParams((prev) =>
      prev.includes(paramName) ? prev.filter((p) => p !== paramName) : [...prev, paramName]
    );
  };

  const getFlagColor = (flag?: string) => {
    if (!flag) return 'text-green-600';
    if (flag === 'H' || flag === 'HH') return 'text-red-600';
    if (flag === 'L' || flag === 'LL') return 'text-blue-600';
    return 'text-gray-600';
  };

  const getFlagIcon = (flag?: string) => {
    if (!flag) return null;
    if (flag === 'H' || flag === 'HH') return <TrendingUp className="h-4 w-4 text-red-500" />;
    if (flag === 'L' || flag === 'LL') return <TrendingDown className="h-4 w-4 text-blue-500" />;
    return null;
  };

  const renderTrendChart = (param: TestParameter) => {
    if (!param.trend || param.trend.length < 2) return null;

    const data = {
      labels: param.trend.map((_, i) => `Test ${i + 1}`),
      datasets: [
        {
          label: param.name,
          data: param.trend,
          borderColor: 'rgb(99, 102, 241)',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
        },
      ],
    };

    const options = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false,
        },
      },
      scales: {
        y: {
          beginAtZero: false,
        },
      },
    };

    return (
      <div className="h-32 mt-3">
        <Line data={data} options={options} />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="flex items-center p-4">
          <button onClick={() => navigate(-1)} className="mr-4">
            <ArrowLeft className="h-6 w-6 text-gray-600" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-semibold text-gray-900">{result.testName}</h1>
            <p className="text-sm text-gray-500">Code: {result.testCode}</p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto pb-20">
        {/* Test Information */}
        <div className="bg-white p-4 space-y-3">
          <div className="flex items-center text-sm text-gray-600">
            <Calendar className="h-4 w-4 mr-2" />
            <span>Result Date: {format(result.resultDate, 'MMM dd, yyyy')}</span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <User className="h-4 w-4 mr-2" />
            <span>
              {result.doctorName} - {result.doctorSpecialty}
            </span>
          </div>
          <div className="flex items-center text-sm text-gray-600">
            <MapPin className="h-4 w-4 mr-2" />
            <span>{result.labLocation}</span>
          </div>
        </div>

        {/* Overall Interpretation */}
        <div className="bg-white mt-2 p-4">
          <button
            onClick={() => setShowInterpretation(!showInterpretation)}
            className="w-full flex items-center justify-between"
          >
            <h2 className="text-lg font-semibold text-gray-900">Overall Interpretation</h2>
            {showInterpretation ? (
              <ChevronUp className="h-5 w-5 text-gray-400" />
            ) : (
              <ChevronDown className="h-5 w-5 text-gray-400" />
            )}
          </button>
          {showInterpretation && (
            <p className="mt-3 text-gray-700 leading-relaxed">{result.interpretation}</p>
          )}
        </div>

        {/* Test Parameters */}
        <div className="bg-white mt-2">
          <div className="p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Test Results</h2>
          </div>

          <div className="divide-y divide-gray-200">
            {result.parameters.map((param) => (
              <div key={param.name} className="p-4">
                <div
                  onClick={() => toggleParamExpansion(param.name)}
                  className="flex items-center justify-between cursor-pointer"
                >
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{param.name}</p>
                    <p className="text-sm text-gray-500">
                      Range: {param.referenceRange} {param.unit}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`font-semibold ${getFlagColor(param.flag)}`}>
                      {param.value} {param.unit}
                    </span>
                    {param.flag && getFlagIcon(param.flag)}
                  </div>
                </div>

                {/* Expanded Details */}
                {expandedParams.includes(param.name) && (
                  <div className="mt-4 space-y-3">
                    {param.previousValue && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Previous Value:</span>
                        <span className="font-medium">
                          {param.previousValue} {param.unit}
                        </span>
                      </div>
                    )}

                    {param.trend && renderTrendChart(param)}

                    {param.interpretation && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <div className="flex items-start space-x-2">
                          <Info className="h-4 w-4 text-blue-600 mt-0.5" />
                          <p className="text-sm text-blue-800">{param.interpretation}</p>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Additional Information */}
        <div className="bg-white mt-2 p-4">
          <h3 className="font-semibold text-gray-900 mb-3">Additional Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Specimen Type:</span>
              <span className="font-medium">{result.specimenType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Collection Time:</span>
              <span className="font-medium">{result.collectionTime}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Reported Date:</span>
              <span className="font-medium">{format(result.reportedDate, 'MMM dd, yyyy')}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
        <div className="flex space-x-3">
          <button className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 rounded-lg font-medium flex items-center justify-center space-x-2">
            <Download className="h-5 w-5" />
            <span>Download PDF</span>
          </button>
          <button className="flex-1 py-3 px-4 bg-indigo-600 text-white rounded-lg font-medium flex items-center justify-center space-x-2">
            <Share2 className="h-5 w-5" />
            <span>Share Report</span>
          </button>
        </div>
      </div>
    </div>
  );
};
