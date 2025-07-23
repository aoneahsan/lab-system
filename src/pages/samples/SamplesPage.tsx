import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, QrCode, FileText, BarChart3, Package } from 'lucide-react';
import {
  useSamples,
  useCreateSample,
  useUpdateSample,
  useDeleteSample,
  useSampleStatistics,
} from '@/hooks/useSamples';
import { usePatients } from '@/hooks/usePatients';
import { qrcodeService } from '@/services/qrcode.service';
import SampleListTable from '@/components/samples/SampleListTable';
import SampleSearchFilters from '@/components/samples/SampleSearchFilters';
import SampleCollectionForm from '@/components/samples/SampleCollectionForm';
import type { Sample, SampleFilter, SampleFormData, SampleLabel } from '@/types/sample.types';

const SamplesPage: React.FC = () => {
  const navigate = useNavigate();
  const [filters, setFilters] = useState<SampleFilter>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingSample, setEditingSample] = useState<Sample | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedSample, setSelectedSample] = useState<Sample | null>(null);
  const [qrCodeData, setQrCodeData] = useState<{ qrCode: string; barcode: string } | null>(null);

  const { data: samples = [], isLoading } = useSamples(filters);
  const { data: statistics } = useSampleStatistics();
  const { data: patients = [] } = usePatients();
  const createSampleMutation = useCreateSample();
  const updateSampleMutation = useUpdateSample();
  const deleteSampleMutation = useDeleteSample();

  const handleAddSample = async (data: SampleFormData) => {
    await createSampleMutation.mutateAsync(data);
    setShowAddForm(false);
  };

  const handleEditSample = async (data: SampleFormData) => {
    if (editingSample) {
      await updateSampleMutation.mutateAsync({
        sampleId: editingSample.id,
        data,
      });
      setEditingSample(null);
    }
  };

  const handleDeleteSample = async (sample: Sample) => {
    if (window.confirm(`Are you sure you want to delete sample ${sample.sampleNumber}?`)) {
      await deleteSampleMutation.mutateAsync(sample.id);
    }
  };

  const handleViewSample = (sample: Sample) => {
    navigate(`/samples/${sample.id}`);
  };

  const handleShowQR = async (sample: Sample) => {
    const patient = patients.find(p => p.id === sample.patientId);
    if (!patient) return;

    const sampleLabel: SampleLabel = {
      sampleId: sample.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientDOB: new Date(patient.dateOfBirth).toLocaleDateString(),
      medicalRecordNumber: patient.medicalRecordNumber,
      sampleNumber: sample.sampleNumber,
      barcode: sample.barcode,
      collectionDate: sample.collectionDate.toDate().toLocaleDateString(),
      collectionTime: sample.collectionTime,
      sampleType: sample.type,
      tests: sample.tests,
      priority: sample.priority,
      specialInstructions: sample.notes,
    };

    const { qrCode, barcode } = await qrcodeService.generateSampleLabel(sampleLabel);
    setQrCodeData({ qrCode, barcode });
    setSelectedSample(sample);
    setShowQRModal(true);
  };

  const handlePrintLabel = async (sample: Sample) => {
    const patient = patients.find(p => p.id === sample.patientId);
    if (!patient) return;

    const sampleLabel: SampleLabel = {
      sampleId: sample.id,
      patientName: `${patient.firstName} ${patient.lastName}`,
      patientDOB: new Date(patient.dateOfBirth).toLocaleDateString(),
      medicalRecordNumber: patient.medicalRecordNumber,
      sampleNumber: sample.sampleNumber,
      barcode: sample.barcode,
      collectionDate: sample.collectionDate.toDate().toLocaleDateString(),
      collectionTime: sample.collectionTime,
      sampleType: sample.type,
      tests: sample.tests,
      priority: sample.priority,
      specialInstructions: sample.notes,
    };

    const { labelHtml } = await qrcodeService.generateSampleLabel(sampleLabel);
    qrcodeService.printLabel(labelHtml);
  };

  const getStatusColor = (status: string, count: number) => {
    if (count === 0) return 'text-gray-400';
    const colors: Record<string, string> = {
      collected: 'text-blue-600',
      processing: 'text-purple-600',
      completed: 'text-green-600',
      rejected: 'text-red-600',
    };
    return colors[status] || 'text-gray-600';
  };

  if (showAddForm || editingSample) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {editingSample ? 'Edit Sample' : 'Collect Sample'}
          </h1>
          <p className="text-gray-600 mt-2">
            {editingSample ? 'Update sample information' : 'Register a new sample collection'}
          </p>
        </div>

        <SampleCollectionForm
          orderId={editingSample?.orderId}
          onSubmit={editingSample ? handleEditSample : handleAddSample}
          onCancel={() => {
            setShowAddForm(false);
            setEditingSample(null);
          }}
          isLoading={createSampleMutation.isPending || updateSampleMutation.isPending}
        />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sample Tracking</h1>
            <p className="text-gray-600 mt-2">Manage laboratory samples and chain of custody</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/samples/collections')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Collections
            </button>
            <button
              onClick={() => navigate('/samples/scan')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 flex items-center gap-2"
            >
              <QrCode className="h-4 w-4" />
              Scan Sample
            </button>
            <button
              onClick={() => setShowAddForm(true)}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Collect Sample
            </button>
          </div>
        </div>
      </div>

      {/* Statistics Cards */}
      {statistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Samples</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.totalSamples}</p>
              </div>
              <Package className="h-8 w-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Today's Samples</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.todaysSamples}</p>
              </div>
              <FileText className="h-8 w-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Pending</p>
                <p className="text-2xl font-bold text-gray-900">{statistics.pendingSamples}</p>
              </div>
              <BarChart3 className="h-8 w-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 md:col-span-2">
            <p className="text-sm text-gray-600 mb-2">By Status</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {Object.entries(statistics.samplesByStatus || {}).slice(0, 4).map(([status, count]) => (
                <div key={status} className="flex justify-between">
                  <span className="capitalize">{status.replace('_', ' ')}:</span>
                  <span className={`font-medium ${getStatusColor(status, count)}`}>{count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <SampleSearchFilters filters={filters} onFiltersChange={setFilters} />

      {/* Samples Table */}
      <div className="mt-6">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading samples...</p>
          </div>
        ) : samples.length === 0 ? (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No samples found. Start collecting samples to track them.</p>
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
            >
              Collect First Sample
            </button>
          </div>
        ) : (
          <SampleListTable
            samples={samples}
            onView={handleViewSample}
            onEdit={setEditingSample}
            onDelete={handleDeleteSample}
            onPrintLabel={handlePrintLabel}
            onShowQR={handleShowQR}
          />
        )}
      </div>

      {/* QR Code Modal */}
      {showQRModal && selectedSample && qrCodeData && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex min-h-screen items-center justify-center p-4">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setShowQRModal(false)} />
            <div className="relative bg-white rounded-lg max-w-md w-full p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Sample {selectedSample.sampleNumber}
              </h3>
              <div className="text-center space-y-4">
                <div>
                  <p className="text-sm text-gray-600 mb-2">QR Code</p>
                  <img src={qrCodeData.qrCode} alt="QR Code" className="mx-auto" />
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-2">Barcode</p>
                  <img src={qrCodeData.barcode} alt="Barcode" className="mx-auto" />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowQRModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    handlePrintLabel(selectedSample);
                    setShowQRModal(false);
                  }}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Print Label
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SamplesPage;