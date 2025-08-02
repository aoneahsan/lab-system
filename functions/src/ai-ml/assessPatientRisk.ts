import * as functions from 'firebase-functions';
import { VertexAI } from '@google-cloud/vertexai';
import { projectId } from '../config';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: projectId,
  location: 'us-central1',
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.6,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

interface PatientRiskData {
  patientId: string;
  recentResults: any[];
  patientInfo: any;
  medicalHistory?: any[];
}

export const assessPatientRisk = functions.https.onCall(async (data: PatientRiskData, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { patientId, recentResults, patientInfo, medicalHistory } = data;

  try {
    // Analyze test results for risk factors
    const testRiskFactors = analyzeTestResults(recentResults);
    
    // Analyze patient demographics for risk
    const demographicRiskFactors = analyzeDemographics(patientInfo);
    
    // Analyze medical history
    const historyRiskFactors = medicalHistory ? analyzeMedicalHistory(medicalHistory) : [];
    
    // Combine all risk factors
    const allRiskFactors = [...testRiskFactors, ...demographicRiskFactors, ...historyRiskFactors];
    
    // Calculate overall risk score
    const overallRiskScore = calculateOverallRiskScore(allRiskFactors);
    
    // Generate health alerts
    const healthAlerts = generateHealthAlerts(allRiskFactors, recentResults);
    
    // Get AI-powered assessment
    const aiAssessment = await generateAIRiskAssessment(
      patientInfo,
      recentResults,
      allRiskFactors,
      medicalHistory
    );
    
    // Generate monitoring plan
    const monitoringPlan = generateMonitoringPlan(allRiskFactors, overallRiskScore);

    return {
      patientId,
      overallRiskScore,
      riskFactors: allRiskFactors.slice(0, 10), // Top 10 risk factors
      healthAlerts,
      preventiveMeasures: aiAssessment.preventiveMeasures,
      monitoringPlan,
    };
  } catch (error) {
    console.error('Error assessing patient risk:', error);
    throw new functions.https.HttpsError('internal', 'Failed to assess patient risk');
  }
});

function analyzeTestResults(results: any[]): any[] {
  const riskFactors: any[] = [];
  
  // Group results by test code
  const resultsByTest: Record<string, any[]> = {};
  results.forEach(result => {
    if (!resultsByTest[result.testCode]) {
      resultsByTest[result.testCode] = [];
    }
    resultsByTest[result.testCode].push(result);
  });
  
  // Analyze each test type
  Object.entries(resultsByTest).forEach(([testCode, testResults]) => {
    const latestResult = testResults[0]; // Assuming sorted by date
    const testName = getTestName(testCode);
    
    // Check for critical values
    if (latestResult.flag === 'critical_high' || latestResult.flag === 'critical_low') {
      riskFactors.push({
        factor: `Critical ${testName} Level`,
        impact: 'high',
        score: 30,
        description: `${testName} is at a critical level (${latestResult.value} ${latestResult.unit})`,
      });
    }
    
    // Check for persistent abnormal values
    const abnormalCount = testResults.filter(r => r.flag && r.flag !== 'normal').length;
    if (abnormalCount >= 3) {
      riskFactors.push({
        factor: `Persistent Abnormal ${testName}`,
        impact: 'medium',
        score: 20,
        description: `${testName} has been abnormal in ${abnormalCount} recent tests`,
      });
    }
    
    // Check for rapid changes
    if (testResults.length >= 2) {
      const change = Math.abs(testResults[0].value - testResults[1].value);
      const percentChange = (change / testResults[1].value) * 100;
      
      if (percentChange > 50) {
        riskFactors.push({
          factor: `Rapid ${testName} Change`,
          impact: 'high',
          score: 25,
          description: `${testName} changed by ${percentChange.toFixed(0)}% since last test`,
        });
      }
    }
  });
  
  // Check for specific high-risk combinations
  checkHighRiskCombinations(resultsByTest, riskFactors);
  
  return riskFactors;
}

function analyzeDemographics(patientInfo: any): any[] {
  const riskFactors: any[] = [];
  const age = calculateAge(new Date(patientInfo.dateOfBirth));
  
  // Age-related risks
  if (age >= 65) {
    riskFactors.push({
      factor: 'Advanced Age',
      impact: 'medium',
      score: 15,
      description: `Patient is ${age} years old, requiring adjusted reference ranges and monitoring`,
    });
  }
  
  // Gender-specific risks (placeholder - would need more specific logic)
  if (patientInfo.gender === 'female' && age >= 50) {
    riskFactors.push({
      factor: 'Post-menopausal Risk Factors',
      impact: 'low',
      score: 10,
      description: 'Consider hormone-related health screenings',
    });
  }
  
  return riskFactors;
}

function analyzeMedicalHistory(history: any[]): any[] {
  const riskFactors: any[] = [];
  
  // Count chronic conditions
  const chronicConditions = history.filter(h => h.isChronicCondition);
  if (chronicConditions.length > 0) {
    riskFactors.push({
      factor: 'Multiple Chronic Conditions',
      impact: chronicConditions.length >= 3 ? 'high' : 'medium',
      score: chronicConditions.length * 10,
      description: `Patient has ${chronicConditions.length} chronic conditions requiring ongoing management`,
    });
  }
  
  return riskFactors;
}

function checkHighRiskCombinations(resultsByTest: Record<string, any[]>, riskFactors: any[]) {
  // Diabetes risk pattern
  if (resultsByTest['GLU'] && resultsByTest['HBA1C']) {
    const glucoseHigh = resultsByTest['GLU'].some(r => r.flag === 'high' || r.flag === 'critical_high');
    const hba1cHigh = resultsByTest['HBA1C'].some(r => r.value > 6.5);
    
    if (glucoseHigh && hba1cHigh) {
      riskFactors.push({
        factor: 'Diabetes Risk Pattern',
        impact: 'high',
        score: 35,
        description: 'Elevated glucose and HbA1c indicate possible diabetes',
      });
    }
  }
  
  // Kidney disease pattern
  if (resultsByTest['CREAT'] && resultsByTest['BUN']) {
    const creatHigh = resultsByTest['CREAT'].some(r => r.flag === 'high');
    const bunHigh = resultsByTest['BUN'].some(r => r.flag === 'high');
    
    if (creatHigh && bunHigh) {
      riskFactors.push({
        factor: 'Kidney Function Concern',
        impact: 'high',
        score: 30,
        description: 'Elevated creatinine and BUN suggest impaired kidney function',
      });
    }
  }
  
  // Cardiovascular risk pattern
  if (resultsByTest['CHOL'] && resultsByTest['TRIG']) {
    const cholHigh = resultsByTest['CHOL'].some(r => r.value > 240);
    const trigHigh = resultsByTest['TRIG'].some(r => r.value > 200);
    
    if (cholHigh || trigHigh) {
      riskFactors.push({
        factor: 'Cardiovascular Risk',
        impact: 'medium',
        score: 25,
        description: 'Lipid profile indicates increased cardiovascular risk',
      });
    }
  }
}

function calculateOverallRiskScore(riskFactors: any[]): number {
  if (riskFactors.length === 0) return 0;
  
  // Sum weighted scores
  const totalScore = riskFactors.reduce((sum, factor) => sum + factor.score, 0);
  
  // Normalize to 0-100 scale
  // Assuming max possible score is around 200
  const normalizedScore = Math.min((totalScore / 200) * 100, 100);
  
  return Math.round(normalizedScore);
}

function generateHealthAlerts(riskFactors: any[], recentResults: any[]): any[] {
  const alerts: any[] = [];
  
  // Critical value alerts
  const criticalResults = recentResults.filter(r => 
    r.flag === 'critical_high' || r.flag === 'critical_low'
  );
  
  criticalResults.forEach(result => {
    alerts.push({
      severity: 'critical',
      message: `Critical ${getTestName(result.testCode)} value: ${result.value} ${result.unit}`,
      actionRequired: 'Immediate physician notification required',
    });
  });
  
  // High risk factor alerts
  const highRiskFactors = riskFactors.filter(f => f.impact === 'high');
  highRiskFactors.forEach(factor => {
    alerts.push({
      severity: 'warning',
      message: factor.factor,
      actionRequired: factor.description,
    });
  });
  
  // Trending alerts
  const mediumRiskFactors = riskFactors.filter(f => f.impact === 'medium');
  if (mediumRiskFactors.length >= 3) {
    alerts.push({
      severity: 'info',
      message: 'Multiple moderate risk factors detected',
      actionRequired: 'Schedule comprehensive health review',
    });
  }
  
  return alerts.slice(0, 5); // Limit to top 5 alerts
}

async function generateAIRiskAssessment(
  patientInfo: any,
  recentResults: any[],
  riskFactors: any[],
  medicalHistory?: any[]
): Promise<{ preventiveMeasures: string[] }> {
  const age = calculateAge(new Date(patientInfo.dateOfBirth));
  
  const prompt = `Based on the following patient data, provide 5 specific preventive health measures:

Patient: ${age} year old ${patientInfo.gender}
Risk Factors: ${riskFactors.map(f => f.factor).join(', ')}
Recent Abnormal Tests: ${recentResults.filter(r => r.flag && r.flag !== 'normal').map(r => `${r.testCode}: ${r.value}`).join(', ')}
${medicalHistory ? `Medical History: ${medicalHistory.map(h => h.condition).join(', ')}` : ''}

Provide practical, actionable preventive measures as a JSON array of strings.
Format: ["measure1", "measure2", "measure3", "measure4", "measure5"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return { preventiveMeasures: JSON.parse(jsonMatch[0]) };
    }
  } catch (error) {
    console.error('Error generating AI assessment:', error);
  }
  
  // Fallback measures
  return {
    preventiveMeasures: [
      'Schedule regular health check-ups every 3-6 months',
      'Maintain a balanced diet low in processed foods',
      'Engage in moderate physical activity for at least 150 minutes per week',
      'Monitor blood pressure and glucose levels regularly',
      'Ensure adequate sleep (7-8 hours) and stress management',
    ],
  };
}

function generateMonitoringPlan(riskFactors: any[], riskScore: number): any {
  let frequency = 'quarterly';
  const tests: string[] = [];
  const targetMetrics: Record<string, { min: number; max: number }> = {};
  
  // Determine monitoring frequency based on risk score
  if (riskScore >= 70) {
    frequency = 'monthly';
  } else if (riskScore >= 40) {
    frequency = 'bi-monthly';
  }
  
  // Add tests based on risk factors
  riskFactors.forEach(factor => {
    if (factor.factor.includes('Glucose') || factor.factor.includes('Diabetes')) {
      tests.push('GLU', 'HBA1C');
      targetMetrics['GLU'] = { min: 70, max: 100 };
      targetMetrics['HBA1C'] = { min: 4, max: 5.6 };
    }
    
    if (factor.factor.includes('Kidney')) {
      tests.push('CREAT', 'BUN', 'EGFR');
      targetMetrics['CREAT'] = { min: 0.6, max: 1.2 };
      targetMetrics['BUN'] = { min: 7, max: 20 };
    }
    
    if (factor.factor.includes('Cardiovascular')) {
      tests.push('LIPID', 'CHOL', 'TRIG', 'HDL', 'LDL');
      targetMetrics['CHOL'] = { min: 0, max: 200 };
      targetMetrics['TRIG'] = { min: 0, max: 150 };
    }
  });
  
  // Add basic monitoring tests if risk score is moderate or higher
  if (riskScore >= 30 && tests.length === 0) {
    tests.push('CBC', 'CMP', 'LIPID');
  }
  
  return {
    frequency,
    tests: [...new Set(tests)], // Remove duplicates
    targetMetrics,
  };
}

function getTestName(testCode: string): string {
  const testNames: Record<string, string> = {
    'GLU': 'Glucose',
    'HBA1C': 'Hemoglobin A1c',
    'CREAT': 'Creatinine',
    'BUN': 'Blood Urea Nitrogen',
    'CHOL': 'Cholesterol',
    'TRIG': 'Triglycerides',
    'HDL': 'HDL Cholesterol',
    'LDL': 'LDL Cholesterol',
    'CBC': 'Complete Blood Count',
    'CMP': 'Comprehensive Metabolic Panel',
    // Add more as needed
  };
  
  return testNames[testCode] || testCode;
}

function calculateAge(birthDate: Date): number {
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  
  return age;
}