"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.predictQCResults = void 0;
const functions = __importStar(require("firebase-functions"));
const vertexai_1 = require("@google-cloud/vertexai");
const config_1 = require("../config");
// Initialize Vertex AI
const vertexAI = new vertexai_1.VertexAI({
    project: config_1.projectId,
    location: 'us-central1',
});
const model = vertexAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
        temperature: 0.3, // Lower temperature for more consistent predictions
        topP: 0.85,
        topK: 40,
        maxOutputTokens: 1024,
    },
});
exports.predictQCResults = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { testCode, historicalQCData, equipmentInfo } = data;
    try {
        // Sort QC data by date
        const sortedData = [...historicalQCData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        // Analyze historical QC performance
        const qcAnalysis = analyzeQCHistory(sortedData);
        // Predict next QC values
        const predictedValues = predictNextQCValues(sortedData);
        // Evaluate predicted values against Westgard rules
        const qcEvaluation = evaluateQCPrediction(predictedValues, qcAnalysis);
        // Check for maintenance needs
        const maintenanceAlert = checkMaintenanceNeeds(qcAnalysis, equipmentInfo, qcEvaluation.predictedResult);
        // Generate AI recommendations
        const recommendations = await generateQCRecommendations(testCode, qcAnalysis, qcEvaluation, equipmentInfo);
        return {
            testCode,
            predictedQCResult: qcEvaluation.predictedResult,
            confidence: qcEvaluation.confidence,
            predictedValues,
            recommendations,
            maintenanceAlert,
        };
    }
    catch (error) {
        console.error('Error predicting QC results:', error);
        throw new functions.https.HttpsError('internal', 'Failed to predict QC results');
    }
});
function analyzeQCHistory(qcData) {
    const levels = ['level1', 'level2', 'level3'];
    const analysis = {
        totalRuns: qcData.length,
        passRate: 0,
        trends: {},
        violations: {},
        volatility: {},
    };
    // Calculate pass rate
    const passedRuns = qcData.filter(d => d.passed).length;
    analysis.passRate = passedRuns / qcData.length;
    // Analyze each level
    levels.forEach(level => {
        if (!qcData[0][level])
            return;
        const values = qcData.map(d => d[level]).filter(v => v !== undefined);
        if (values.length === 0)
            return;
        // Calculate statistics
        const stats = calculateStatistics(values);
        // Detect trend
        const trend = detectTrend(values);
        // Calculate volatility (CV)
        const cv = (stats.stdDev / stats.mean) * 100;
        analysis.trends[level] = trend;
        analysis.volatility[level] = cv;
        // Count violation types
        const levelViolations = {};
        qcData.forEach(d => {
            if (d.violations) {
                d.violations.forEach(v => {
                    if (v.includes(level)) {
                        levelViolations[v] = (levelViolations[v] || 0) + 1;
                    }
                });
            }
        });
        analysis.violations[level] = levelViolations;
    });
    return analysis;
}
function predictNextQCValues(qcData) {
    const predictions = {};
    const recentData = qcData.slice(-10); // Use last 10 runs for prediction
    ['level1', 'level2', 'level3'].forEach(level => {
        const values = recentData.map(d => d[level]).filter(v => v !== undefined);
        if (values.length < 3)
            return;
        // Simple moving average prediction
        const ma3 = values.slice(-3).reduce((a, b) => a + b, 0) / 3;
        const ma5 = values.slice(-5).reduce((a, b) => a + b, 0) / Math.min(5, values.length);
        // Weight recent values more heavily
        const weightedPrediction = (ma3 * 0.7) + (ma5 * 0.3);
        // Apply trend adjustment
        const trend = detectTrend(values);
        let trendAdjustment = 0;
        if (trend.direction !== 'stable' && trend.strength > 0.5) {
            trendAdjustment = trend.slope * 0.5; // Conservative trend following
        }
        predictions[level] = weightedPrediction + trendAdjustment;
    });
    return predictions;
}
function evaluateQCPrediction(predictedValues, qcAnalysis) {
    let violations = 0;
    let confidence = 0.9; // Start with high confidence
    // For each level, check if predicted value would violate rules
    Object.entries(predictedValues).forEach(([level, value]) => {
        const levelNumber = parseInt(level.replace('level', ''));
        // Simplified Westgard rules evaluation
        // In reality, you'd have the target mean and SD for each level
        const targetMean = levelNumber * 100; // Placeholder
        const targetSD = targetMean * 0.05; // 5% CV placeholder
        const zScore = Math.abs((value - targetMean) / targetSD);
        // 1-3s rule
        if (zScore > 3) {
            violations++;
            confidence *= 0.7;
        }
        else if (zScore > 2) {
            confidence *= 0.9;
        }
        // Check historical violation patterns
        const historicalViolations = qcAnalysis.violations[level];
        if (historicalViolations && Object.keys(historicalViolations).length > 0) {
            confidence *= 0.95;
        }
        // High volatility reduces confidence
        if (qcAnalysis.volatility[level] > 10) {
            confidence *= 0.9;
        }
    });
    // Determine predicted result
    let predictedResult;
    if (violations > 0) {
        predictedResult = 'fail';
    }
    else if (confidence < 0.8) {
        predictedResult = 'warning';
    }
    else {
        predictedResult = 'pass';
    }
    // Adjust confidence based on historical pass rate
    confidence *= Math.sqrt(qcAnalysis.passRate);
    return {
        predictedResult,
        confidence: Math.max(0.3, Math.min(0.95, confidence)),
    };
}
function checkMaintenanceNeeds(qcAnalysis, equipmentInfo, predictedResult) {
    // Check for systematic issues suggesting maintenance
    const issues = [];
    // Check for consistent trends
    Object.entries(qcAnalysis.trends).forEach(([level, trend]) => {
        if (trend.direction !== 'stable' && trend.strength > 0.7) {
            issues.push(`Consistent ${trend.direction} trend in ${level}`);
        }
    });
    // Check for high volatility
    Object.entries(qcAnalysis.volatility).forEach(([level, cv]) => {
        if (cv > 15) {
            issues.push(`High variability in ${level} (CV: ${cv.toFixed(1)}%)`);
        }
    });
    // Check pass rate
    if (qcAnalysis.passRate < 0.8) {
        issues.push(`Low QC pass rate: ${(qcAnalysis.passRate * 100).toFixed(0)}%`);
    }
    // Check calibration status
    if (equipmentInfo?.calibrationDue) {
        const dueDate = new Date(equipmentInfo.calibrationDue);
        const daysUntilDue = Math.floor((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
        if (daysUntilDue <= 7) {
            issues.push(`Calibration due in ${daysUntilDue} days`);
        }
    }
    if (issues.length > 0 || predictedResult === 'fail') {
        return {
            equipmentId: equipmentInfo?.id || 'unknown',
            message: issues.length > 0 ?
                `Maintenance recommended: ${issues.join('; ')}` :
                'Preventive maintenance recommended due to predicted QC failure',
            priority: predictedResult === 'fail' || issues.length > 2 ? 'urgent' : 'scheduled',
        };
    }
    return undefined;
}
async function generateQCRecommendations(testCode, qcAnalysis, qcEvaluation, equipmentInfo) {
    const prompt = `Based on the following quality control data, provide 3-4 specific recommendations:

Test: ${testCode}
QC Pass Rate: ${(qcAnalysis.passRate * 100).toFixed(1)}%
Predicted Result: ${qcEvaluation.predictedResult}
Confidence: ${(qcEvaluation.confidence * 100).toFixed(1)}%
Trends: ${JSON.stringify(qcAnalysis.trends)}
Equipment: ${equipmentInfo?.model || 'Unknown'}

Provide practical QC recommendations as a JSON array of strings.
Format: ["recommendation1", "recommendation2", "recommendation3"]`;
    try {
        const result = await model.generateContent(prompt);
        const response = result.response.text();
        const jsonMatch = response.match(/\[[\s\S]*\]/);
        if (jsonMatch) {
            return JSON.parse(jsonMatch[0]);
        }
    }
    catch (error) {
        console.error('Error generating recommendations:', error);
    }
    // Fallback recommendations based on analysis
    const recommendations = [];
    if (qcEvaluation.predictedResult === 'fail') {
        recommendations.push('Do not run patient samples until QC issues are resolved');
        recommendations.push('Verify reagent expiration dates and storage conditions');
    }
    if (qcEvaluation.predictedResult === 'warning') {
        recommendations.push('Increase QC monitoring frequency to identify patterns');
        recommendations.push('Review recent maintenance and calibration records');
    }
    if (qcAnalysis.passRate < 0.9) {
        recommendations.push('Investigate root causes of QC failures through troubleshooting protocol');
    }
    // Add trend-based recommendations
    Object.entries(qcAnalysis.trends).forEach(([level, trend]) => {
        if (trend.direction === 'increasing' && trend.strength > 0.6) {
            recommendations.push(`Investigate upward drift in ${level} - possible calibration issue`);
        }
        else if (trend.direction === 'decreasing' && trend.strength > 0.6) {
            recommendations.push(`Investigate downward drift in ${level} - check reagent stability`);
        }
    });
    return recommendations.slice(0, 4);
}
function calculateStatistics(values) {
    const n = values.length;
    const mean = values.reduce((a, b) => a + b, 0) / n;
    const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    return { mean, stdDev, n };
}
function detectTrend(values) {
    if (values.length < 3) {
        return { direction: 'stable', strength: 0, slope: 0 };
    }
    // Simple linear regression
    const n = values.length;
    const x = Array.from({ length: n }, (_, i) => i);
    const y = values;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((sum, xi, i) => sum + xi * y[i], 0);
    const sumX2 = x.reduce((sum, xi) => sum + xi * xi, 0);
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    // Calculate R-squared
    const yMean = sumY / n;
    const ssTotal = y.reduce((sum, yi) => sum + Math.pow(yi - yMean, 2), 0);
    const ssResidual = y.reduce((sum, yi, i) => {
        const predicted = slope * i + (sumY - slope * sumX) / n;
        return sum + Math.pow(yi - predicted, 2);
    }, 0);
    const rSquared = 1 - (ssResidual / ssTotal);
    // Determine direction
    let direction;
    const percentChangePerPoint = Math.abs(slope / yMean) * 100;
    if (rSquared < 0.3 || percentChangePerPoint < 1) {
        direction = 'stable';
    }
    else {
        direction = slope > 0 ? 'increasing' : 'decreasing';
    }
    return {
        direction,
        strength: rSquared,
        slope,
    };
}
//# sourceMappingURL=predictQCResults.js.map