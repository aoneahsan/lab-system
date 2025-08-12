import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Badge } from '@/components/ui/Badge';
import {
  ArrowLeft,
  Search,
  Plus,
  X,
  AlertCircle,
  User,
  FileText,
  ChevronRight,
} from 'lucide-react';
import { usePatients } from '@/hooks/usePatients';
import { useTests } from '@/hooks/useTests';
import { useCreateOrder } from '@/hooks/useCreateOrder';
import { toast } from 'sonner';
import { format } from 'date-fns';

export function NewOrderScreen() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<any>(null);
  const [selectedTests, setSelectedTests] = useState<any[]>([]);
  const [priority, setPriority] = useState('routine');
  const [clinicalInfo, setClinicalInfo] = useState('');
  const [testSearchQuery, setTestSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');

  const { data: patients = [] } = usePatients({ searchTerm: searchQuery });
  const { data: tests = [] } = useTests({
    searchTerm: testSearchQuery,
    category: selectedCategory === 'all' ? undefined : selectedCategory,
  });
  const { mutate: createOrder, isPending: isCreating } = useCreateOrder();

  const testCategories = [
    { value: 'all', label: 'All Categories' },
    { value: 'chemistry', label: 'Chemistry' },
    { value: 'hematology', label: 'Hematology' },
    { value: 'microbiology', label: 'Microbiology' },
    { value: 'immunology', label: 'Immunology' },
    { value: 'urinalysis', label: 'Urinalysis' },
  ];

  const handleSelectPatient = (patient: any) => {
    setSelectedPatient(patient);
    setStep(2);
  };

  const handleAddTest = (test: any) => {
    if (!selectedTests.find((t) => t.id === test.id)) {
      setSelectedTests([...selectedTests, test]);
    }
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
  };

  const handleSubmit = () => {
    if (!selectedPatient || selectedTests.length === 0) return;

    const orderData = {
      patientId: selectedPatient.id,
      patientName: selectedPatient.name,
      patientMRN: selectedPatient.mrn,
      patientDOB: selectedPatient.dateOfBirth,
      tests: selectedTests.map((t) => ({
        id: t.id,
        code: t.code,
        name: t.name,
        category: t.category,
      })),
      priority: priority as 'routine' | 'stat' | 'urgent',
      clinicalInfo,
      clinicianId: 'current', // Will be replaced with actual clinician ID
    };

    createOrder(orderData, {
      onSuccess: (order) => {
        toast.success('Order created successfully');
        navigate(`/clinician/orders/${order.id}`);
      },
      onError: () => {
        toast.error('Failed to create order');
      },
    });
  };

  return (
    <div className="p-4 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Button variant="ghost" size="sm" onClick={() => navigate('/clinician/orders')}>
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
          <h1 className="text-xl font-bold text-gray-900">New Test Order</h1>
        </div>
        <div className="flex space-x-2">
          <Badge variant="outline">Step {step} of 3</Badge>
        </div>
      </div>

      {/* Step 1: Select Patient */}
      {step === 1 && (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <User className="h-5 w-5 mr-2" />
              Select Patient
            </h2>
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search by name or MRN..."
                value={searchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setSearchQuery(e.target.value)
                }
                className="pl-10"
              />
            </div>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {(Array.isArray(patients) ? patients : patients.patients || []).map(
                (patient: any) => (
                  <div
                    key={patient.id}
                    onClick={() => handleSelectPatient(patient)}
                    className="p-3 border rounded-lg hover:bg-gray-50 cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-gray-900">{patient.name}</p>
                        <p className="text-sm text-gray-600">
                          MRN: {patient.mrn} • DOB:{' '}
                          {format(new Date(patient.dateOfBirth), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <ChevronRight className="h-5 w-5 text-gray-400" />
                    </div>
                  </div>
                )
              )}
            </div>
          </Card>
        </div>
      )}

      {/* Step 2: Select Tests */}
      {step === 2 && (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3 flex items-center">
              <FileText className="h-5 w-5 mr-2" />
              Selected Patient
            </h2>
            <div className="bg-gray-50 rounded-lg p-3">
              <p className="font-medium">{selectedPatient.name}</p>
              <p className="text-sm text-gray-600">
                MRN: {selectedPatient.mrn} • Age: {selectedPatient.age} years
              </p>
            </div>
          </Card>

          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Select Tests</h2>

            <Select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="mb-3"
            >
              {testCategories.map((cat) => (
                <option key={cat.value} value={cat.value}>
                  {cat.label}
                </option>
              ))}
            </Select>

            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="search"
                placeholder="Search tests..."
                value={testSearchQuery}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                  setTestSearchQuery(e.target.value)
                }
                className="pl-10"
              />
            </div>

            {selectedTests.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">
                  Selected Tests ({selectedTests.length})
                </p>
                <div className="space-y-2">
                  {selectedTests.map((test) => (
                    <div
                      key={test.id}
                      className="flex items-center justify-between bg-blue-50 rounded-lg p-2"
                    >
                      <div>
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className="text-xs text-gray-600">{test.code}</p>
                      </div>
                      <Button variant="ghost" size="sm" onClick={() => handleRemoveTest(test.id)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {tests.map((test) => {
                const isSelected = selectedTests.find((t) => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    onClick={() => !isSelected && handleAddTest(test)}
                    className={`p-3 border rounded-lg cursor-pointer ${
                      isSelected ? 'bg-gray-100 opacity-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium text-sm">{test.name}</p>
                        <p className="text-xs text-gray-600">
                          {test.code} • {test.category}
                        </p>
                      </div>
                      {isSelected ? (
                        <Badge variant="outline" size="sm">
                          Selected
                        </Badge>
                      ) : (
                        <Plus className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={() => setStep(3)}
              disabled={selectedTests.length === 0}
              className="flex-1"
            >
              Continue
            </Button>
          </div>
        </div>
      )}

      {/* Step 3: Additional Information */}
      {step === 3 && (
        <div className="space-y-4">
          <Card className="p-4">
            <h2 className="font-semibold text-gray-900 mb-3">Order Summary</h2>

            <div className="space-y-3 mb-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Patient</p>
                <p className="font-medium">{selectedPatient.name}</p>
                <p className="text-sm text-gray-600">MRN: {selectedPatient.mrn}</p>
              </div>

              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm text-gray-600 mb-1">Tests ({selectedTests.length})</p>
                {selectedTests.map((test, index) => (
                  <p key={test.id} className="text-sm">
                    {index + 1}. {test.name} ({test.code})
                  </p>
                ))}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="routine">Routine</option>
                  <option value="urgent">Urgent</option>
                  <option value="stat">STAT</option>
                </Select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Clinical Information
                </label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  rows={3}
                  placeholder="Enter clinical information, diagnosis, or special instructions..."
                  value={clinicalInfo}
                  onChange={(e) => setClinicalInfo(e.target.value)}
                />
              </div>
            </div>
          </Card>

          {priority === 'stat' && (
            <Card className="p-4 border-red-200 bg-red-50">
              <div className="flex items-start space-x-2">
                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-red-900">STAT Order</p>
                  <p className="text-sm text-red-700">
                    This order will be prioritized for immediate processing.
                  </p>
                </div>
              </div>
            </Card>
          )}

          <div className="flex space-x-3">
            <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
              Back
            </Button>
            <Button
              variant="primary"
              onClick={handleSubmit}
              disabled={isCreating}
              className="flex-1"
            >
              {isCreating ? 'Creating...' : 'Submit Order'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
