import { FileText, CheckCircle, AlertCircle, Clock, Download, Shield } from 'lucide-react';
import { useResults } from '@/hooks/useResults';
import { toast } from '@/stores/toast.store';

export default function ResultAdminControls() {
  const { data } = useResults();
  const results = data?.items || [];

  const stats = {
    totalResults: results.length,
    validated: results.filter(r => r.status === 'verified').length,
    pendingReview: results.filter(r => r.status === 'pending_review').length,
    criticalResults: 7, // Mock data
  };

  const handleExportResults = () => {
    toast.info('Export started', 'Results export has been initiated');
  };

  const handleRunAudit = () => {
    toast.info('Audit started', 'Result validation audit in progress');
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Results</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalResults}</p>
            </div>
            <FileText className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Validated</p>
              <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Review</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingReview}</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Critical Results</p>
              <p className="text-2xl font-bold text-red-600">{stats.criticalResults}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Result Management</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <button 
            onClick={handleExportResults}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Results
          </button>
          
          <button 
            onClick={handleRunAudit}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <Shield className="h-4 w-4" />
            Run Audit
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <FileText className="h-4 w-4" />
            Validation Report
          </button>
        </div>
      </div>

      {/* Critical Results Alert */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h3 className="text-lg font-medium text-red-900 mb-3">Critical Results Requiring Attention</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Patient #12345 - Glucose Level</p>
              <p className="text-sm text-red-600">Critical High: 450 mg/dL</p>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Review</button>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-medium text-gray-900">Patient #67890 - Potassium</p>
              <p className="text-sm text-red-600">Critical Low: 2.8 mEq/L</p>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Review</button>
          </div>
        </div>
      </div>
    </div>
  );
}