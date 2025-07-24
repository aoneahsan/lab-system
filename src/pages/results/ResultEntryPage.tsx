import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, FlaskRound, Search } from 'lucide-react';
import { useTestOrders } from '@/hooks/useTests';
import { useCreateResult } from '@/hooks/useResults';
import { useSamples } from '@/hooks/useSamples';
import { usePatients } from '@/hooks/usePatients';
import ResultEntryForm from '@/components/results/ResultEntryForm';
import type { TestOrderFilter } from '@/types/test.types';
import type { ResultEntryFormData } from '@/types/result.types';
import type { Sample } from '@/types/sample.types';

const ResultEntryPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get('orderId');
  const sampleId = searchParams.get('sampleId');
  const testId = searchParams.get('testId');

  const [selectedOrder, setSelectedOrder] = useState<string>(orderId || '');
  const [selectedSample, setSelectedSample] = useState<string>(sampleId || '');
  const [selectedTest, setSelectedTest] = useState<string>(testId || '');
  const [searchTerm, setSearchTerm] = useState('');

  const createResult = useCreateResult();

  // Fetch pending test orders that need results
  const orderFilter: TestOrderFilter = {
    status: 'approved', // Single status instead of array
  };
  const { data: orders = [], isLoading: ordersLoading } = useTestOrders(orderFilter);
  const { data: samples = [] } = useSamples({});
  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];

  // Filter orders based on search term
  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    
    const patient = patients.find(p => p.id === order.patientId);
    if (!patient) return false;
    
    const searchLower = searchTerm.toLowerCase();
    return (
      order.orderNumber.toLowerCase().includes(searchLower) ||
      patient.fullName.toLowerCase().includes(searchLower) ||
      patient.patientId.toLowerCase().includes(searchLower) ||
      order.tests.some(test => 
        test.testName.toLowerCase().includes(searchLower) ||
        test.testCode.toLowerCase().includes(searchLower)
      )
    );
  });

  const handleSubmit = async (data: ResultEntryFormData) => {
    await createResult.mutateAsync(data);
    navigate('/results');
  };

  const handleOrderSelect = (orderId: string) => {
    setSelectedOrder(orderId);
    const order = orders.find(o => o.id === orderId);
    if (order) {
      // Find associated sample
      const sample = samples.find((s: Sample) => s.orderId === orderId);
      if (sample) {
        setSelectedSample(sample.id);
      }
      // Pre-select first test if only one
      if (order.tests.length === 1) {
        setSelectedTest(order.tests[0].testId);
      } else {
        setSelectedTest('');
      }
    }
  };

  if (selectedOrder && selectedSample && selectedTest) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <button
            onClick={() => {
              setSelectedOrder('');
              setSelectedSample('');
              setSelectedTest('');
            }}
            className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Order Selection
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Enter Test Result</h1>
        </div>

        <div className="max-w-2xl">
          <ResultEntryForm
            orderId={selectedOrder}
            sampleId={selectedSample}
            testId={selectedTest}
            onSubmit={handleSubmit}
            onCancel={() => navigate('/results')}
            isLoading={createResult.isPending}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <button
          onClick={() => navigate('/results')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Results
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Select Test Order</h1>
        <p className="text-gray-600 mt-2">Select a test order to enter results</p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by patient name, MRN, order number, or test name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Orders List */}
      <div className="bg-white rounded-lg shadow">
        {ordersLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Loading orders...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center py-12">
            <FlaskRound className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500">No pending test orders found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Patient
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tests
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Priority
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => {
                  const patient = patients.find(p => p.id === order.patientId);
                  const sample = samples.find((s: Sample) => s.orderId === order.id);
                  
                  return (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{order.orderNumber}</div>
                        <div className="text-sm text-gray-500">
                          {order.orderDate instanceof Date ? order.orderDate.toLocaleDateString() : order.orderDate.toDate().toLocaleDateString()}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {patient && (
                          <div>
                            <div className="text-sm font-medium text-gray-900">{patient.fullName}</div>
                            <div className="text-sm text-gray-500">ID: {patient.patientId}</div>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {order.tests.map((test) => (
                            <div key={test.testId} className="mb-1">
                              <span className="font-medium">{test.testName}</span>
                              {test.status === 'completed' && (
                                <span className="ml-2 text-xs text-green-600">(Resulted)</span>
                              )}
                            </div>
                          )).slice(0, 3)}
                          {order.tests.length > 3 && (
                            <div className="text-xs text-gray-500">+{order.tests.length - 3} more</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          order.status === 'approved' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'specimen_collected' ? 'bg-green-100 text-green-800' :
                          order.status === 'in_progress' ? 'bg-purple-100 text-purple-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded ${
                          order.priority === 'stat' ? 'bg-red-100 text-red-800' :
                          order.priority === 'asap' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.priority.toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {sample ? (
                          <button
                            onClick={() => handleOrderSelect(order.id)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            Enter Results
                          </button>
                        ) : (
                          <span className="text-gray-400">No sample</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Test Selection Modal for orders with multiple tests */}
      {selectedOrder && !selectedTest && (() => {
        const order = orders.find(o => o.id === selectedOrder);
        return order && order.tests.length > 1 ? (
          <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Select Test</h3>
              <div className="space-y-2">
                {order.tests.filter(test => test.status !== 'completed').map((test) => (
                  <button
                    key={test.testId}
                    onClick={() => setSelectedTest(test.testId)}
                    className="w-full text-left px-4 py-3 border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <div className="font-medium">{test.testName}</div>
                    <div className="text-sm text-gray-500">{test.testCode}</div>
                  </button>
                ))}
              </div>
              <button
                onClick={() => setSelectedOrder('')}
                className="mt-4 w-full px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : null;
      })()}
    </div>
  );
};

export default ResultEntryPage;