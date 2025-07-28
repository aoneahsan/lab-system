import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, FileText, QrCode } from 'lucide-react';
import { useSample } from '@/hooks/useSamples';
import { usePatient } from '@/hooks/usePatients';
import { useTestOrder } from '@/hooks/useTests';
import { LoadingState } from '@/components/common/LoadingState';
import { ErrorState } from '@/components/common/ErrorState';
import ChainOfCustody from '@/components/samples/ChainOfCustody';

const SampleDetailPage: React.FC = () => {
  const { sampleId } = useParams<{ sampleId: string }>();
  const navigate = useNavigate();

  const { data: sample, isLoading: sampleLoading, error: sampleError } = useSample(sampleId!);
  const { data: patient, isLoading: patientLoading } = usePatient(sample?.patientId || '');
  const { data: order, isLoading: orderLoading } = useTestOrder(sample?.orderId || '');

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      pending_collection: 'bg-yellow-100 text-yellow-800',
      collected: 'bg-blue-100 text-blue-800',
      in_transit: 'bg-purple-100 text-purple-800',
      received: 'bg-indigo-100 text-indigo-800',
      processing: 'bg-orange-100 text-orange-800',
      stored: 'bg-green-100 text-green-800',
      completed: 'bg-green-100 text-green-800',
      rejected: 'bg-red-100 text-red-800',
      expired: 'bg-gray-100 text-gray-800',
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  if (sampleLoading || patientLoading || orderLoading) {
    return <LoadingState message="Loading sample details..." />;
  }

  if (sampleError || !sample) {
    return (
      <ErrorState error="Failed to load sample details" onRetry={() => navigate('/samples')} />
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="mb-6">
        <button
          onClick={() => navigate('/samples')}
          className="mb-4 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Samples
        </button>

        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Sample {sample.sampleNumber}</h1>
            <div className="mt-2 flex items-center gap-4">
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                  sample.status
                )}`}
              >
                {sample.status.replace(/_/g, ' ').toUpperCase()}
              </span>
              <span
                className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                  sample.priority === 'stat'
                    ? 'bg-red-100 text-red-800'
                    : sample.priority === 'asap'
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800'
                }`}
              >
                {sample.priority.toUpperCase()}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Main Details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Patient Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Patient Information</h2>
            {patient ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Name</p>
                  <p className="font-medium">
                    {patient.firstName} {patient.lastName}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">MRN</p>
                  <p className="font-medium">{patient.mrn}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Date of Birth</p>
                  <p className="font-medium">
                    {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Gender</p>
                  <p className="font-medium capitalize">{patient.gender}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Patient information not available</p>
            )}
          </div>

          {/* Sample Details */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Sample Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Sample Type</p>
                <p className="font-medium capitalize">{sample.type}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Container</p>
                <p className="font-medium capitalize">{sample.container.replace(/_/g, ' ')}</p>
              </div>
              {sample.volume && (
                <div>
                  <p className="text-sm text-gray-600">Volume</p>
                  <p className="font-medium">
                    {sample.volume} {sample.volumeUnit || 'ml'}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-gray-600">Barcode</p>
                <p className="font-mono text-sm">{sample.barcode}</p>
              </div>
            </div>
          </div>

          {/* Test Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Test Information</h2>
            {order && order.tests && order.tests.length > 0 ? (
              <div className="space-y-3">
                {order.tests.map((test, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded"
                  >
                    <div>
                      <p className="font-medium">{test.testName}</p>
                      <p className="text-sm text-gray-500">{test.testCode}</p>
                    </div>
                    <span className="text-sm text-gray-600">LOINC: {test.testCode || 'N/A'}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500">No test information available</p>
            )}
          </div>

          {/* Chain of Custody */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Chain of Custody</h2>
            <ChainOfCustody entries={sample.chainOfCustody || []} />
          </div>
        </div>

        {/* Right Column - Sidebar */}
        <div className="space-y-6">
          {/* Collection Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Collection Information</h2>
            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-600">Collection Date/Time</p>
                <p className="font-medium">
                  {(sample.collectionDate instanceof Date
                    ? sample.collectionDate
                    : sample.collectionDate.toDate()
                  ).toLocaleDateString()}{' '}
                  at {sample.collectionTime}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Collected By</p>
                <p className="font-medium">{sample.collectedBy}</p>
              </div>
              {sample.collectionSite && (
                <div>
                  <p className="text-sm text-gray-600">Collection Site</p>
                  <p className="font-medium">{sample.collectionSite}</p>
                </div>
              )}
            </div>
          </div>

          {/* Storage Information */}
          {(sample.storageLocation || sample.storageTemperature) && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Information</h2>
              <div className="space-y-3">
                {sample.storageLocation && (
                  <div>
                    <p className="text-sm text-gray-600">Storage Location</p>
                    <p className="font-medium">{sample.storageLocation}</p>
                  </div>
                )}
                {sample.storageTemperature && (
                  <div>
                    <p className="text-sm text-gray-600">Storage Temperature</p>
                    <p className="font-medium capitalize">
                      {sample.storageTemperature.replace(/_/g, ' ')}
                    </p>
                  </div>
                )}
                {sample.expirationDate && (
                  <div>
                    <p className="text-sm text-gray-600">Expiration Date</p>
                    <p className="font-medium">
                      {new Date(sample.expirationDate.toDate()).toLocaleDateString()}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* QR Code Display */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Barcode & QR Code</h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-2">Barcode</p>
                <p className="font-mono text-lg bg-gray-100 p-3 rounded text-center">
                  {sample.barcode}
                </p>
              </div>
              {sample.qrCode && (
                <div>
                  <p className="text-sm text-gray-600 mb-2">QR Code</p>
                  <div className="flex justify-center">
                    <img src={sample.qrCode} alt="Sample QR Code" className="w-32 h-32" />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Actions</h2>
            <div className="space-y-2">
              {sample.status === 'pending_collection' && (
                <button className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
                  Mark as Collected
                </button>
              )}
              {sample.status === 'collected' && (
                <button className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700">
                  Mark as In Transit
                </button>
              )}
              {sample.status === 'in_transit' && (
                <button className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
                  Mark as Received
                </button>
              )}
              <button className="w-full px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">
                <QrCode className="h-4 w-4 inline mr-2" />
                Print Label
              </button>
              <button
                onClick={() => navigate(`/tests/orders/${sample.orderId}`)}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
              >
                <FileText className="h-4 w-4 inline mr-2" />
                View Test Order
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SampleDetailPage;
