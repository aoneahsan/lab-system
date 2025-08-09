import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Package, Clock, CheckCircle, Printer } from 'lucide-react';
import { toast } from '@/stores/toast.store';
import { useCreateSample } from '@/hooks/useSamples';
import { useTenant } from '@/hooks/useTenant';
import { useAuthStore } from '@/stores/auth.store';
import { collection, addDoc, serverTimestamp, query, where, getDocs } from 'firebase/firestore';
import { firestore } from '@/config/firebase.config';
import { COLLECTIONS } from '@/config/firebase-collections';
import BatchCollectionModal from '@/components/samples/BatchCollectionModal';
import BatchBarcodesPrint from '@/components/samples/BatchBarcodesPrint';
import type { SampleFormData, Sample, CollectionBatch } from '@/types/sample.types';

const SampleCollectionsPage: React.FC = () => {
  const navigate = useNavigate();
  const [_selectedBatch] = useState<CollectionBatch | null>(null);
  const [isCreatingBatch, setIsCreatingBatch] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [batchSamples, setBatchSamples] = useState<Sample[]>([]);
  const createSampleMutation = useCreateSample();
  const { tenant } = useTenant();
  const { currentUser } = useAuthStore();

  // Mock data for now - will be replaced with actual hooks
  const mockBatches: CollectionBatch[] = [];

  const handleCreateBatch = () => {
    setShowBatchModal(true);
  };

  const handleBatchSubmit = async (samples: any[]) => {
    setIsCreatingBatch(true);
    try {
      // Create batch record
      const batchRef = await addDoc(collection(firestore, COLLECTIONS.BATCHES), {
        date: new Date(),
        totalSamples: samples.length,
        completedSamples: 0,
        status: 'in_progress',
        createdBy: currentUser?.displayName || currentUser?.email,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      // Create samples and collect created samples
      const createdSamples: Sample[] = [];
      let created = 0;
      for (const sampleData of samples) {
        try {
          const formData: SampleFormData = {
            patientId: sampleData.patientId,
            type: sampleData.type,
            tests: sampleData.tests,
            priority: sampleData.priority,
            collectionDate: new Date(),
            collectionTime: new Date().toLocaleTimeString('en-US', { hour12: false }),
            collectedBy: currentUser?.displayName || currentUser?.email || 'Unknown',
            batchId: batchRef.id,
          } as SampleFormData & { batchId: string };

          const newSample = await createSampleMutation.mutateAsync(formData);
          if (newSample) {
            createdSamples.push(newSample as unknown as Sample);
          }
          created++;
        } catch (error) {
          console.error('Error creating sample:', error);
        }
      }

      toast.success(
        'Batch Created',
        `Successfully created ${created} of ${samples.length} samples`
      );
      setShowBatchModal(false);

      // Show print dialog for barcode labels
      if (createdSamples.length > 0) {
        setBatchSamples(createdSamples);
        setShowPrintModal(true);
      }
    } catch (_error) {
      toast.error('Batch Creation Failed', 'Failed to create batch');
    } finally {
      setIsCreatingBatch(false);
    }
  };

  const handlePrintBarcodes = async (batchId: string) => {
    if (!tenant) return;

    try {
      // Fetch samples for this batch
      const samplesQuery = query(
        collection(firestore, COLLECTIONS.SAMPLES),
        where('batchId', '==', batchId)
      );
      const snapshot = await getDocs(samplesQuery);
      const samples = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      })) as Sample[];

      if (samples.length > 0) {
        setBatchSamples(samples);
        setShowPrintModal(true);
      } else {
        toast.error('No Samples', 'No samples found for this batch');
      }
    } catch (_error) {
      toast.error('Error', 'Failed to fetch batch samples');
    }
  };

  const getStatusIcon = (status: CollectionBatch['status']) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'in_progress':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
    }
  };

  const getStatusColor = (status: CollectionBatch['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
    }
  };

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sample Collections</h1>
            <p className="text-gray-600 mt-2">Manage batch sample collections</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/samples')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to Samples
            </button>
            <button
              onClick={handleCreateBatch}
              disabled={isCreatingBatch}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
              New Collection Batch
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Active Batches</p>
              <p className="text-2xl font-bold text-gray-900">2</p>
            </div>
            <Package className="h-8 w-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Samples Today</p>
              <p className="text-2xl font-bold text-gray-900">45</p>
            </div>
            <Clock className="h-8 w-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Completed</p>
              <p className="text-2xl font-bold text-gray-900">120</p>
            </div>
            <CheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Collection Batches List */}
      <div className="bg-white rounded-lg shadow">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Collection Batches</h2>
        </div>
        <div className="divide-y divide-gray-200">
          {mockBatches.map((batch) => (
            <div key={batch.id} className="px-6 py-4 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div
                  className="flex items-center space-x-4 flex-1 cursor-pointer"
                  onClick={() => setSelectedBatch(batch)}
                >
                  {getStatusIcon(batch.status)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Batch #{batch.id} - {batch.date instanceof Date ? batch.date.toLocaleDateString() : batch.date.toDate().toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-500">Created by {batch.createdBy}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      {batch.completedSamples} / {batch.totalSamples} samples
                    </p>
                    <div className="w-32 bg-gray-200 rounded-full h-2 mt-1">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{
                          width: `${(batch.completedSamples / batch.totalSamples) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrintBarcodes(batch.id);
                    }}
                    className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded"
                    title="Print barcode labels"
                  >
                    <Printer className="h-4 w-4" />
                  </button>
                  <span
                    className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                      batch.status
                    )}`}
                  >
                    {batch.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {mockBatches.length === 0 && (
        <div className="bg-white rounded-lg shadow p-12 text-center">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No collection batches found.</p>
          <button
            onClick={handleCreateBatch}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          >
            Create First Batch
          </button>
        </div>
      )}

      {/* Batch Collection Modal */}
      <BatchCollectionModal
        isOpen={showBatchModal}
        onClose={() => setShowBatchModal(false)}
        onSubmit={handleBatchSubmit}
      />

      {/* Batch Barcodes Print Modal */}
      <BatchBarcodesPrint
        isOpen={showPrintModal}
        onClose={() => {
          setShowPrintModal(false);
          setBatchSamples([]);
        }}
        samples={batchSamples}
      />
    </div>
  );
};

export default SampleCollectionsPage;
