import { DollarSign, TrendingUp, AlertCircle, Download, CreditCard, FileText } from 'lucide-react';
import { toast } from '@/stores/toast.store';

export default function BillingAdminControls() {

  const stats = {
    totalRevenue: '$125,450.00',
    pendingClaims: 45,
    overdueAccounts: 12,
    collectionRate: '94.5%',
  };

  const handleExportFinancial = () => {
    toast.info('Export started', 'Financial report export initiated');
  };

  const handleRunReconciliation = () => {
    toast.info('Reconciliation started', 'Running payment reconciliation');
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalRevenue}</p>
            </div>
            <DollarSign className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Pending Claims</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.pendingClaims}</p>
            </div>
            <FileText className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Overdue</p>
              <p className="text-2xl font-bold text-red-600">{stats.overdueAccounts}</p>
            </div>
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Collection Rate</p>
              <p className="text-2xl font-bold text-purple-600">{stats.collectionRate}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Billing Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Billing Administration</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={handleExportFinancial}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Financial
          </button>
          
          <button 
            onClick={handleRunReconciliation}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors"
          >
            <CreditCard className="h-4 w-4" />
            Reconcile
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors">
            <FileText className="h-4 w-4" />
            Claims Report
          </button>
          
          <button className="flex items-center justify-center gap-2 px-4 py-2 bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
            <TrendingUp className="h-4 w-4" />
            Revenue Analysis
          </button>
        </div>
      </div>

      {/* Overdue Accounts */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Overdue Accounts Requiring Action</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Insurance Co. ABC - Claim #12345</p>
              <p className="text-sm text-red-600">90+ days overdue • $3,450.00</p>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Follow Up</button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Patient John Doe - Invoice #67890</p>
              <p className="text-sm text-orange-600">60 days overdue • $890.00</p>
            </div>
            <button className="text-sm text-blue-600 hover:underline">Send Reminder</button>
          </div>
        </div>
      </div>
    </div>
  );
}