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
exports.detectLabAnomalies = void 0;
const functions = __importStar(require("firebase-functions"));
const firebase_admin_1 = require("firebase-admin");
exports.detectLabAnomalies = functions.https.onCall(async (data, context) => {
    // Check authentication
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
    }
    const { tenantId, metric, sensitivity, lookbackDays } = data;
    try {
        // Get historical data based on metric type
        const historicalData = await getMetricData(tenantId, metric, lookbackDays);
        if (historicalData.length < 7) {
            return { anomalies: [] }; // Not enough data for anomaly detection
        }
        // Calculate baseline statistics
        const baseline = calculateBaseline(historicalData);
        // Detect anomalies using multiple methods
        const anomalies = [];
        // 1. Statistical anomalies (Z-score)
        const statisticalAnomalies = detectStatisticalAnomalies(historicalData, baseline, sensitivity);
        anomalies.push(...statisticalAnomalies);
        // 2. Trend anomalies (sudden changes)
        const trendAnomalies = detectTrendAnomalies(historicalData, sensitivity);
        anomalies.push(...trendAnomalies);
        // 3. Pattern anomalies (missing expected patterns)
        const patternAnomalies = detectPatternAnomalies(historicalData, sensitivity);
        anomalies.push(...patternAnomalies);
        // Deduplicate and sort by date
        const uniqueAnomalies = deduplicateAnomalies(anomalies);
        uniqueAnomalies.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        return { anomalies: uniqueAnomalies };
    }
    catch (error) {
        console.error('Error detecting anomalies:', error);
        throw new functions.https.HttpsError('internal', 'Failed to detect anomalies');
    }
});
async function getMetricData(tenantId, metric, lookbackDays) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackDays);
    const data = [];
    switch (metric) {
        case 'test_volume':
            // Get daily test order counts
            const ordersRef = (0, firebase_admin_1.firestore)()
                .collection(`tenants/${tenantId}/testOrders`)
                .where('createdAt', '>=', startDate)
                .orderBy('createdAt', 'asc');
            const ordersSnapshot = await ordersRef.get();
            const dailyCounts = {};
            ordersSnapshot.forEach(doc => {
                const order = doc.data();
                const date = order.createdAt.toDate().toISOString().split('T')[0];
                dailyCounts[date] = (dailyCounts[date] || 0) + (order.tests?.length || 0);
            });
            Object.entries(dailyCounts).forEach(([date, count]) => {
                data.push({ date, value: count });
            });
            break;
        case 'turnaround_time':
            // Get average TAT per day
            const resultsRef = (0, firebase_admin_1.firestore)()
                .collection(`tenants/${tenantId}/testResults`)
                .where('completedAt', '>=', startDate)
                .orderBy('completedAt', 'asc');
            const resultsSnapshot = await resultsRef.get();
            const dailyTAT = {};
            resultsSnapshot.forEach(doc => {
                const result = doc.data();
                if (result.orderedAt && result.completedAt) {
                    const date = result.completedAt.toDate().toISOString().split('T')[0];
                    const tat = (result.completedAt.toMillis() - result.orderedAt.toMillis()) / (1000 * 60 * 60); // Hours
                    if (!dailyTAT[date]) {
                        dailyTAT[date] = { total: 0, count: 0 };
                    }
                    dailyTAT[date].total += tat;
                    dailyTAT[date].count++;
                }
            });
            Object.entries(dailyTAT).forEach(([date, stats]) => {
                data.push({ date, value: stats.total / stats.count });
            });
            break;
        case 'error_rate':
            // Get daily error rates
            const allResultsRef = (0, firebase_admin_1.firestore)()
                .collection(`tenants/${tenantId}/testResults`)
                .where('createdAt', '>=', startDate)
                .orderBy('createdAt', 'asc');
            const allResultsSnapshot = await allResultsRef.get();
            const dailyErrors = {};
            allResultsSnapshot.forEach(doc => {
                const result = doc.data();
                const date = result.createdAt.toDate().toISOString().split('T')[0];
                if (!dailyErrors[date]) {
                    dailyErrors[date] = { errors: 0, total: 0 };
                }
                dailyErrors[date].total++;
                if (result.status === 'error' || result.corrected) {
                    dailyErrors[date].errors++;
                }
            });
            Object.entries(dailyErrors).forEach(([date, stats]) => {
                const errorRate = stats.total > 0 ? (stats.errors / stats.total) * 100 : 0;
                data.push({ date, value: errorRate });
            });
            break;
    }
    return data;
}
function calculateBaseline(data) {
    const values = data.map(d => d.value);
    const n = values.length;
    // Calculate mean
    const mean = values.reduce((a, b) => a + b, 0) / n;
    // Calculate standard deviation
    const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / n;
    const stdDev = Math.sqrt(variance);
    // Calculate median
    const sorted = [...values].sort((a, b) => a - b);
    const median = n % 2 === 0 ?
        (sorted[n / 2 - 1] + sorted[n / 2]) / 2 :
        sorted[Math.floor(n / 2)];
    // Calculate percentiles
    const p25 = sorted[Math.floor(n * 0.25)];
    const p75 = sorted[Math.floor(n * 0.75)];
    const iqr = p75 - p25;
    return { mean, stdDev, median, p25, p75, iqr };
}
function detectStatisticalAnomalies(data, baseline, sensitivity) {
    const anomalies = [];
    // Z-score thresholds based on sensitivity
    const zThresholds = {
        low: 3.5,
        medium: 2.5,
        high: 2.0
    };
    const threshold = zThresholds[sensitivity];
    data.forEach(point => {
        const zScore = Math.abs((point.value - baseline.mean) / baseline.stdDev);
        if (zScore > threshold) {
            const severity = zScore > 3.5 ? 'high' : zScore > 2.5 ? 'medium' : 'low';
            anomalies.push({
                date: point.date,
                metric: 'statistical',
                value: point.value,
                expectedValue: baseline.mean,
                deviation: zScore,
                severity,
                description: `Value is ${zScore.toFixed(1)} standard deviations from mean`
            });
        }
    });
    return anomalies;
}
function detectTrendAnomalies(data, sensitivity) {
    const anomalies = [];
    // Look for sudden changes
    const changeThresholds = {
        low: 0.5, // 50% change
        medium: 0.3, // 30% change
        high: 0.2 // 20% change
    };
    const threshold = changeThresholds[sensitivity];
    for (let i = 1; i < data.length; i++) {
        const current = data[i].value;
        const previous = data[i - 1].value;
        if (previous > 0) {
            const changeRate = Math.abs((current - previous) / previous);
            if (changeRate > threshold) {
                const severity = changeRate > 0.5 ? 'high' : changeRate > 0.3 ? 'medium' : 'low';
                anomalies.push({
                    date: data[i].date,
                    metric: 'trend',
                    value: current,
                    expectedValue: previous,
                    deviation: changeRate,
                    severity,
                    description: `${(changeRate * 100).toFixed(0)}% ${current > previous ? 'increase' : 'decrease'} from previous day`
                });
            }
        }
    }
    return anomalies;
}
function detectPatternAnomalies(data, sensitivity) {
    const anomalies = [];
    // Group by day of week
    const dayOfWeekData = {};
    data.forEach(point => {
        const dayOfWeek = new Date(point.date).getDay();
        if (!dayOfWeekData[dayOfWeek]) {
            dayOfWeekData[dayOfWeek] = [];
        }
        dayOfWeekData[dayOfWeek].push(point.value);
    });
    // Calculate expected values for each day of week
    const dayOfWeekExpected = {};
    Object.entries(dayOfWeekData).forEach(([day, values]) => {
        const dayNum = parseInt(day);
        const mean = values.reduce((a, b) => a + b, 0) / values.length;
        const variance = values.reduce((sq, v) => sq + Math.pow(v - mean, 2), 0) / values.length;
        dayOfWeekExpected[dayNum] = { mean, stdDev: Math.sqrt(variance) };
    });
    // Check for pattern deviations
    const deviationThresholds = {
        low: 2.5,
        medium: 2.0,
        high: 1.5
    };
    const threshold = deviationThresholds[sensitivity];
    data.forEach(point => {
        const dayOfWeek = new Date(point.date).getDay();
        const expected = dayOfWeekExpected[dayOfWeek];
        if (expected && expected.stdDev > 0) {
            const deviation = Math.abs((point.value - expected.mean) / expected.stdDev);
            if (deviation > threshold) {
                const severity = deviation > 2.5 ? 'high' : deviation > 2.0 ? 'medium' : 'low';
                anomalies.push({
                    date: point.date,
                    metric: 'pattern',
                    value: point.value,
                    expectedValue: expected.mean,
                    deviation,
                    severity,
                    description: `Unusual for ${getDayName(dayOfWeek)} (typically ${expected.mean.toFixed(1)})`
                });
            }
        }
    });
    return anomalies;
}
function deduplicateAnomalies(anomalies) {
    const uniqueMap = new Map();
    anomalies.forEach(anomaly => {
        const key = `${anomaly.date}-${anomaly.metric}`;
        const existing = uniqueMap.get(key);
        // Keep the anomaly with higher severity
        if (!existing || getSeverityScore(anomaly.severity) > getSeverityScore(existing.severity)) {
            uniqueMap.set(key, anomaly);
        }
    });
    return Array.from(uniqueMap.values());
}
function getSeverityScore(severity) {
    const scores = { low: 1, medium: 2, high: 3 };
    return scores[severity];
}
function getDayName(dayOfWeek) {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[dayOfWeek];
}
//# sourceMappingURL=detectLabAnomalies.js.map