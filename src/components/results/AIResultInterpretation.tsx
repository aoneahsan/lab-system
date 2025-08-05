import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Loader } from '@/components/ui/Loader';
import { Alert } from '@/components/ui/Alert';
import { 
  SparklesIcon, 
  ExclamationTriangleIcon, 
  InformationCircleIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BeakerIcon,
  DocumentTextIcon
} from '@heroicons/react/24/outline';
import { aimlService, ResultInterpretation, TrendAnalysis } from '@/services/ai-ml.service';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import type { TestResult } from '@/types/result.types';
import type { TestDefinition } from '@/types/test.types';
import type { Patient } from '@/types/patient.types';

interface AIResultInterpretationProps {
  testResult: TestResult;
  testDefinition: TestDefinition;
  patientHistory?: TestResult[];
  patient?: Patient;
  onFollowUpTest?: (testCode: string) => void;
}

export const AIResultInterpretation: React.FC<AIResultInterpretationProps> = ({
  testResult,
  testDefinition,
  patientHistory,
  patient,
  onFollowUpTest,
}) => {
  const { currentUser } = useAuth();
  const [showFullInterpretation, setShowFullInterpretation] = useState(false);
  const [selectedTab, setSelectedTab] = useState<'interpretation' | 'trends' | 'recommendations'>('interpretation');

  // Fetch AI interpretation
  const { data: interpretation, isLoading: interpretationLoading, error: interpretationError } = useQuery({
    queryKey: ['ai-interpretation', testResult.id],
    queryFn: () => aimlService.interpretTestResults(
      testResult,
      testDefinition,
      patientHistory,
      patient
    ),
    enabled: !!testResult.id && !!testDefinition.id,
    staleTime: 30 * 60 * 1000, // 30 minutes
  });

  // Fetch trend analysis if historical data is available
  const { data: trendAnalysis, isLoading: trendLoading } = useQuery({
    queryKey: ['ai-trend-analysis', patient?.id, testDefinition.code],
    queryFn: () => {
      if (!patient?.id || !patientHistory || patientHistory.length < 3) {
        return null;
      }
      
      const historicalData = patientHistory
        .filter(r => r.testId === testResult.testId)
        .map(r => ({
          date: (r.enteredAt as any).toDate().toISOString(),
          value: typeof r.value === 'string' ? parseFloat(r.value) || 0 : r.value,
        }));

      return aimlService.analyzeTestTrends(
        patient.id,
        testDefinition.code,
        historicalData,
        patient
      );
    },
    enabled: selectedTab === 'trends' && !!patient?.id && !!patientHistory && patientHistory.length >= 3,
  });

  const getConfidenceBadgeColor = (confidence: number) => {
    if (confidence >= 0.9) return 'success';
    if (confidence >= 0.7) return 'warning';
    return 'danger';
  };

  const getAnomalyBadgeColor = (score: number) => {
    if (score >= 0.8) return 'danger';
    if (score >= 0.5) return 'warning';
    return 'success';
  };

  if (interpretationLoading) {
    return (
      <Card className="mt-4">
        <CardContent className="py-8">
          <div className="flex flex-col items-center justify-center space-y-4">
            <SparklesIcon className="h-8 w-8 text-blue-500 animate-pulse" />
            <Loader size="sm" />
            <p className="text-sm text-gray-600">Analyzing result with AI...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (interpretationError) {
    return (
      <Alert variant="destructive" className="mt-4">
        <ExclamationTriangleIcon className="h-5 w-5" />
        <p>Failed to generate AI interpretation. Please try again later.</p>
      </Alert>
    );
  }

  if (!interpretation) {
    return null;
  }

  return (
    <Card className="mt-4">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <SparklesIcon className="h-5 w-5 text-blue-500" />
            AI-Powered Analysis
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant={getConfidenceBadgeColor(interpretation.confidence)}>
              Confidence: {(interpretation.confidence * 100).toFixed(0)}%
            </Badge>
            {interpretation.anomalyScore > 0.5 && (
              <Badge variant={getAnomalyBadgeColor(interpretation.anomalyScore)}>
                Anomaly Score: {(interpretation.anomalyScore * 100).toFixed(0)}%
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Tab Navigation */}
        <div className="flex space-x-1 border-b">
          <button
            onClick={() => setSelectedTab('interpretation')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'interpretation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Interpretation
          </button>
          <button
            onClick={() => setSelectedTab('trends')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'trends'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Trends
          </button>
          <button
            onClick={() => setSelectedTab('recommendations')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              selectedTab === 'recommendations'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Recommendations
          </button>
        </div>

        {/* Tab Content */}
        {selectedTab === 'interpretation' && (
          <div className="space-y-4">
            {/* Main Interpretation */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Clinical Interpretation</h4>
              <p className={`text-gray-700 ${!showFullInterpretation ? 'line-clamp-3' : ''}`}>
                {interpretation.interpretation}
              </p>
              {interpretation.interpretation.length > 150 && (
                <button
                  onClick={() => setShowFullInterpretation(!showFullInterpretation)}
                  className="text-blue-600 hover:text-blue-700 text-sm mt-1"
                >
                  {showFullInterpretation ? 'Show less' : 'Show more'}
                </button>
              )}
            </div>

            {/* Critical Findings */}
            {interpretation.criticalFindings.length > 0 && (
              <Alert variant="destructive">
                <ExclamationTriangleIcon className="h-5 w-5" />
                <div>
                  <p className="font-medium mb-1">Critical Findings:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {interpretation.criticalFindings.map((finding, index) => (
                      <li key={index} className="text-sm">{finding}</li>
                    ))}
                  </ul>
                </div>
              </Alert>
            )}

            {/* Related Conditions */}
            {interpretation.relatedConditions.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Possible Related Conditions</h4>
                <div className="space-y-2">
                  {interpretation.relatedConditions.map((condition, index) => (
                    <div key={index} className="flex items-center justify-between bg-gray-50 p-3 rounded-md">
                      <div>
                        <p className="font-medium">{condition.condition}</p>
                        {condition.icd10Code && (
                          <p className="text-sm text-gray-600">ICD-10: {condition.icd10Code}</p>
                        )}
                      </div>
                      <Badge variant={condition.probability > 0.7 ? 'warning' : 'default'}>
                        {(condition.probability * 100).toFixed(0)}% probability
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'trends' && (
          <div className="space-y-4">
            {trendLoading ? (
              <div className="flex justify-center py-8">
                <Loader size="sm" />
              </div>
            ) : trendAnalysis ? (
              <>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {trendAnalysis.trendDirection === 'increasing' && (
                      <ArrowTrendingUpIcon className="h-5 w-5 text-red-500" />
                    )}
                    {trendAnalysis.trendDirection === 'decreasing' && (
                      <ArrowTrendingDownIcon className="h-5 w-5 text-green-500" />
                    )}
                    <span className="font-medium capitalize">{trendAnalysis.trendDirection} Trend</span>
                  </div>
                  <Badge variant="default">
                    Strength: {(trendAnalysis.trendStrength * 100).toFixed(0)}%
                  </Badge>
                </div>

                <div className="bg-gray-50 p-4 rounded-md">
                  <p className="text-sm font-medium text-gray-700 mb-1">Next Predicted Value:</p>
                  <p className="text-2xl font-bold">
                    {trendAnalysis.prediction.nextValue.toFixed(2)} {testDefinition.unit}
                  </p>
                  <p className="text-sm text-gray-600">
                    95% CI: {trendAnalysis.prediction.confidenceInterval.lower.toFixed(2)} - {' '}
                    {trendAnalysis.prediction.confidenceInterval.upper.toFixed(2)}
                  </p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Trend Insights</h4>
                  <ul className="space-y-2">
                    {trendAnalysis.insights.map((insight, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <InformationCircleIcon className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            ) : (
              <p className="text-gray-600 text-center py-8">
                Not enough historical data for trend analysis (minimum 3 results required)
              </p>
            )}
          </div>
        )}

        {selectedTab === 'recommendations' && (
          <div className="space-y-4">
            {/* General Recommendations */}
            {interpretation.recommendations.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Clinical Recommendations</h4>
                <ul className="space-y-2">
                  {interpretation.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <DocumentTextIcon className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Follow-up Tests */}
            {interpretation.followUpTests.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Recommended Follow-up Tests</h4>
                <div className="space-y-2">
                  {interpretation.followUpTests.map((test, index) => (
                    <div key={index} className="border rounded-md p-3">
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-2">
                          <BeakerIcon className="h-5 w-5 text-blue-500" />
                          <span className="font-medium">{test.testName}</span>
                        </div>
                        <Badge 
                          variant={
                            test.priority === 'urgent' ? 'danger' : 
                            test.priority === 'routine' ? 'warning' : 
                            'default'
                          }
                        >
                          {test.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{test.reason}</p>
                      {onFollowUpTest && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onFollowUpTest(test.testCode)}
                        >
                          Order Test
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="pt-4 border-t">
          <p className="text-xs text-gray-500">
            AI interpretation generated on {new Date().toLocaleString()} 
            {' '}• For clinical decision support only
          </p>
        </div>
      </CardContent>
    </Card>
  );
};