import { useState } from 'react';
import { Users, Upload, Download, Trash2, Shield, Activity, AlertTriangle } from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { toast } from '@/stores/toast.store';

export default function PatientAdminControls() {
  const [selectedPatients, setSelectedPatients] = useState<string[]>([]);
  // const [showMergeDialog, setShowMergeDialog] = useState(false);
  
  const { data: patients = [] } = usePatients();

  const stats = {
    totalPatients: patients.length,
    activePatients: patients.filter(p => p.isActive).length,
    duplicateSuspects: 12, // Mock data - would be calculated
    dataQualityScore: 92, // Mock data - would be calculated
  };

  const handleBulkDelete = async () => {
    if (selectedPatients.length === 0) {
      toast.error('No patients selected', 'Please select patients to delete');
      return;
    }
    
    if (!confirm(`Are you sure you want to delete ${selectedPatients.length} patients? This action cannot be undone.`)) {
      return;
    }

    // Implementation would go here
    toast.success('Patients deleted', `${selectedPatients.length} patients have been deleted`);
    setSelectedPatients([]);
  };

  const handleExportData = () => {
    // Implementation for exporting patient data
    toast.info('Export started', 'Patient data export has been initiated');
  };

  const handleImportData = () => {
    // Implementation for importing patient data
    document.getElementById('import-file-input')?.click();
  };

  const handleMergePatients = () => {
    if (selectedPatients.length < 2) {
      toast.error('Select patients', 'Please select at least 2 patients to merge');
      return;
    }
    // setShowMergeDialog(true);
    toast.info('Merge feature', 'Patient merge dialog would open here');
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Total Patients</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPatients}</p>
            </div>
            <Users className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Patients</p>
              <p className="text-2xl font-bold text-green-600">{stats.activePatients}</p>
            </div>
            <Activity className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Duplicate Suspects</p>
              <p className="text-2xl font-bold text-yellow-600">{stats.duplicateSuspects}</p>
            </div>
            <AlertTriangle className="h-8 w-8 text-yellow-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-4 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Data Quality</p>
              <p className="text-2xl font-bold text-purple-600">{stats.dataQualityScore}%</p>
            </div>
            <Shield className="h-8 w-8 text-purple-500" />
          </div>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Administration</h3>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button
            onClick={handleImportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <Upload className="h-4 w-4" />
            Import Patients
          </button>
          
          <button
            onClick={handleExportData}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          
          <button
            onClick={handleMergePatients}
            disabled={selectedPatients.length < 2}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Users className="h-4 w-4" />
            Merge Duplicates
          </button>
          
          <button
            onClick={handleBulkDelete}
            disabled={selectedPatients.length === 0}
            className="flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Trash2 className="h-4 w-4" />
            Bulk Delete
          </button>
        </div>

        <input
          id="import-file-input"
          type="file"
          accept=".csv,.xlsx"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              // Handle file import
              toast.info('Importing', `Importing patients from ${file.name}`);
            }
          }}
        />
      </div>

      {/* Data Quality Issues */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Data Quality Issues</h3>
        
        <div className="space-y-3">
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Missing Phone Numbers</p>
                <p className="text-sm text-gray-600">234 patients without contact numbers</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">
              Fix Now
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <div>
                <p className="font-medium text-gray-900">Incomplete Addresses</p>
                <p className="text-sm text-gray-600">156 patients with partial addresses</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">
              Fix Now
            </button>
          </div>
          
          <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <div>
                <p className="font-medium text-gray-900">Potential Duplicates</p>
                <p className="text-sm text-gray-600">12 patients with similar names and DOB</p>
              </div>
            </div>
            <button className="text-sm text-blue-600 hover:underline">
              Review
            </button>
          </div>
        </div>
      </div>

      {/* Audit Log */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Patient Data Changes</h3>
        
        <div className="space-y-2">
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">Patient #12345 updated</p>
              <p className="text-xs text-gray-500">Address changed by admin@lab.com</p>
            </div>
            <span className="text-xs text-gray-500">2 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2 border-b">
            <div>
              <p className="text-sm font-medium text-gray-900">Bulk import completed</p>
              <p className="text-xs text-gray-500">150 patients imported by super@admin.com</p>
            </div>
            <span className="text-xs text-gray-500">5 hours ago</span>
          </div>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="text-sm font-medium text-gray-900">2 patients merged</p>
              <p className="text-xs text-gray-500">Duplicate records merged by admin@lab.com</p>
            </div>
            <span className="text-xs text-gray-500">1 day ago</span>
          </div>
        </div>
      </div>
    </div>
  );
}