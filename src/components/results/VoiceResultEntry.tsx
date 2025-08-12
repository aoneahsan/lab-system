import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { VoiceInput } from '@/components/common/VoiceInput';
import { useVoiceCommands } from '@/hooks/useVoiceDictation';
import { 
  MicrophoneIcon, 
  CheckIcon, 
  XMarkIcon,
  InformationCircleIcon,
  ArrowRightIcon,
  ArrowLeftIcon 
} from '@heroicons/react/24/outline';
import { toast } from 'sonner';
import type { TestDefinition } from '@/types/test.types';
import type { TestResult } from '@/types/result.types';

interface VoiceResultEntryProps {
  testDefinitions: TestDefinition[];
  onSubmit: (results: Partial<TestResult>[]) => void;
  onCancel: () => void;
  patientName?: string;
}

interface ResultEntry {
  testCode: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: { min: number; max: number };
  flag?: string;
  notes?: string;
}

export const VoiceResultEntry: React.FC<VoiceResultEntryProps> = ({
  testDefinitions,
  onSubmit,
  onCancel,
  patientName,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<ResultEntry[]>(
    testDefinitions.map(def => ({
      testCode: def.code,
      testName: def.name,
      value: '',
      unit: def.unit || '',
      referenceRange: def.referenceRanges?.[0] ? { 
        min: def.referenceRanges[0].normalMin || 0, 
        max: def.referenceRanges[0].normalMax || 100 
      } : { min: 0, max: 100 },
      notes: '',
    }))
  );
  const [isReviewMode, setIsReviewMode] = useState(false);

  const currentTest = results[currentIndex];

  // Voice commands for navigation and actions
  useVoiceCommands([
    {
      command: 'next',
      action: () => handleNext(),
      pattern: /next|forward|continue/i,
    },
    {
      command: 'previous',
      action: () => handlePrevious(),
      pattern: /previous|back|go back/i,
    },
    {
      command: 'submit',
      action: () => handleSubmitAll(),
      pattern: /submit|save|done|finish/i,
    },
    {
      command: 'cancel',
      action: () => onCancel(),
      pattern: /cancel|exit|stop/i,
    },
    {
      command: 'review',
      action: () => setIsReviewMode(true),
      pattern: /review|check|verify/i,
    },
    {
      command: 'clear',
      action: () => handleClearCurrent(),
      pattern: /clear|delete|remove/i,
    },
    {
      command: 'help',
      action: () => showVoiceCommands(),
      pattern: /help|commands|what can i say/i,
    },
  ]);

  const handleValueChange = (value: string) => {
    const updatedResults = [...results];
    updatedResults[currentIndex].value = value;
    
    // Auto-calculate flag based on reference range
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      const { min, max } = currentTest.referenceRange;
      if (numValue < min) {
        updatedResults[currentIndex].flag = 'low';
      } else if (numValue > max) {
        updatedResults[currentIndex].flag = 'high';
      } else {
        updatedResults[currentIndex].flag = 'normal';
      }
    }
    
    setResults(updatedResults);
  };

  const handleNotesChange = (notes: string) => {
    const updatedResults = [...results];
    updatedResults[currentIndex].notes = notes;
    setResults(updatedResults);
  };

  const handleNext = () => {
    if (currentIndex < results.length - 1) {
      setCurrentIndex(currentIndex + 1);
      toast.info(`Moving to ${results[currentIndex + 1].testName}`);
    } else {
      setIsReviewMode(true);
      toast.info('All tests completed. Review your entries.');
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      toast.info(`Moving to ${results[currentIndex - 1].testName}`);
    }
  };

  const handleClearCurrent = () => {
    const updatedResults = [...results];
    updatedResults[currentIndex].value = '';
    updatedResults[currentIndex].notes = '';
    updatedResults[currentIndex].flag = undefined;
    setResults(updatedResults);
    toast.success('Cleared current entry');
  };

  const handleSubmitAll = () => {
    // Validate all results have values
    const incompleteTests = results.filter(r => !r.value);
    if (incompleteTests.length > 0) {
      toast.error(`Please complete all tests. ${incompleteTests.length} tests remaining.`);
      return;
    }

    // Convert to TestResult format
    const testResults: Partial<TestResult>[] = results.map(r => ({
      testName: r.testName,
      value: r.value,
      unit: r.unit,
      flag: r.flag as TestResult['flag'],
      comments: r.notes,
    }));

    onSubmit(testResults);
    toast.success('Results submitted successfully');
  };

  const showVoiceCommands = () => {
    toast.info(
      <div className="space-y-1">
        <p className="font-medium">Voice Commands:</p>
        <ul className="text-sm space-y-1">
          <li>• Say "next" to move to next test</li>
          <li>• Say "previous" to go back</li>
          <li>• Say "clear" to clear current entry</li>
          <li>• Say "review" to review all entries</li>
          <li>• Say "submit" when done</li>
          <li>• Say "cancel" to exit</li>
        </ul>
      </div>,
      { duration: 8000 }
    );
  };

  const getProgressPercentage = () => {
    const completedCount = results.filter(r => r.value).length;
    return (completedCount / results.length) * 100;
  };

  const getFlagBadgeVariant = (flag?: string) => {
    switch (flag) {
      case 'high':
      case 'low':
        return 'warning';
      case 'critical_high':
      case 'critical_low':
        return 'danger';
      default:
        return 'success';
    }
  };

  if (isReviewMode) {
    return (
      <Card className="max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle>Review Results</CardTitle>
          {patientName && (
            <p className="text-sm text-gray-600">Patient: {patientName}</p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="max-h-96 overflow-y-auto space-y-3">
            {results.map((result, index) => (
              <div
                key={result.testCode}
                className="border rounded-lg p-4 hover:bg-gray-50 cursor-pointer"
                onClick={() => {
                  setCurrentIndex(index);
                  setIsReviewMode(false);
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">{result.testName}</h4>
                  {result.flag && (
                    <Badge variant={getFlagBadgeVariant(result.flag)}>
                      {result.flag}
                    </Badge>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-600">Value: </span>
                    <span className="font-medium">
                      {result.value || '-'} {result.unit}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-600">Range: </span>
                    <span className="font-medium">
                      {result.referenceRange.min} - {result.referenceRange.max} {result.unit}
                    </span>
                  </div>
                </div>
                {result.notes && (
                  <p className="text-sm text-gray-600 mt-2">
                    Notes: {result.notes}
                  </p>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => setIsReviewMode(false)}
            >
              Continue Editing
            </Button>
            <div className="space-x-2">
              <Button variant="outline" onClick={onCancel}>
                Cancel
              </Button>
              <Button onClick={handleSubmitAll}>
                <CheckIcon className="h-4 w-4 mr-2" />
                Submit All Results
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MicrophoneIcon className="h-5 w-5" />
            Voice Result Entry
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={showVoiceCommands}
          >
            <InformationCircleIcon className="h-4 w-4 mr-1" />
            Voice Commands
          </Button>
        </div>
        {patientName && (
          <p className="text-sm text-gray-600">Patient: {patientName}</p>
        )}
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>Test {currentIndex + 1} of {results.length}</span>
            <span>{Math.round(getProgressPercentage())}% complete</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${getProgressPercentage()}%` }}
            />
          </div>
        </div>

        {/* Current test */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-medium mb-2">{currentTest.testName}</h3>
          <p className="text-sm text-gray-600">
            Test Code: {currentTest.testCode}
          </p>
          <p className="text-sm text-gray-600">
            Reference Range: {currentTest.referenceRange.min} - {currentTest.referenceRange.max} {currentTest.unit}
          </p>
        </div>

        {/* Voice input for value */}
        <VoiceInput
          label="Result Value"
          value={currentTest.value}
          onChange={handleValueChange}
          placeholder={`Enter value in ${currentTest.unit}`}
          parseNumbers={true}
          autoCorrectMedicalTerms={false}
          required
        />

        {/* Show flag if value is out of range */}
        {currentTest.flag && currentTest.flag !== 'normal' && (
          <Badge
            variant={getFlagBadgeVariant(currentTest.flag)}
            className="w-full justify-center py-2"
          >
            Value is {currentTest.flag}
          </Badge>
        )}

        {/* Voice input for notes */}
        <VoiceInput
          label="Notes (optional)"
          value={currentTest.notes || ''}
          onChange={handleNotesChange}
          placeholder="Add any clinical notes"
          inputType="textarea"
          autoCorrectMedicalTerms={true}
        />

        {/* Navigation buttons */}
        <div className="flex justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
          >
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Previous
          </Button>
          
          <div className="space-x-2">
            <Button variant="outline" onClick={onCancel}>
              <XMarkIcon className="h-4 w-4 mr-2" />
              Cancel
            </Button>
            
            {currentIndex === results.length - 1 ? (
              <Button onClick={() => setIsReviewMode(true)}>
                Review Results
              </Button>
            ) : (
              <Button onClick={handleNext}>
                Next
                <ArrowRightIcon className="h-4 w-4 ml-2" />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};