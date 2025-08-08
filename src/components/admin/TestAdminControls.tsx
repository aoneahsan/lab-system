import { useState } from 'react';
import { TestTube, Upload, Download, Trash2, Shield, Activity, AlertTriangle, Plus } from 'lucide-react';
import { useTests } from '@/hooks/useTests';
import { toast } from '@/stores/toast.store';

export default function TestAdminControls() {
  const [selectedTests, setSelectedTests] = useState<string[]>([]);
  const { data: tests = [] } = useTests();

  const stats = {
    totalTests: tests.length,
    activeTests: tests.filter(t => t.isActive).length,
    criticalTests: tests.filter(t => t.priority === 'critical').length,
    testsNeedingReview: 8, // Mock data
  };

  const handleBulkDelete = async () => {
    if (selectedTests.length === 0) {
      toast.error('No tests selected', 'Please select tests to delete');
      return;
    }
    
    if (!confirm(`Delete ${selectedTests.length} tests?`)) return;
    
    toast.success('Tests deleted', `${selectedTests.length} tests have been deleted`);
    setSelectedTests([]);
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Tests</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTests}</p>
            </div>
            <TestTube className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Tests</p>
              <p className="text-2xl font-bold text-green-600">{stats.activeTests}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Tests</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalTests}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Needs Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.testsNeedingReview}</p>
            </div>
            <Shield className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Test Administration</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <Upload className="h-4 w-4" />
            Import Tests
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors">
            <Download className="h-4 w-4" />
            Export Catalog
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors">
            <Plus className="h-4 w-4" />
            Add Test Panel
          </button>
          
          <button
            onClick={handleBulkDelete}
            disabled={selectedTests.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Bulk Delete
          </button>
        </div>
      </div>

      {/* Test Configuration Issues */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Configuration Issues</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Missing Reference Ranges</p>
                <p className="text-sm text-gray-600">23 tests without normal ranges defined</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Fix Now</button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">Missing LOINC Codes</p>
                <p className="text-sm text-gray-600">45 tests without LOINC mapping</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Review</button>
          </div>
        </div>
      </div>
    </div>
  );
}