import * as functions from 'firebase-functions';
import { VertexAI } from '@google-cloud/vertexai';
import config from '../config';

// Initialize Vertex AI
const vertexAI = new VertexAI({
  project: config.vertexai.projectId,
  location: 'us-central1',
});

const model = vertexAI.getGenerativeModel({
  model: 'gemini-1.5-flash',
  generationConfig: {
    temperature: 0.4,
    topP: 0.85,
    topK: 40,
    maxOutputTokens: 2048,
  },
});

interface ResourceUsageData {
  date: string;
  resourceType: 'reagent' | 'equipment' | 'staff';
  resourceId: string;
  usage: number;
  capacity: number;
}

interface PredictRequest {
  resourceData: ResourceUsageData[];
  forecastDays: number;
  resourceTypes?: string[];
}

export const predictResourceNeeds = functions.https.onCall(async (request: functions.https.CallableRequest<PredictRequest>) => {
  // Check authentication
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { resourceData, forecastDays, resourceTypes } = request.data;

  try {
    // Group data by resource
    const dataByResource: Record<string, ResourceUsageData[]> = {};
    
    resourceData.forEach(item => {
      if (!resourceTypes || resourceTypes.includes(item.resourceType)) {
        const key = `${item.resourceType}:${item.resourceId}`;
        if (!dataByResource[key]) {
          dataByResource[key] = [];
        }
        dataByResource[key].push(item);
      }
    });

    // Generate forecasts for each resource
    const forecasts = await Promise.all(
      Object.entries(dataByResource).map(async ([resourceKey, data]) => {
        const [resourceType, resourceId] = resourceKey.split(':');
        const sortedData = data.sort((a, b) => 
          new Date(a.date).getTime() - new Date(b.date).getTime()
        );

        // Calculate utilization metrics
        const utilizationData = sortedData.map(d => ({
          date: d.date,
          utilization: (d.usage / d.capacity) * 100
        }));

        // Detect usage patterns
        const trend = detectUtilizationTrend(utilizationData);
        const seasonality = detectSeasonality(utilizationData);
        
        // Generate predictions
        const predictions = generateUtilizationForecast(
          utilizationData, 
          forecastDays, 
          trend, 
          seasonality
        );
        
        // Calculate current and predicted utilization
        const recentUtilization = utilizationData.slice(-7)
          .reduce((sum: any, d: any) => sum + d.utilization, 0) / 7;
        const predictedUtilization = predictions
          .reduce((sum, p) => sum + p.value, 0) / predictions.length;
        
        // Assess stockout risk
        const stockoutRisk = assessStockoutRisk(
          predictedUtilization,
          trend,
          resourceType as 'reagent' | 'equipment' | 'staff'
        );
        
        // Calculate reorder date for reagents
        const reorderDate = resourceType === 'reagent' ? 
          calculateReorderDate(sortedData, predictions, stockoutRisk) : 
          undefined;
        
        // Generate AI recommendations
        const recommendations = await generateResourceRecommendations(
          resourceType,
          resourceId,
          recentUtilization,
          predictedUtilization,
          stockoutRisk,
          trend
        );

        return {
          resourceType,
          resourceId,
          resourceName: getResourceName(resourceType, resourceId),
          currentUtilization: Math.round(recentUtilization),
          predictedUtilization: Math.round(predictedUtilization),
          stockoutRisk,
          reorderDate,
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
    console.error('Error predicting resource needs:', error);
    throw new functions.https.HttpsError('internal', 'Failed to predict resource needs');
  }
});

function detectUtilizationTrend(data: Array<{ date: string; utilization: number }>) {
  const n = data.length;
  const x = Array.from({ length: n }, (_, i) => i);
  const y = data.map(d => d.utilization);
  
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
  if (Math.abs(slope) < 0.5 || rSquared < 0.3) {
    direction = 'stable';
  } else {
    direction = slope > 0 ? 'increasing' : 'decreasing';
  }
  
  return { direction, slope, intercept, strength: rSquared };
}

function detectSeasonality(data: Array<{ date: string; utilization: number }>) {
  if (data.length < 14) {
    return { pattern: null, strength: 0 };
  }
  
  const values = data.map(d => d.utilization);
  
  // Check for weekly pattern
  const weeklyPattern = checkCyclicPattern(values, 7);
  if (weeklyPattern.strength > 0.5) {
    return { pattern: 'weekly' as const, strength: weeklyPattern.strength };
  }
  
  // Check for monthly pattern
  if (data.length >= 60) {
    const monthlyPattern = checkCyclicPattern(values, 30);
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
  
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length;
  
  const strength = Math.abs(correlation / (count * variance));
  return { strength: Math.min(strength, 1) };
}

function generateUtilizationForecast(
  historicalData: Array<{ date: string; utilization: number }>,
  forecastDays: number,
  trend: ReturnType<typeof detectUtilizationTrend>,
  seasonality: ReturnType<typeof detectSeasonality>
) {
  const predictions = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);
  const values = historicalData.map(d => d.utilization);
  const lastIndex = historicalData.length - 1;
  
  // Calculate statistics for variation
  const mean = values.reduce((a, b) => a + b, 0) / values.length;
  const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  for (let i = 1; i <= forecastDays; i++) {
    const forecastDate = new Date(lastDate);
    forecastDate.setDate(forecastDate.getDate() + i);
    
    // Base prediction using trend
    let prediction = trend.slope * (lastIndex + i) + trend.intercept;
    
    // Apply seasonality
    if (seasonality.pattern === 'weekly') {
      const dayOfWeek = forecastDate.getDay();
      const weeklyAvg = calculateDayOfWeekAverage(historicalData, dayOfWeek);
      const seasonalFactor = weeklyAvg / mean;
      prediction *= seasonalFactor;
    }
    
    // Add controlled random variation
    const noise = (Math.random() - 0.5) * stdDev * 0.2;
    prediction += noise;
    
    // Ensure within 0-100% range
    prediction = Math.max(0, Math.min(100, prediction));
    
    // Calculate confidence
    const confidence = Math.max(0.5, 1 - (i / forecastDays) * 0.4);
    
    predictions.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.round(prediction),
      confidence
    });
  }
  
  return predictions;
}

function calculateDayOfWeekAverage(
  data: Array<{ date: string; utilization: number }>, 
  dayOfWeek: number
) {
  const dayData = request.data.filter(d => new Date(d.date).getDay() === dayOfWeek);
  if (dayData.length === 0) return 0;
  return dayData.reduce((sum: any, d: any) => sum + d.utilization, 0) / dayData.length;
}

function assessStockoutRisk(
  predictedUtilization: number,
  trend: ReturnType<typeof detectUtilizationTrend>,
  resourceType: 'reagent' | 'equipment' | 'staff'
): 'low' | 'medium' | 'high' {
  // Different thresholds for different resource types
  const thresholds = {
    reagent: { high: 85, medium: 70 },
    equipment: { high: 90, medium: 75 },
    staff: { high: 95, medium: 85 }
  };
  
  const threshold = thresholds[resourceType];
  
  // Consider both current utilization and trend
  let risk: 'low' | 'medium' | 'high' = 'low';
  
  if (predictedUtilization >= threshold.high) {
    risk = 'high';
  } else if (predictedUtilization >= threshold.medium) {
    risk = 'medium';
  }
  
  // Upgrade risk if trending upward strongly
  if (trend.direction === 'increasing' && trend.strength > 0.7) {
    if (risk === 'low') risk = 'medium';
    else if (risk === 'medium') risk = 'high';
  }
  
  return risk;
}

function calculateReorderDate(
  historicalData: ResourceUsageData[],
  predictions: any[],
  stockoutRisk: 'low' | 'medium' | 'high'
): string | undefined {
  if (stockoutRisk === 'low') return undefined;
  
  // Find when utilization is predicted to exceed safety threshold
  const safetyThreshold = stockoutRisk === 'high' ? 75 : 85;
  
  const criticalPrediction = predictions.find(p => p.value >= safetyThreshold);
  if (criticalPrediction) {
    // Subtract lead time (assume 7 days for reagents)
    const reorderDate = new Date(criticalPrediction.date);
    reorderDate.setDate(reorderDate.getDate() - 7);
    
    // Don't suggest dates in the past
    const today = new Date();
    if (reorderDate < today) {
      return today.toISOString().split('T')[0];
    }
    
    return reorderDate.toISOString().split('T')[0];
  }
  
  return undefined;
}

async function generateResourceRecommendations(
  resourceType: string,
  resourceId: string,
  currentUtilization: number,
  predictedUtilization: number,
  stockoutRisk: 'low' | 'medium' | 'high',
  trend: any
): Promise<string[]> {
  const prompt = `Based on the following resource utilization analysis, provide 3-4 operational recommendations:

Resource Type: ${resourceType}
Resource ID: ${resourceId}
Current Utilization: ${currentUtilization.toFixed(1)}%
Predicted Utilization (30 days): ${predictedUtilization.toFixed(1)}%
Stockout Risk: ${stockoutRisk}
Trend: ${trend.direction}

Provide practical recommendations for laboratory resource management as a JSON array of strings.
Focus on: inventory management, procurement, capacity planning, and risk mitigation.
Format: ["recommendation1", "recommendation2", "recommendation3"]`;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response?.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    const jsonMatch = response.match(/\[[^\]]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
  } catch (error) {
    console.error('Error generating recommendations:', error);
  }
  
  // Fallback recommendations
  const recommendations: string[] = [];
  
  if (stockoutRisk === 'high') {
    recommendations.push(`Urgent: Order additional ${resourceType} inventory immediately`);
    recommendations.push('Consider expedited shipping to prevent stockout');
  } else if (stockoutRisk === 'medium') {
    recommendations.push(`Plan to reorder ${resourceType} within the next 7-10 days`);
  }
  
  if (trend.direction === 'increasing' && predictedUtilization > 80) {
    recommendations.push('Evaluate alternative suppliers for better pricing/availability');
    recommendations.push('Consider bulk ordering to reduce per-unit costs');
  }
  
  if (resourceType === 'equipment' && predictedUtilization > 85) {
    recommendations.push('Schedule preventive maintenance to avoid downtime');
    recommendations.push('Consider acquiring backup equipment');
  }
  
  if (resourceType === 'staff' && predictedUtilization > 90) {
    recommendations.push('Begin recruitment process for additional staff');
    recommendations.push('Implement overtime planning for peak periods');
  }
  
  return recommendations.slice(0, 4);
}

function getResourceName(resourceType: string, resourceId: string): string {
  // In a real implementation, this would look up the actual resource name
  return `${resourceType.charAt(0).toUpperCase() + resourceType.slice(1)} ${resourceId}`;
}