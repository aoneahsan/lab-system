import React, { useState } from 'react';
import { FileText, Play, Settings, TrendingUp } from 'lucide-react';
import ReportTemplates from '@/components/reports/ReportTemplates';
import ReportGeneration from '@/components/reports/ReportGeneration';
import ScheduledReports from '@/components/reports/ScheduledReports';
import ReportAnalytics from '@/components/reports/ReportAnalytics';

const tabs = [
  { id: 'generate', label: 'Generate Reports', icon: Play },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'scheduled', label: 'Scheduled Reports', icon: Settings },
  { id: 'analytics', label: 'Analytics', icon: TrendingUp },
];

export default function ReportDashboard() {
  const [activeTab, setActiveTab] = useState('generate');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Reporting</h1>
        <p className="text-gray-600 mt-1">Generate and manage laboratory reports</p>
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
          {activeTab === 'generate' && <ReportGeneration />}

          {activeTab === 'templates' && <ReportTemplates />}

          {activeTab === 'scheduled' && <ScheduledReports />}

          {activeTab === 'analytics' && <ReportAnalytics />}
        </div>
      </div>
    </div>
  );
}
