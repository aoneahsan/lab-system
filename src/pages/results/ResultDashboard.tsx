import React, { useState } from 'react';
import { FileText, CheckCircle, Shield, BarChart } from 'lucide-react';
import ResultEntry from '@/components/results/ResultEntry';
import ResultReview from '@/components/results/ResultReview';
import ResultValidationRules from '@/components/results/ResultValidationRules';

const tabs = [
  { id: 'entry', label: 'Result Entry', icon: FileText },
  { id: 'review', label: 'Review & Verify', icon: CheckCircle },
  { id: 'validation', label: 'Validation Rules', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
];

export default function ResultDashboard() {
  const [activeTab, setActiveTab] = useState('entry');

  // Mock data for result entry
  const mockTests = [
    { id: 'glu', name: 'Glucose', unit: 'mg/dL', referenceRange: { min: 70, max: 100 } },
    { id: 'hgb', name: 'Hemoglobin', unit: 'g/dL', referenceRange: { min: 12, max: 16 } },
    { id: 'wbc', name: 'WBC', unit: 'K/uL', referenceRange: { min: 4.5, max: 11 } },
    { id: 'plt', name: 'Platelets', unit: 'K/uL', referenceRange: { min: 150, max: 400 } },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Result Management</h1>
        <p className="text-gray-600 mt-1">Enter, review, and verify test results</p>
      </div>

      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center px-6 py-3 text-sm font-medium border-b-2 transition-colors ${
                    activeTab === tab.id
                      ? 'text-indigo-600 border-indigo-600'
                      : 'text-gray-500 border-transparent hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-4 w-4 mr-2" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'entry' && (
            <div className="space-y-6">
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <p className="text-sm text-yellow-800">
                  Select an order from the Orders module to enter results. This is a demo showing
                  the result entry interface.
                </p>
              </div>
              <ResultEntry orderId="ORD-2024-001" sampleId="SMP-2024-001" tests={mockTests} />
            </div>
          )}

          {activeTab === 'review' && <ResultReview />}

          {activeTab === 'validation' && <ResultValidationRules />}

          {activeTab === 'analytics' && (
            <div className="text-center py-12 text-gray-500">
              <BarChart className="h-12 w-12 mx-auto mb-4" />
              <p>Result analytics coming soon</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
