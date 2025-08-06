import { functions } from '@/config/firebase.config';
import { httpsCallable } from 'firebase/functions';
import { trackingInstance } from '@/providers/TrackingProvider';
import type { TestResult } from '@/types/result.types';
import type { TestDefinition } from '@/types/test.types';
import type { Patient } from '@/types/patient.types';

// Types for AI/ML predictions and analysis
export interface ResultInterpretation {
  id: string;
  testResultId: string;
  interpretation: string;
  confidence: number;
  anomalyScore: number;
  criticalFindings: string[];
  recommendations: string[];
  relatedConditions: Array<{
    condition: string;
    probability: number;
    icd10Code?: string;
  }>;
  followUpTests: Array<{
    testCode: string;
    testName: string;
    reason: string;
    priority: 'urgent' | 'routine' | 'optional';
  }>;
  generatedAt: Date;
}

export interface TrendAnalysis {
  testCode: string;
  testName: string;
  trendDirection: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  trendStrength: number; // 0-1
  prediction: {
    nextValue: number;
    confidenceInterval: {
      lower: number;
      upper: number;
    };
  };
  insights: string[];
  visualizationData: Array<{
    date: Date;
    value: number;
    predicted?: boolean;
  }>;
}

export interface PatientRiskAssessment {
  patientId: string;
  overallRiskScore: number; // 0-100
  riskFactors: Array<{
    factor: string;
    impact: 'high' | 'medium' | 'low';
    score: number;
    description: string;
  }>;
  healthAlerts: Array<{
    severity: 'critical' | 'warning' | 'info';
    message: string;
    actionRequired: string;
  }>;
  preventiveMeasures: string[];
  monitoringPlan: {
    frequency: string;
    tests: string[];
    targetMetrics: Record<string, { min: number; max: number }>;
  };
}

export interface QualityControlPrediction {
  testCode: string;
  predictedQCResult: 'pass' | 'fail' | 'warning';
  confidence: number;
  predictedValues: {
    level1: number;
    level2: number;
    level3?: number;
  };
  recommendations: string[];
  maintenanceAlert?: {
    equipmentId: string;
    message: string;
    priority: 'urgent' | 'scheduled';
  };
}

// Firebase callable functions
const interpretResultsFunction = httpsCallable<
  {
    testResult: TestResult;
    testDefinition: TestDefinition;
    patientHistory?: TestResult[];
    patientInfo?: Partial<Patient>;
  },
  ResultInterpretation
>(functions, 'interpretTestResults');

const analyzeTrendsFunction = httpsCallable<
  {
    patientId: string;
    testCode: string;
    historicalResults: Array<{ date: string; value: number }>;
    patientInfo?: Partial<Patient>;
  },
  TrendAnalysis
>(functions, 'analyzeTestTrends');

const assessPatientRiskFunction = httpsCallable<
  {
    patientId: string;
    recentResults: TestResult[];
    patientInfo: Partial<Patient>;
    medicalHistory?: any[];
  },
  PatientRiskAssessment
>(functions, 'assessPatientRisk');

const predictQCResultsFunction = httpsCallable<
  {
    testCode: string;
    historicalQCData: any[];
    equipmentInfo?: any;
  },
  QualityControlPrediction
>(functions, 'predictQCResults');

class AIMLService {
  // Interpret test results using AI
  async interpretTestResults(
    testResult: TestResult,
    testDefinition: TestDefinition,
    patientHistory?: TestResult[],
    patientInfo?: Partial<Patient>
  ): Promise<ResultInterpretation> {
    const startTime = Date.now();
    
    try {
      trackingInstance.trackEvent('ai_interpretation_started', {
        testCode: testDefinition.code,
        testResultId: testResult.id,
        hasHistory: !!patientHistory?.length,
      });

      const result = await interpretResultsFunction({
        testResult,
        testDefinition,
        patientHistory,
        patientInfo,
      });

      const interpretation = {
        ...result.data,
        generatedAt: new Date(result.data.generatedAt),
      };

      const duration = Date.now() - startTime;
      trackingInstance.trackEvent('ai_interpretation_completed', {
        testCode: testDefinition.code,
        testResultId: testResult.id,
        confidence: interpretation.confidence,
        anomalyScore: interpretation.anomalyScore,
        duration,
      });
      trackingInstance.trackMetric('ai_interpretation_time', duration, 'ms');

      return interpretation;
    } catch (error) {
      trackingInstance.trackEvent('ai_interpretation_failed', {
        testCode: testDefinition.code,
        error: (error as Error).message,
        duration: Date.now() - startTime,
      });
      console.error('AI interpretation error:', error, { 
        context: 'ai_interpretation',
        testCode: testDefinition.code,
      });
      throw error;
    }
  }

  // Analyze trends in patient test results
  async analyzeTestTrends(
    patientId: string,
    testCode: string,
    historicalResults: Array<{ date: string; value: number }>,
    patientInfo?: Partial<Patient>
  ): Promise<TrendAnalysis> {
    const startTime = Date.now();

    try {
      trackingInstance.trackEvent('ai_trend_analysis_started', {
        patientId,
        testCode,
        dataPoints: historicalResults.length,
      });

      const result = await analyzeTrendsFunction({
        patientId,
        testCode,
        historicalResults,
        patientInfo,
      });

      const analysis = {
        ...result.data,
        visualizationData: result.data.visualizationData.map(point => ({
          ...point,
          date: new Date(point.date),
        })),
      };

      const duration = Date.now() - startTime;
      trackingInstance.trackEvent('ai_trend_analysis_completed', {
        patientId,
        testCode,
        trendDirection: analysis.trendDirection,
        duration,
      });

      return analysis;
    } catch (error) {
      trackingInstance.trackEvent('ai_trend_analysis_failed', {
        patientId,
        testCode,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Assess patient health risks based on test results
  async assessPatientRisk(
    patientId: string,
    recentResults: TestResult[],
    patientInfo: Partial<Patient>,
    medicalHistory?: any[]
  ): Promise<PatientRiskAssessment> {
    const startTime = Date.now();

    try {
      trackingInstance.trackEvent('ai_risk_assessment_started', {
        patientId,
        resultCount: recentResults.length,
      });

      const result = await assessPatientRiskFunction({
        patientId,
        recentResults,
        patientInfo,
        medicalHistory,
      });

      const duration = Date.now() - startTime;
      trackingInstance.trackEvent('ai_risk_assessment_completed', {
        patientId,
        riskScore: result.data.overallRiskScore,
        alertCount: result.data.healthAlerts.length,
        duration,
      });

      return result.data;
    } catch (error) {
      trackingInstance.trackEvent('ai_risk_assessment_failed', {
        patientId,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Predict quality control results
  async predictQCResults(
    testCode: string,
    historicalQCData: any[],
    equipmentInfo?: any
  ): Promise<QualityControlPrediction> {
    try {
      trackingInstance.trackEvent('ai_qc_prediction_started', {
        testCode,
        dataPoints: historicalQCData.length,
      });

      const result = await predictQCResultsFunction({
        testCode,
        historicalQCData,
        equipmentInfo,
      });

      trackingInstance.trackEvent('ai_qc_prediction_completed', {
        testCode,
        prediction: result.data.predictedQCResult,
        confidence: result.data.confidence,
      });

      return result.data;
    } catch (error) {
      trackingInstance.trackEvent('ai_qc_prediction_failed', {
        testCode,
        error: (error as Error).message,
      });
      throw error;
    }
  }

  // Check if a result value is anomalous
  isAnomalous(value: number, normalRange: { min: number; max: number }, historicalValues?: number[]): boolean {
    // Basic anomaly detection
    if (value < normalRange.min || value > normalRange.max) {
      return true;
    }

    // Statistical anomaly detection if historical data is available
    if (historicalValues && historicalValues.length >= 5) {
      const mean = historicalValues.reduce((a, b) => a + b, 0) / historicalValues.length;
      const stdDev = Math.sqrt(
        historicalValues.reduce((sq, n) => sq + Math.pow(n - mean, 2), 0) / historicalValues.length
      );
      
      // Check if value is more than 3 standard deviations from the mean
      if (Math.abs(value - mean) > 3 * stdDev) {
        return true;
      }
    }

    return false;
  }

  // Get AI-powered suggestions for result validation
  async getValidationSuggestions(
    testResult: TestResult,
    testDefinition: TestDefinition
  ): Promise<string[]> {
    const suggestions: string[] = [];

    // Check for critical values
    if (testResult.flag === 'critical_high' || testResult.flag === 'critical_low') {
      suggestions.push('Critical value detected - immediate physician notification required');
      suggestions.push('Recommend repeat testing to confirm critical result');
    }

    // Check for significant changes from previous results
    // TODO: Implement delta change tracking
    // if (testResult.deltaChange && Math.abs(testResult.deltaChange) > 50) {
    //   suggestions.push(`Significant change detected (${testResult.deltaChange > 0 ? '+' : ''}${testResult.deltaChange}%)`);
    //   suggestions.push('Review patient medication and clinical status');
    // }

    // Check for result patterns
    if (testResult.value && testDefinition.referenceRanges?.length) {
      const refRange = testDefinition.referenceRanges[0];
      const min = refRange.normalMin || 0;
      const max = refRange.normalMax || 100;
      const midpoint = (min + max) / 2;
      const range = max - min;
      
      const numValue = typeof testResult.value === 'string' ? parseFloat(testResult.value) : testResult.value;
      if (!isNaN(numValue) && Math.abs(numValue - midpoint) > range * 0.9) {
        suggestions.push('Result near extreme of reference range');
      }
    }

    return suggestions;
  }
}

export const aimlService = new AIMLService();