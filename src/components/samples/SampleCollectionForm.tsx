import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Calendar, Clock, MapPin, User, AlertCircle } from 'lucide-react';
import { useTestOrders } from '@/hooks/useTests';
import { usePatients } from '@/hooks/usePatients';
import type { SampleFormData } from '@/types/sample.types';
import type { TestOrder } from '@/types/test.types';
import type { PatientListItem } from '@/types/patient.types';

interface SampleCollectionFormProps {
  orderId?: string;
  onSubmit: (data: SampleFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const SampleCollectionForm: React.FC<SampleCollectionFormProps> = ({
  orderId,
  onSubmit,
  onCancel,
  isLoading = false,
}) => {
  const [selectedOrder, setSelectedOrder] = useState<TestOrder | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);

  const { data: orders = [] } = useTestOrders({ status: 'pending' });
  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SampleFormData>({
    defaultValues: {
      priority: 'routine',
      volumeUnit: 'ml',
      collectionDate: new Date(),
      collectionTime: new Date().toTimeString().slice(0, 5),
    },
  });

  const selectedOrderId = watch('orderId');

  // Load order and patient data
  useEffect(() => {
    if (orderId) {
      setValue('orderId', orderId);
    }
  }, [orderId, setValue]);

  useEffect(() => {
    if (selectedOrderId) {
      const order = orders.find((o) => o.id === selectedOrderId);
      if (order) {
        setSelectedOrder(order);
        setValue('patientId', order.patientId);
        setValue('priority', order.priority);
        setValue(
          'tests',
          order.tests.map((t) => t.testId)
        );

        // Load patient data
        const patient = patients.find((p) => p.id === order.patientId);
        if (patient) {
          setSelectedPatient(patient);
        }
      }
    }
  }, [selectedOrderId, orders, patients, setValue]);

  const getSampleTypeForTest = (testType: string): string => {
    // This would normally come from test definitions
    const typeMapping: Record<string, string> = {
      blood: 'blood',
      serum: 'serum',
      plasma: 'plasma',
      urine: 'urine',
      default: 'blood',
    };
    return typeMapping[testType] || typeMapping.default;
  };

  const getContainerForSampleType = (sampleType: string): string => {
    const containerMapping: Record<string, string> = {
      blood: 'edta_tube',
      serum: 'sst_tube',
      plasma: 'sodium_citrate_tube',
      urine: 'urine_cup',
      default: 'edta_tube',
    };
    return containerMapping[sampleType] || containerMapping.default;
  };

  const onFormSubmit = (data: SampleFormData) => {
    // Set type and container based on first test
    if (selectedOrder && selectedOrder.tests.length > 0) {
      const firstTest = selectedOrder.tests[0];
      const sampleType = getSampleTypeForTest(firstTest.specimenType || 'blood');
      const container = getContainerForSampleType(sampleType);

      onSubmit({
        ...data,
        type: sampleType as SampleFormData['type'],
        container: container as SampleFormData['container'],
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Order Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Information</h3>

        {!orderId && (
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700">Select Order *</label>
            <select
              {...register('orderId', { required: 'Order is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select an order...</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.orderNumber} -{' '}
                  {new Date(
                    order.orderDate instanceof Date ? order.orderDate : order.orderDate.toDate()
                  ).toLocaleDateString()}
                </option>
              ))}
            </select>
            {errors.orderId && (
              <p className="mt-1 text-sm text-red-600">{errors.orderId.message}</p>
            )}
          </div>
        )}

        {selectedOrder && selectedPatient && (
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{selectedPatient.fullName}</p>
                <p className="text-sm text-gray-600">
                  Patient ID: {selectedPatient.patientId} | DOB:{' '}
                  {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Order: {selectedOrder.orderNumber} | Priority:{' '}
                  <span className="font-medium">{selectedOrder.priority.toUpperCase()}</span>
                </p>
              </div>
            </div>
            <div className="mt-3">
              <p className="text-sm font-medium text-gray-700">Tests:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {selectedOrder.tests.map((test, idx) => (
                  <span
                    key={idx}
                    className="inline-flex px-2 py-1 text-xs font-medium rounded bg-white text-gray-800"
                  >
                    {test.testCode}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Collection Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Collection Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="inline h-4 w-4 mr-1" />
              Collection Date *
            </label>
            <input
              type="date"
              {...register('collectionDate', { required: 'Collection date is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.collectionDate && (
              <p className="mt-1 text-sm text-red-600">{errors.collectionDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <Clock className="inline h-4 w-4 mr-1" />
              Collection Time *
            </label>
            <input
              type="time"
              {...register('collectionTime', { required: 'Collection time is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
            {errors.collectionTime && (
              <p className="mt-1 text-sm text-red-600">{errors.collectionTime.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <User className="inline h-4 w-4 mr-1" />
              Collected By *
            </label>
            <input
              type="text"
              {...register('collectedBy', { required: 'Collector name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Phlebotomist name"
            />
            {errors.collectedBy && (
              <p className="mt-1 text-sm text-red-600">{errors.collectedBy.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              <MapPin className="inline h-4 w-4 mr-1" />
              Collection Site
            </label>
            <input
              type="text"
              {...register('collectionSite')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Lab Room 1, Patient Room 302"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Volume</label>
            <div className="mt-1 flex rounded-md shadow-sm">
              <input
                type="number"
                step="0.1"
                {...register('volume', { min: 0 })}
                className="flex-1 rounded-none rounded-l-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                placeholder="e.g., 5"
              />
              <select
                {...register('volumeUnit')}
                className="rounded-none rounded-r-md border-gray-300 focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="ml">ml</option>
                <option value="ul">μl</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Storage Temperature</label>
            <select
              {...register('storageTemperature')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            >
              <option value="">Select temperature...</option>
              <option value="room_temp">Room Temperature</option>
              <option value="refrigerated">Refrigerated (2-8°C)</option>
              <option value="frozen">Frozen (-20°C)</option>
              <option value="ultra_frozen">Ultra Frozen (-80°C)</option>
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Storage Location</label>
            <input
              type="text"
              {...register('storageLocation')}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="e.g., Rack A, Shelf 3, Position 12"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">Notes</label>
            <textarea
              {...register('notes')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Any special notes or observations..."
            />
          </div>
        </div>

        {selectedOrder?.priority === 'stat' && (
          <div className="mt-4 p-3 bg-red-50 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">STAT Order</p>
              <p className="text-sm text-red-700 mt-1">
                This is a STAT order. Please ensure immediate processing and notify the lab of
                sample arrival.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading || !selectedOrder}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating Sample...' : 'Create Sample'}
        </button>
      </div>
    </form>
  );
};

export default SampleCollectionForm;
