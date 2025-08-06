import * as functions from 'firebase-functions';
import { VertexAI } from '@google-cloud/vertexai';
import config from '../config';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: config.vertexai.projectId,
  location: config.vertexai.location,
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.5,
    topP: 0.9,
    topK: 40,
    maxOutputTokens: 1024,
  },
});

interface TrendAnalysisData {
  patientId: string;
  testCode: string;
  historicalResults: Array<{ date: string; value: number }>;
  patientInfo?: any;
}

export const analyzeTestTrends = functions.https.onCall(async (request: functions.https.CallableRequest<TrendAnalysisData>) => {
  // Check authentication
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { patientId, testCode, historicalResults, patientInfo } = request.data;

  try {
    // Sort results by date
    const sortedResults = [...historicalResults].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Calculate basic statistics
    const values = sortedResults.map(r => r.value);
    const stats = calculateStatistics(values);
    
    // Perform trend analysis
    const trend = analyzeTrend(sortedResults);
    
    // Generate predictions
    const prediction = generatePrediction(sortedResults, trend);
    
    // Get AI insights
    const insights = await generateAIInsights(
      testCode, 
      sortedResults, 
      trend, 
      stats,
      patientInfo
    );

    // Prepare visualization data
    const visualizationData = [
      ...sortedResults.map(r => ({
        date: r.date,
        value: r.value,
        predicted: false,
      })),
      {
        date: prediction.nextDate,
        value: prediction.nextValue,
        predicted: true,
      },
    ];

    return {
      testCode,
      testName: getTestName(testCode), // You'd implement this lookup
      trendDirection: trend.direction,
      trendStrength: trend.strength,
      prediction: {
        nextValue: prediction.nextValue,
        confidenceInterval: prediction.confidenceInterval,
      },
      insights,
      visualizationData,
    };
  } catch (error) {
    console.error('Error analyzing test trends:', error);
    throw new functions.https.HttpsError('internal', 'Failed to analyze test trends');
  }
});

function calculateStatistics(values: number[]) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  const min = Math.min(...values);
  const max = Math.max(...values);
  
  return { mean, stdDev, min, max, n };
}

function analyzeTrend(results: Array<{ date: string; value: number }>) {
  if (results.length < 2) {
    return { direction: 'stable' as const, strength: 0, slope: 0 };
  }

  // Simple linear regression
  const n = results.length;
  const x = results.map((_, i) => i);
  const y = results.map(r => r.value);
  
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared for trend strength
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);
  
  // Determine trend direction
  let direction: 'increasing' | 'decreasing' | 'stable' | 'fluctuating';
  const avgChange = slope * (n - 1); // Total change over period
  const avgValue = sumY / n;
  const percentChange = Math.abs(avgChange / avgValue);
  
  if (rSquared < 0.3) {
    direction = 'fluctuating';
  } else if (percentChange < 0.05) {
    direction = 'stable';
  } else {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  }
  
  return {
    direction,
    strength: rSquared,
    slope,
    intercept,
  };
}

function generatePrediction(
  results: Array<{ date: string; value: number }>,
  trend: ReturnType<typeof analyzeTrend>
) {
  const lastResult = results[results.length - 1];
  const lastDate = new Date(lastResult.date);
  
  // Calculate average time between tests
  const timeDiffs: number[] = [];
  for (let i = 1; i < results.length; i++) {
    const diff = new Date(results[i].date).getTime() - new Date(results[i-1].date).getTime();
    timeDiffs.push(diff);
  }
  const avgTimeDiff = timeDiffs.length > 0 ? 
    timeDiffs.reduce((a, b) => a + b, 0) / timeDiffs.length : 
    30 * 24 * 60 * 60 * 1000; // Default to 30 days
  
  // Predict next date
  const nextDate = new Date(lastDate.getTime() + avgTimeDiff);
  
  // Predict next value using linear regression
  const nextIndex = results.length;
  let nextValue = trend.slope * nextIndex + (trend.intercept || 0);
  
  // Apply some constraints to keep prediction reasonable
  const values = results.map(r => r.value);
  const stats = calculateStatistics(values);
  const maxDeviation = stats.stdDev * 3;
  
  if (nextValue > stats.mean + maxDeviation) {
    nextValue = stats.mean + maxDeviation;
  } else if (nextValue < stats.mean - maxDeviation) {
    nextValue = stats.mean - maxDeviation;
  }
  
  // Calculate confidence interval
  const predictionError = stats.stdDev * Math.sqrt(1 + 1/results.length);
  const confidenceInterval = {
    lower: nextValue - 1.96 * predictionError,
    upper: nextValue + 1.96 * predictionError,
  };
  
  return {
    nextDate: nextDate.toISOString(),
    nextValue,
    confidenceInterval,
  };
}

async function generateAIInsights(
  testCode: string,
  results: Array<{ date: string; value: number }>,
  trend: ReturnType<typeof analyzeTrend>,
  stats: ReturnType<typeof calculateStatistics>,
  patientInfo?: any
): Promise<string[]> {
  const prompt = `Analyze the following laboratory test trend data and provide 3-5 clinical insights.

Test Code: ${testCode}
Number of Results: ${results.length}
Time Period: ${new Date(results[0].date).toLocaleDateString()} to ${new Date(results[results.length - 1].date).toLocaleDateString()}
Trend Direction: ${trend.direction}
Trend Strength: ${(trend.strength * 100).toFixed(1)}%
Mean Value: ${stats.mean.toFixed(2)}
Standard Deviation: ${stats.stdDev.toFixed(2)}
Range: ${stats.min.toFixed(2)} - ${stats.max.toFixed(2)}

Values over time:
${results.map(r => `${new Date(r.date).toLocaleDateString()}: ${r.value}`).join('\n')}

${patientInfo ? `Patient Age: ${calculateAge(new Date(patientInfo.dateOfBirth))} years, Gender: ${patientInfo.gender}` : ''}

Provide insights as a JSON array of strings, focusing on:
1. Clinical significance of the trend
2. Potential causes or implications
3. Monitoring recommendations
4. When to be concerned

Format: ["insight1", "insight2", "insight3"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating AI insights:', error);
  }

  // Fallback insights based on trend
  const fallbackInsights: string[] = [];
  
  if (trend.direction === 'increasing') {
    fallbackInsights.push(`Values show a consistent upward trend with ${(trend.strength * 100).toFixed(0)}% confidence`);
    if (trend.strength > 0.7) {
      fallbackInsights.push('Strong increasing trend warrants close monitoring and potential intervention');
    }
  } else if (trend.direction === 'decreasing') {
    fallbackInsights.push(`Values show a downward trend with ${(trend.strength * 100).toFixed(0)}% confidence`);
  } else if (trend.direction === 'fluctuating') {
    fallbackInsights.push('Values show significant variability without a clear trend');
    fallbackInsights.push('Consider more frequent monitoring to establish a pattern');
  } else {
    fallbackInsights.push('Values remain relatively stable over the observation period');
  }
  
  // Add statistical insight
  const cv = (stats.stdDev / stats.mean) * 100;
  if (cv > 20) {
    fallbackInsights.push(`High variability (CV: ${cv.toFixed(1)}%) suggests need for investigation of pre-analytical factors`);
  }
  
  return fallbackInsights;
}

function getTestName(testCode: string): string {
  // This would be replaced with actual test name lookup
  const testNames: Record<string, string> = {
    'GLU': 'Glucose',
    'HGB': 'Hemoglobin',
    'WBC': 'White Blood Cell Count',
    'PLT': 'Platelet Count',
    'CREAT': 'Creatinine',
    'ALT': 'Alanine Aminotransferase',
    'TSH': 'Thyroid Stimulating Hormone',
    // Add more mappings as needed
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