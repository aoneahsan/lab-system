import React, { useState } from 'react';
import {
  FileText,
  Download,
  Share2,
  Filter,
  Calendar,
  Search,
  TrendingUp,
  TrendingDown,
  Minus,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { useOfflinePatients } from '@/hooks/useOfflinePatients';
import { useAuthStore } from '@/stores/auth.store';
import { resultService } from '@/services/result.service';
import { toast } from '@/stores/toast.store';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { Share } from '@capacitor/share';

interface TestResult {
  id: string;
  testName: string;
  testCode: string;
  orderDate: Date;
  resultDate: Date;
  status: 'ready' | 'processing' | 'pending';
  doctorName: string;
  labLocation: string;
  criticalValues?: boolean;
  parameters: Array<{
    name: string;
    value: string;
    unit: string;
    referenceRange: string;
    flag?: 'H' | 'L' | 'HH' | 'LL';
  }>;
}

export const ResultsScreen: React.FC = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [activeFilter, setActiveFilter] = useState<'all' | 'recent' | 'pending'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Mock data - replace with actual API call
  const results: TestResult[] = [
    {
      id: '1',
      testName: 'Complete Blood Count',
      testCode: 'CBC',
      orderDate: new Date('2024-10-20'),
      resultDate: new Date('2024-10-25'),
      status: 'ready',
      doctorName: 'Dr. Smith',
      labLocation: 'Main Lab',
      criticalValues: false,
      parameters: [
        { name: 'Hemoglobin', value: '14.5', unit: 'g/dL', referenceRange: '13.5-17.5' },
        { name: 'WBC', value: '7.2', unit: 'K/µL', referenceRange: '4.5-11.0' },
        { name: 'Platelets', value: '250', unit: 'K/µL', referenceRange: '150-400' },
      ],
    },
    {
      id: '2',
      testName: 'Lipid Panel',
      testCode: 'LIPID',
      orderDate: new Date('2024-10-18'),
      resultDate: new Date('2024-10-23'),
      status: 'ready',
      doctorName: 'Dr. Johnson',
      labLocation: 'Downtown Lab',
      criticalValues: true,
      parameters: [
        {
          name: 'Total Cholesterol',
          value: '240',
          unit: 'mg/dL',
          referenceRange: '<200',
          flag: 'H',
        },
        { name: 'LDL', value: '160', unit: 'mg/dL', referenceRange: '<100', flag: 'H' },
        { name: 'HDL', value: '45', unit: 'mg/dL', referenceRange: '>40' },
        { name: 'Triglycerides', value: '180', unit: 'mg/dL', referenceRange: '<150', flag: 'H' },
      ],
    },
    {
      id: '3',
      testName: 'Thyroid Function Test',
      testCode: 'TFT',
      orderDate: new Date('2024-10-25'),
      resultDate: new Date('2024-10-25'),
      status: 'processing',
      doctorName: 'Dr. Smith',
      labLocation: 'Main Lab',
      parameters: [],
    },
  ];

  const filteredResults = results.filter((result) => {
    if (activeFilter === 'recent' && result.status !== 'ready') return false;
    if (activeFilter === 'pending' && result.status !== 'processing') return false;

    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        result.testName.toLowerCase().includes(search) ||
        result.testCode.toLowerCase().includes(search) ||
        result.doctorName.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const getFlagIcon = (flag?: string) => {
    if (!flag) return null;

    switch (flag) {
      case 'H':
      case 'HH':
        return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'L':
      case 'LL':
        return <TrendingDown className="h-4 w-4 text-blue-500" />;
      default:
        return <Minus className="h-4 w-4 text-gray-400" />;
    }
  };

  const handleDownloadResult = async (resultId: string) => {
    try {
      // For now, just show a message as PDF generation is not implemented
      toast.success('PDF download feature coming soon');
    } catch (error) {
      console.error('Error downloading result:', error);
      toast.error('Download failed', 'Unable to download the result PDF');
    }
  };

  const handleShareResult = async (resultId: string) => {
    try {
      const result = results.find(r => r.id === resultId);
      if (!result) return;
      
      // For now, just show a message as PDF generation is not implemented
      toast.success('Share feature coming soon');
    } catch (error) {
      console.error('Error sharing result:', error);
      toast.error('Share failed', 'Unable to share the result');
    }
  };

  return (
    <div className="flex-1 bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="p-4">
          <h1 className="text-xl font-semibold text-gray-900">Test Results</h1>

          {/* Search Bar */}
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search tests, doctors..."
              className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2"
            >
              <Filter className="h-5 w-5 text-gray-400" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-4 pb-3">
          <div className="flex space-x-2 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeFilter === 'all' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              All Results
            </button>
            <button
              onClick={() => setActiveFilter('recent')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeFilter === 'recent' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Recent
            </button>
            <button
              onClick={() => setActiveFilter('pending')}
              className={`flex-1 py-2 px-3 rounded text-sm font-medium transition-colors ${
                activeFilter === 'pending' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
              }`}
            >
              Processing
            </button>
          </div>
        </div>
      </div>

      {/* Results List */}
      <div className="p-4 space-y-3">
        {filteredResults.length > 0 ? (
          filteredResults.map((result) => (
            <div key={result.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div
                onClick={() => navigate(`/patient/results/${result.id}`)}
                className="p-4 cursor-pointer"
              >
                <div className="flex justify-between items-start mb-2">
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                      {result.testName}
                      {result.criticalValues && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full">
                          Critical
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-500">Code: {result.testCode}</p>
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      result.status === 'ready'
                        ? 'text-green-600'
                        : result.status === 'processing'
                          ? 'text-yellow-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {result.status === 'ready'
                      ? 'Ready'
                      : result.status === 'processing'
                        ? 'Processing'
                        : 'Pending'}
                  </span>
                </div>

                <div className="text-sm text-gray-600 space-y-1">
                  <p>Ordered by {result.doctorName}</p>
                  <p className="flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {format(result.resultDate, 'MMM dd, yyyy')}
                  </p>
                  <p>{result.labLocation}</p>
                </div>

                {/* Preview of parameters if ready */}
                {result.status === 'ready' && result.parameters.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <div className="space-y-1">
                      {result.parameters.slice(0, 2).map((param, index) => (
                        <div key={index} className="flex items-center justify-between text-sm">
                          <span className="text-gray-600">{param.name}</span>
                          <div className="flex items-center gap-1">
                            <span className="font-medium">
                              {param.value} {param.unit}
                            </span>
                            {getFlagIcon(param.flag)}
                          </div>
                        </div>
                      ))}
                      {result.parameters.length > 2 && (
                        <p className="text-xs text-gray-500 text-center pt-1">
                          +{result.parameters.length - 2} more parameters
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              {result.status === 'ready' && (
                <div className="px-4 py-3 bg-gray-50 border-t border-gray-100 flex justify-between">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownloadResult(result.id);
                    }}
                    className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900"
                  >
                    <Download className="h-4 w-4" />
                    Download PDF
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleShareResult(result.id);
                    }}
                    className="flex items-center gap-2 text-sm text-indigo-600 hover:text-indigo-700"
                  >
                    <Share2 className="h-4 w-4" />
                    Share
                  </button>
                </div>
              )}
            </div>
          ))
        ) : (
          <div className="bg-white rounded-lg p-8 text-center">
            <FileText className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 font-medium">No results found</p>
            <p className="text-sm text-gray-400 mt-1">
              {searchTerm
                ? 'Try adjusting your search terms'
                : 'Your test results will appear here'}
            </p>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <button
        onClick={() => navigate('/patient/appointments/new')}
        className="fixed bottom-20 right-4 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 transition-colors"
      >
        <Calendar className="h-6 w-6" />
      </button>
    </div>
  );
};
