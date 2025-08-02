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
    temperature: 0.4, // Lower temperature for more accurate predictions
    topP: 0.85,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

interface TestVolumeData {
  date: string;
  testCode: string;
  count: number;
}

interface ForecastRequest {
  historicalData: TestVolumeData[];
  forecastDays: number;
  testCodes?: string[];
}

export const predictTestVolumes = functions.https.onCall(async (data: ForecastRequest, context) => {
  // Check authentication
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { historicalData, forecastDays, testCodes } = data;

  try {
    // Group data by test code
    const dataByTest: Record<string, Array<{ date: string; count: number }>> = {};
    
    historicalData.forEach(item => {
      if (!testCodes || testCodes.includes(item.testCode)) {
        if (!dataByTest[item.testCode]) {
          dataByTest[item.testCode] = [];
        }
        dataByTest[item.testCode].push({
          date: item.date,
          count: item.count
        });
      }
    });

    // Generate forecasts for each test
    const forecasts = await Promise.all(
      Object.entries(dataByTest).map(async ([testCode, data]) => {
        const sortedData = data.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calculate basic statistics
        const counts = sortedData.map(d => d.count);
        const stats = calculateStatistics(counts);
        
        // Detect trend and seasonality
        const trend = detectTrend(sortedData);
        const seasonality = detectSeasonality(sortedData);
        
        // Generate time series forecast
        const predictions = generateForecast(sortedData, forecastDays, trend, seasonality);
        
        // Calculate growth rate
        const recentAvg = counts.slice(-7).reduce((a, b) => a + b, 0) / 7;
        const growthRate = trend.slope * 30; // Monthly growth
        
        // Get AI-powered insights
        const recommendations = await generateRecommendations(
          testCode,
          sortedData,
          predictions,
          stats,
          trend
        );

        return {
          testCode,
          testName: getTestName(testCode),
          currentMonthVolume: Math.round(recentAvg * 30),
          nextMonthPrediction: Math.round((recentAvg + growthRate) * 30),
          growthRate: (growthRate / recentAvg) * 100,
          predictions: {
            predictions,
            trend: trend.direction,
            seasonality: seasonality.pattern ? {
              pattern: seasonality.pattern,
              strength: seasonality.strength
            } : undefined
          },
          recommendations
        };
      })
    );

    return { forecasts };
  } catch (error) {
    console.error('Error predicting test volumes:', error);
    throw new functions.https.HttpsError('internal', 'Failed to predict test volumes');
  }
});

function calculateStatistics(values: number[]) {
  const n = values.length;
  const mean = values.reduce((a, b) => a + b, 0) / n;
  const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / n;
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev, min: Math.min(...values), max: Math.max(...values) };
}

function detectTrend(data: Array<{ date: string; count: number }>) {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data.map(d => d.count);
  
  // Linear regression
  const sumX = x.reduce((a, b) => a + b, 0);
  const sumY = y.reduce((a, b) => a + b, 0);
  const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
  
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;
  
  // Calculate R-squared
  const yMean = sumY / n;
  const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
  const ssResidual = y.reduce((sum, yi, i) => {
    const predicted = slope * i + intercept;
    return sum + Math.pow(yi - predicted, 2);
  }, 0);
  const rSquared = 1 - (ssResidual / ssTotal);
  
  let direction: 'increasing' | 'decreasing' | 'stable';
  if (Math.abs(slope) < 0.1 || rSquared < 0.3) {
    direction = 'stable';
  } else {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  }
  
  return { direction, slope, intercept, strength: rSquared };
}

function detectSeasonality(data: Array<{ date: string; count: number }>) {
  if (data.length < 14) {
    return { pattern: null, strength: 0 };
  }
  
  // Check for weekly pattern (7-day cycle)
  const weeklyPattern = checkCyclicPattern(data.map(d => d.count), 7);
  
  if (weeklyPattern.strength > 0.5) {
    return { pattern: 'weekly' as const, strength: weeklyPattern.strength };
  }
  
  // Check for monthly pattern if enough data
  if (data.length >= 60) {
    const monthlyPattern = checkCyclicPattern(data.map(d => d.count), 30);
    if (monthlyPattern.strength > 0.5) {
      return { pattern: 'monthly' as const, strength: monthlyPattern.strength };
    }
  }
  
  return { pattern: null, strength: 0 };
}

function checkCyclicPattern(values: number[], period: number) {
  if (values.length < period * 2) {
    return { strength: 0 };
  }
  
  let correlation = 0;
  let count = 0;
  
  for (let i = period; i < values.length; i++) {
    correlation += values[i] * values[i - period];
    count++;
  }
  
  if (count === 0) return { strength: 0 };
  
  // Normalize correlation
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length;
  
  const strength = Math.abs(correlation / (count * variance));
  return { strength: Math.min(strength, 1) };
}

function generateForecast(
  historicalData: Array<{ date: string; count: number }>,
  forecastDays: number,
  trend: ReturnType<typeof detectTrend>,
  seasonality: ReturnType<typeof detectSeasonality>
) {
  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const values = historicalData.map(d => d.count);
  const lastIndex = historicalData.length - 1;
  
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Base prediction using trend
    let prediction = trend.slope * (lastIndex + i) + trend.intercept;
    
    // Apply seasonality if detected
    if (seasonality.pattern === 'weekly') {
      const dayOfWeek = forecastDate.getDay();
      const weeklyAvg = calculateWeeklyAverage(historicalData, dayOfWeek);
      const overallAvg = values.reduce((a, b) => a + b, 0) / values.length;
      const seasonalFactor = weeklyAvg / overallAvg;
      prediction *= seasonalFactor;
    }
    
    // Add some random variation based on historical volatility
    const stats = calculateStatistics(values);
    const noise = (Math.random() - 0.5) * stats.stdDev * 0.3;
    prediction += noise;
    
    // Ensure non-negative
    prediction = Math.max(0, prediction);
    
    // Calculate confidence based on distance from last data point
    const confidence = Math.max(0.5, 1 - (i / forecastDays) * 0.5);
    
    predictions.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.round(prediction),
      confidence
    });
  }
  
  return predictions;
}

function calculateWeeklyAverage(data: Array<{ date: string; count: number }>, dayOfWeek: number) {
  const dayData = data.filter(d => new Date(d.date).getDay() === dayOfWeek);
  if (dayData.length === 0) return 0;
  return dayData.reduce((sum, d) => sum + d.count, 0) / dayData.length;
}

async function generateRecommendations(
  testCode: string,
  historicalData: Array<{ date: string; count: number }>,
  predictions: any[],
  stats: any,
  trend: any
): Promise<string[]> {
  const testName = getTestName(testCode);
  const avgDaily = stats.mean;
  const predictedAvg = predictions.reduce((sum, p) => sum + p.value, 0) / predictions.length;
  const growthPercent = ((predictedAvg - avgDaily) / avgDaily) * 100;
  
  const prompt = `Based on the following test volume analysis, provide 3-4 operational recommendations:

Test: ${testName} (${testCode})
Historical Daily Average: ${avgDaily.toFixed(1)} tests
Predicted Daily Average (next 30 days): ${predictedAvg.toFixed(1)} tests
Trend: ${trend.direction} (${Math.abs(growthPercent).toFixed(1)}% ${growthPercent > 0 ? 'increase' : 'decrease'})
Variability: ${((stats.stdDev / stats.mean) * 100).toFixed(1)}% CV

Provide practical recommendations for laboratory operations as a JSON array of strings.
Focus on: staffing, equipment capacity, reagent inventory, and turnaround time management.
Format: ["recommendation1", "recommendation2", "recommendation3"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response.text();
    
    const jsonMatch = response.match(/\[[^\]]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
  
  // Fallback recommendations
  const recommendations: string[] = [];
  
  if (trend.direction === 'increasing' && growthPercent > 10) {
    recommendations.push(`Plan for ${growthPercent.toFixed(0)}% increase in ${testName} test volume`);
    recommendations.push('Consider adding staff during peak hours to maintain TAT');
    recommendations.push(`Increase ${testName} reagent orders by ${Math.ceil(growthPercent)}% for next month`);
  } else if (trend.direction === 'decreasing' && growthPercent < -10) {
    recommendations.push(`Monitor for continued decrease in ${testName} demand`);
    recommendations.push('Review reagent expiration dates to minimize waste');
  }
  
  if (stats.stdDev / stats.mean > 0.3) {
    recommendations.push('High variability detected - implement flexible staffing schedule');
  }
  
  return recommendations.slice(0, 4);
}

function getTestName(testCode: string): string {
  const testNames: Record<string, string> = {
    'GLU': 'Glucose',
    'CBC': 'Complete Blood Count',
    'CMP': 'Comprehensive Metabolic Panel',
    'LIPID': 'Lipid Panel',
    'TSH': 'Thyroid Stimulating Hormone',
    'HBA1C': 'Hemoglobin A1c',
    'PT': 'Prothrombin Time',
    'BMP': 'Basic Metabolic Panel',
    'UA': 'Urinalysis',
    'CULT': 'Culture',
  };
  
  return testNames[testCode] || testCode;
}