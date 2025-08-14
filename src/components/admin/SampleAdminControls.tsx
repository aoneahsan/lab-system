import { useState } from 'react';
import { TestTube, Upload, Download, BarChart3, AlertTriangle, Activity } from 'lucide-react';
import { useSamples } from '@/hooks/useSamples';
import { toast } from '@/stores/toast.store';
import { SelectField } from '@/components/form-fields';

export default function SampleAdminControls() {
  const [timeRange, setTimeRange] = useState('7d');
  const { data: samples = [] } = useSamples();

  const stats = {
    totalSamples: samples.length,
    processedToday: 145, // Mock data
    pendingProcessing: 23, // Mock data
    avgTurnaroundTime: '2.5 hrs', // Mock data
  };

  const handleExportData = () => {
    toast.info('Export started', 'Sample data export has been initiated');
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Samples</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalSamples}</p>
            </div>
            <TestTube className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Processed Today</p>
              <p className="text-2xl font-bold text-green-600">{stats.processedToday}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingProcessing}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Avg TAT</p>
              <p className="text-2xl font-bold text-purple-600">{stats.avgTurnaroundTime}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Sample Management</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Upload className="h-4 w-4" />
            Import Samples
          </button>
          
          <button 
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <BarChart3 className="h-4 w-4" />
            TAT Report
          </button>
        </div>
      </div>

      {/* Turnaround Time Analysis */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Turnaround Time Analysis</h3>
          <div className="w-48">
            <SelectField
              value={timeRange}
              onValueChange={setTimeRange}
              options={[
                { value: '24h', label: 'Last 24 Hours' },
                { value: '7d', label: 'Last 7 Days' },
                { value: '30d', label: 'Last 30 Days' }
              ]}
              placeholder="Select time range"
              className="text-sm"
            />
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Within Target</p>
            <p className="text-xl font-bold text-green-600">85%</p>
            <p className="text-xs text-gray-500 mt-1">Meeting SLA</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">Delayed</p>
            <p className="text-xl font-bold text-red-600">12%</p>
            <p className="text-xs text-gray-500 mt-1">Exceeding SLA</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-600">In Progress</p>
            <p className="text-xl font-bold text-blue-600">3%</p>
            <p className="text-xs text-gray-500 mt-1">Currently processing</p>
          </div>
        </div>
      </div>
    </div>
  );
}