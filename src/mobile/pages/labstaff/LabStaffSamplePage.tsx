import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  TestTube, 
  User, 
  Clock,
  FileText,
  Edit3,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { toast } from '@/hooks/useToast';

interface TestParameter {
  id: string;
  name: string;
  value: string;
  unit: string;
  referenceRange: string;
  flag?: 'H' | 'L' | 'C'; // High, Low, Critical
}

interface SampleInfo {
  id: string;
  patientName: string;
  patientId: string;
  patientAge: number;
  patientGender: 'M' | 'F';
  orderId: string;
  testName: string;
  sampleType: string;
  collectedAt: Date;
  receivedAt: Date;
  status: 'pending' | 'in_progress' | 'completed';
  priority: 'routine' | 'urgent' | 'critical';
  clinician: string;
  department: string;
}

const LabStaffSamplePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Mock data - in real app would fetch based on ID
  const [sampleInfo] = useState<SampleInfo>({
    id: id || '1',
    patientName: 'John Doe',
    patientId: 'P12345',
    patientAge: 45,
    patientGender: 'M',
    orderId: 'ORD-001',
    testName: 'Complete Blood Count',
    sampleType: 'Whole Blood EDTA',
    collectedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
    receivedAt: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
    status: 'in_progress',
    priority: 'routine',
    clinician: 'Dr. Smith',
    department: 'Internal Medicine',
  });

  const [parameters, setParameters] = useState<TestParameter[]>([
    { id: '1', name: 'Hemoglobin', value: '', unit: 'g/dL', referenceRange: '13.5-17.5' },
    { id: '2', name: 'WBC Count', value: '', unit: '×10³/µL', referenceRange: '4.5-11.0' },
    { id: '3', name: 'RBC Count', value: '', unit: '×10⁶/µL', referenceRange: '4.5-5.9' },
    { id: '4', name: 'Hematocrit', value: '', unit: '%', referenceRange: '41-53' },
    { id: '5', name: 'Platelet Count', value: '', unit: '×10³/µL', referenceRange: '150-400' },
    { id: '6', name: 'MCV', value: '', unit: 'fL', referenceRange: '80-100' },
    { id: '7', name: 'MCH', value: '', unit: 'pg', referenceRange: '27-33' },
    { id: '8', name: 'MCHC', value: '', unit: 'g/dL', referenceRange: '32-36' },
  ]);

  const handleParameterChange = (parameterId: string, value: string) => {
    setParameters(prev => 
      prev.map(param => 
        param.id === parameterId 
          ? { ...param, value, flag: getFlag(value, param) }
          : param
      )
    );
  };

  const getFlag = (value: string, param: TestParameter): TestParameter['flag'] | undefined => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return undefined;

    const [min, max] = param.referenceRange.split('-').map(v => parseFloat(v));
    
    // Mock critical ranges
    const criticalRanges: { [key: string]: { low: number; high: number } } = {
      'Hemoglobin': { low: 7, high: 20 },
      'Platelet Count': { low: 50, high: 1000 },
    };

    const critical = criticalRanges[param.name];
    if (critical && (numValue < critical.low || numValue > critical.high)) {
      return 'C';
    }

    if (numValue < min) return 'L';
    if (numValue > max) return 'H';
    return undefined;
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    // Validate all required fields
    const missingValues = parameters.filter(p => !p.value);
    if (missingValues.length > 0) {
      toast.error('Please enter all test values');
      setIsSaving(false);
      return;
    }

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      toast.success('Results saved successfully');
      setIsEditing(false);
      
      // Check for critical values
      const criticalParams = parameters.filter(p => p.flag === 'C');
      if (criticalParams.length > 0) {
        toast.error(`Critical values detected! Immediate notification sent to ${sampleInfo.clinician}`);
      }
    } catch (error) {
      toast.error('Failed to save results');
    } finally {
      setIsSaving(false);
    }
  };

  const getFlagColor = (flag?: TestParameter['flag']) => {
    switch (flag) {
      case 'H':
      case 'L':
        return 'text-orange-600';
      case 'C':
        return 'text-red-600 font-bold';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="flex flex-col bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white shadow-sm px-6 pt-12 pb-4">
        <div className="flex items-center gap-4 mb-4">
          <button
            onClick={() => navigate(-1)}
            className="p-2 -ml-2"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <h1 className="text-xl font-bold text-gray-900">Result Entry</h1>
        </div>

        {/* Sample Info */}
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h2 className="font-medium text-gray-900">{sampleInfo.patientName}</h2>
              <p className="text-sm text-gray-600">
                {sampleInfo.patientId} • {sampleInfo.patientAge}y {sampleInfo.patientGender}
              </p>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              sampleInfo.priority === 'critical' ? 'bg-red-100 text-red-700' :
              sampleInfo.priority === 'urgent' ? 'bg-orange-100 text-orange-700' :
              'bg-blue-100 text-blue-700'
            }`}>
              {sampleInfo.priority.toUpperCase()}
            </span>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2">
              <TestTube className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Test:</span>
              <span className="font-medium">{sampleInfo.testName}</span>
            </div>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Order:</span>
              <span className="font-medium">{sampleInfo.orderId}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Collected:</span>
              <span className="font-medium">{sampleInfo.collectedAt.toLocaleTimeString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-4 w-4 text-gray-400" />
              <span className="text-gray-600">Clinician:</span>
              <span className="font-medium">{sampleInfo.clinician}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Test Parameters */}
      <div className="flex-1 px-6 py-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900">Test Results</h3>
          {!isEditing && (
            <button
              onClick={() => setIsEditing(true)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium"
            >
              <Edit3 className="h-4 w-4" />
              Edit
            </button>
          )}
        </div>

        <div className="space-y-3">
          {parameters.map((param) => (
            <div key={param.id} className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-start justify-between mb-2">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{param.name}</p>
                  <p className="text-sm text-gray-600">
                    Reference: {param.referenceRange} {param.unit}
                  </p>
                </div>
                {param.flag && (
                  <span className={`text-sm font-bold ${getFlagColor(param.flag)}`}>
                    {param.flag}
                  </span>
                )}
              </div>
              
              {isEditing ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={param.value}
                    onChange={(e) => handleParameterChange(param.id, e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent ${
                      param.flag === 'C' ? 'border-red-300 bg-red-50' :
                      param.flag ? 'border-orange-300 bg-orange-50' :
                      'border-gray-300'
                    }`}
                    placeholder="Enter value"
                  />
                  <span className="text-sm text-gray-600">{param.unit}</span>
                </div>
              ) : (
                <p className={`text-lg font-medium ${getFlagColor(param.flag)}`}>
                  {param.value || '—'} {param.value && param.unit}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Critical Value Alert */}
        {parameters.some(p => p.flag === 'C') && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <div>
                <p className="font-medium text-red-900">Critical Values Detected</p>
                <p className="text-sm text-red-700">
                  Clinician will be notified immediately upon saving
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      {isEditing && (
        <div className="px-6 py-4 bg-white border-t border-gray-200">
          <div className="flex gap-3">
            <button
              onClick={() => {
                setIsEditing(false);
                // Reset values if needed
              }}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex-1 px-4 py-3 bg-purple-600 text-white rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  Save Results
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LabStaffSamplePage;