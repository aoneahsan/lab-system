import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { VoiceInput } from '@/components/common/VoiceInput';
import { VoiceResultEntry } from '@/components/results/VoiceResultEntry';
import { Button } from '@/components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert } from '@/components/ui/Alert';
import { 
  MicrophoneIcon, 
  ArrowLeftIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import type { TestDefinition } from '@/types/test.types';
import type { TestResult } from '@/types/result.types';
import { uiLogger } from '@/services/logger.service';

// Sample test definitions for demo
const sampleTestDefinitions: TestDefinition[] = [
  {
    id: '1',
    tenantId: 'demo',
    code: 'GLU',
    name: 'Glucose',
    category: 'chemistry',
    unit: 'mg/dL',
    specimen: { type: 'blood' },
    referenceRanges: [{ id: '1', normalMin: 70, normalMax: 100, unit: 'mg/dL' } as any],
    resultType: 'numeric',
    isActive: true,
    isOrderable: true,
    turnaroundTime: { routine: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo',
    updatedBy: 'demo',
  } as TestDefinition,
  {
    id: '2',
    tenantId: 'demo',
    code: 'HGB',
    name: 'Hemoglobin',
    category: 'hematology',
    unit: 'g/dL',
    specimen: { type: 'blood' },
    referenceRanges: [{ id: '2', normalMin: 12, normalMax: 16, unit: 'g/dL' } as any],
    resultType: 'numeric',
    isActive: true,
    isOrderable: true,
    turnaroundTime: { routine: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo',
    updatedBy: 'demo',
  } as TestDefinition,
  {
    id: '3',
    tenantId: 'demo',
    code: 'WBC',
    name: 'White Blood Cell Count',
    category: 'hematology',
    unit: 'K/uL',
    specimen: { type: 'blood' },
    referenceRanges: [{ id: '3', normalMin: 4.5, normalMax: 11.0, unit: 'K/uL' } as any],
    resultType: 'numeric',
    isActive: true,
    isOrderable: true,
    turnaroundTime: { routine: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo',
    updatedBy: 'demo',
  } as TestDefinition,
  {
    id: '4',
    tenantId: 'demo',
    code: 'CREAT',
    name: 'Creatinine',
    category: 'chemistry',
    unit: 'mg/dL',
    specimen: { type: 'blood' },
    referenceRanges: [{ id: '4', normalMin: 0.6, normalMax: 1.2, unit: 'mg/dL' } as any],
    resultType: 'numeric',
    isActive: true,
    isOrderable: true,
    turnaroundTime: { routine: 1 },
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: 'demo',
    updatedBy: 'demo',
  } as TestDefinition,
];

export const VoiceDictationDemo: React.FC = () => {
  const [mode, setMode] = useState<'demo' | 'result-entry'>('demo');
  const [patientName, setPatientName] = useState('');
  const [clinicalNotes, setClinicalNotes] = useState('');
  const [medicalHistory, setMedicalHistory] = useState('');
  const [testValue, setTestValue] = useState('');

  const handleResultSubmit = (results: Partial<TestResult>[]) => {
    uiLogger.log('Submitted results:', results);
    toast.success(
      <div>
        <p className="font-medium">Results submitted successfully!</p>
        <p className="text-sm mt-1">
          {results.length} test results saved
        </p>
      </div>
    );
    setMode('demo');
  };

  if (mode === 'result-entry') {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <VoiceResultEntry
            testDefinitions={sampleTestDefinitions}
            onSubmit={handleResultSubmit}
            onCancel={() => setMode('demo')}
            patientName="John Doe (Demo Patient)"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin"
            className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-4"
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Back to Admin Panel
          </Link>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <MicrophoneIcon className="h-8 w-8 text-blue-600" />
            Voice Dictation Demo
          </h1>
          <p className="text-gray-600 mt-2">
            Try out the voice dictation features for result entry and clinical notes
          </p>
        </div>

        {/* Feature Info */}
        <Alert className="mb-8 bg-blue-50 border-blue-200">
          <InformationCircleIcon className="h-5 w-5" />
          <div>
            <p className="font-medium">Voice Dictation Features:</p>
            <ul className="mt-2 space-y-1 text-sm">
              <li>• Works on both web browsers and mobile apps</li>
              <li>• Auto-corrects medical terminology</li>
              <li>• Parses spoken numbers into numeric values</li>
              <li>• Supports voice commands for navigation</li>
              <li>• Continuous dictation mode for longer notes</li>
            </ul>
          </div>
        </Alert>

        {/* Demo Cards */}
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Basic Voice Input Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Voice Inputs</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <VoiceInput
                label="Patient Name"
                value={patientName}
                onChange={setPatientName}
                placeholder="Say the patient's name"
                autoCorrectMedicalTerms={false}
              />

              <VoiceInput
                label="Test Result Value"
                value={testValue}
                onChange={setTestValue}
                placeholder="Say a numeric value (e.g., 'ninety five point five')"
                parseNumbers={true}
                inputType="number"
              />

              <VoiceInput
                label="Clinical Notes"
                value={clinicalNotes}
                onChange={setClinicalNotes}
                placeholder="Dictate clinical observations"
                inputType="textarea"
                continuous={true}
              />
            </CardContent>
          </Card>

          {/* Medical Terminology Demo */}
          <Card>
            <CardHeader>
              <CardTitle>Medical Terminology</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <VoiceInput
                label="Medical History"
                value={medicalHistory}
                onChange={setMedicalHistory}
                placeholder="Try saying: 'Patient has diabetes and hypertension. CBC shows elevated white blood cells.'"
                inputType="textarea"
                autoCorrectMedicalTerms={true}
                continuous={true}
              />

              <div className="bg-gray-50 rounded-lg p-4">
                <h4 className="font-medium text-sm mb-2">Try these medical terms:</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• "hemoglobin" → Hemoglobin</li>
                  <li>• "white blood cells" → WBC</li>
                  <li>• "electrocardiogram" → ECG</li>
                  <li>• "comprehensive metabolic panel" → CMP</li>
                  <li>• "blood pressure" → BP</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Result Entry Demo */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Voice-Guided Result Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              Experience the voice-guided workflow for entering multiple test results.
              You can use voice commands like "next", "previous", "submit", and more.
            </p>
            <Button onClick={() => setMode('result-entry')}>
              <MicrophoneIcon className="h-4 w-4 mr-2" />
              Try Voice Result Entry
            </Button>
          </CardContent>
        </Card>

        {/* Voice Commands Reference */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Voice Commands Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <h4 className="font-medium mb-2">Navigation Commands</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <span className="font-medium">"Next"</span> - Move to next test</li>
                  <li>• <span className="font-medium">"Previous"</span> - Go back to previous test</li>
                  <li>• <span className="font-medium">"Review"</span> - Review all entries</li>
                  <li>• <span className="font-medium">"Submit"</span> - Submit all results</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Action Commands</h4>
                <ul className="space-y-1 text-sm text-gray-600">
                  <li>• <span className="font-medium">"Clear"</span> - Clear current entry</li>
                  <li>• <span className="font-medium">"Cancel"</span> - Exit without saving</li>
                  <li>• <span className="font-medium">"Help"</span> - Show available commands</li>
                  <li>• <span className="font-medium">"Stop"</span> - Stop voice recording</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default VoiceDictationDemo;