import { 
  collection, 
  query, 
  where, 
  getDocs, 
  Timestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { firestore, functions } from '@/config/firebase.config';
import { httpsCallable } from 'firebase/functions';
import { getTenantSpecificCollectionName } from '@/utils/tenant.utils';
import { trackingInstance } from '@/providers/TrackingProvider';
import { logger } from '@/services/logger.service';

interface TestVolumeData {
  date: string;
  testCode: string;
  count: number;
}

interface ResourceUsageData {
  date: string;
  resourceType: 'reagent' | 'equipment' | 'staff';
  resourceId: string;
  usage: number;
  capacity: number;
}

interface PredictionResult {
  predictions: Array<{
    date: string;
    value: number;
    confidence: number;
  }>;
  trend: 'increasing' | 'decreasing' | 'stable';
  seasonality?: {
    pattern: 'daily' | 'weekly' | 'monthly';
    strength: number;
  };
  anomalies?: Array<{
    date: string;
    value: number;
    severity: 'low' | 'medium' | 'high';
  }>;
}

interface TestVolumeForecast {
  testCode: string;
  testName: string;
  currentMonthVolume: number;
  nextMonthPrediction: number;
  growthRate: number;
  predictions: PredictionResult;
  recommendations: string[];
}

interface ResourceForecast {
  resourceType: string;
  resourceId: string;
  resourceName: string;
  currentUtilization: number;
  predictedUtilization: number;
  stockoutRisk: 'low' | 'medium' | 'high';
  reorderDate?: string;
  predictions: PredictionResult;
  recommendations: string[];
}

interface LabMetrics {
  totalTests: number;
  averageTestsPerDay: number;
  peakTestVolume: number;
  efficiency: number;
  trends: {
    daily: number[];
    weekly: number[];
    monthly: number[];
  };
}

class PredictiveAnalyticsService {
  // Forecast test volumes
  async forecastTestVolumes(
    tenantId: string,
    testCodes?: string[],
    forecastDays: number = 30
  ): Promise<TestVolumeForecast[]> {
    const startTime = Date.now();
    
    try {
      // Get historical test data
      const historicalData = await this.getHistoricalTestData(tenantId, testCodes);
      
      // Call Firebase function for predictions
      const predictTestVolumes = httpsCallable<any, any>(functions, 'predictTestVolumes');
      const result = await predictTestVolumes({
        historicalData,
        forecastDays,
        testCodes
      });

      const forecasts = result.data.forecasts;

      // Track analytics
      trackingInstance.trackEvent('predictive_analytics_forecast', {
        type: 'test_volumes',
        tenantId,
        testCount: testCodes?.length || 'all',
        forecastDays,
        duration: Date.now() - startTime,
      });

      return forecasts;
    } catch (error) {
      logger.error('Error forecasting test volumes:', error);
      throw error;
    }
  }

  // Forecast resource needs
  async forecastResourceNeeds(
    tenantId: string,
    resourceTypes?: string[],
    forecastDays: number = 30
  ): Promise<ResourceForecast[]> {
    const startTime = Date.now();

    try {
      // Get historical resource usage
      const resourceData = await this.getHistoricalResourceData(tenantId, resourceTypes);
      
      // Call Firebase function for predictions
      const predictResourceNeeds = httpsCallable<any, any>(functions, 'predictResourceNeeds');
      const result = await predictResourceNeeds({
        resourceData,
        forecastDays,
        resourceTypes
      });

      const forecasts = result.data.forecasts;

      // Track analytics
      trackingInstance.trackEvent('predictive_analytics_forecast', {
        type: 'resources',
        tenantId,
        resourceTypes: resourceTypes?.join(',') || 'all',
        forecastDays,
        duration: Date.now() - startTime,
      });

      return forecasts;
    } catch (error) {
      logger.error('Error forecasting resource needs:', error);
      throw error;
    }
  }

  // Get lab performance metrics
  async getLabMetrics(
    tenantId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<LabMetrics> {
    const startTime = Date.now();

    try {
      const endDate = dateRange?.end || new Date();
      const startDate = dateRange?.start || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

      // Get test orders within date range
      const ordersCollection = getTenantSpecificCollectionName('testOrders', tenantId);
      const ordersQuery = query(
        collection(firestore, ordersCollection),
        where('createdAt', '>=', Timestamp.fromDate(startDate)),
        where('createdAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('createdAt', 'desc')
      );

      const ordersSnapshot = await getDocs(ordersQuery);
      const orders = ordersSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate metrics
      const totalTests = orders.reduce((sum, order: any) => sum + (order.tests?.length || 0), 0);
      const daysInRange = Math.ceil((endDate.getTime() - startDate.getTime()) / (24 * 60 * 60 * 1000));
      const averageTestsPerDay = totalTests / daysInRange;

      // Calculate daily volumes
      const dailyVolumes: Record<string, number> = {};
      orders.forEach((order: any) => {
        const date = order.createdAt.toDate().toISOString().split('T')[0];
        dailyVolumes[date] = (dailyVolumes[date] || 0) + (order.tests?.length || 0);
      });

      const peakTestVolume = Math.max(...Object.values(dailyVolumes), 0);

      // Calculate trends
      const daily = Object.values(dailyVolumes).slice(-7); // Last 7 days
      const weekly = this.aggregateByWeek(dailyVolumes);
      const monthly = this.aggregateByMonth(dailyVolumes);

      // Calculate efficiency (completed tests / total tests)
      const completedTests = orders.filter((order: any) => order.status === 'completed').length;
      const efficiency = totalTests > 0 ? (completedTests / totalTests) * 100 : 0;

      const metrics: LabMetrics = {
        totalTests,
        averageTestsPerDay,
        peakTestVolume,
        efficiency,
        trends: {
          daily,
          weekly: weekly.slice(-4), // Last 4 weeks
          monthly: monthly.slice(-6), // Last 6 months
        }
      };

      // Track analytics
      trackingInstance.trackEvent('lab_metrics_retrieved', {
        tenantId,
        dateRange: daysInRange,
        totalTests,
        duration: Date.now() - startTime,
      });

      return metrics;
    } catch (error) {
      logger.error('Error getting lab metrics:', error);
      throw error;
    }
  }

  // Detect anomalies in test patterns
  async detectAnomalies(
    tenantId: string,
    metric: 'test_volume' | 'turnaround_time' | 'error_rate',
    sensitivity: 'low' | 'medium' | 'high' = 'medium'
  ): Promise<any[]> {
    try {
      const detectAnomalies = httpsCallable<any, any>(functions, 'detectLabAnomalies');
      const result = await detectAnomalies({
        tenantId,
        metric,
        sensitivity,
        lookbackDays: 90
      });

      return result.data.anomalies;
    } catch (error) {
      logger.error('Error detecting anomalies:', error);
      throw error;
    }
  }

  // Private helper methods
  private async getHistoricalTestData(
    tenantId: string,
    testCodes?: string[]
  ): Promise<TestVolumeData[]> {
    const ordersCollection = getTenantSpecificCollectionName('testOrders', tenantId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    const ordersQuery = query(
      collection(firestore, ordersCollection),
      where('createdAt', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('createdAt', 'desc'),
      limit(1000)
    );

    const snapshot = await getDocs(ordersQuery);
    const volumeData: Record<string, Record<string, number>> = {};

    snapshot.docs.forEach(doc => {
      const order = doc.data();
      const date = order.createdAt.toDate().toISOString().split('T')[0];
      
      order.tests?.forEach((test: any) => {
        if (!testCodes || testCodes.includes(test.testCode)) {
          if (!volumeData[test.testCode]) {
            volumeData[test.testCode] = {};
          }
          volumeData[test.testCode][date] = (volumeData[test.testCode][date] || 0) + 1;
        }
      });
    });

    // Convert to array format
    const data: TestVolumeData[] = [];
    Object.entries(volumeData).forEach(([testCode, dates]) => {
      Object.entries(dates).forEach(([date, count]) => {
        data.push({ date, testCode, count });
      });
    });

    return data;
  }

  private async getHistoricalResourceData(
    tenantId: string,
    resourceTypes?: string[]
  ): Promise<ResourceUsageData[]> {
    const inventoryCollection = getTenantSpecificCollectionName('inventory', tenantId);
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    let inventoryQuery = query(
      collection(firestore, inventoryCollection),
      where('lastUpdated', '>=', Timestamp.fromDate(thirtyDaysAgo)),
      orderBy('lastUpdated', 'desc')
    );

    if (resourceTypes && resourceTypes.length > 0) {
      inventoryQuery = query(
        inventoryQuery,
        where('type', 'in', resourceTypes)
      );
    }

    const snapshot = await getDocs(inventoryQuery);
    const resourceData: ResourceUsageData[] = [];

    snapshot.docs.forEach(doc => {
      const item = doc.data();
      resourceData.push({
        date: item.lastUpdated.toDate().toISOString().split('T')[0],
        resourceType: item.type,
        resourceId: doc.id,
        usage: item.quantity - item.availableQuantity,
        capacity: item.quantity
      });
    });

    return resourceData;
  }

  private aggregateByWeek(dailyData: Record<string, number>): number[] {
    const weeks: Record<string, number> = {};
    
    Object.entries(dailyData).forEach(([date, count]) => {
      const weekNumber = this.getWeekNumber(new Date(date));
      weeks[weekNumber] = (weeks[weekNumber] || 0) + count;
    });

    return Object.values(weeks);
  }

  private aggregateByMonth(dailyData: Record<string, number>): number[] {
    const months: Record<string, number> = {};
    
    Object.entries(dailyData).forEach(([date, count]) => {
      const month = date.substring(0, 7); // YYYY-MM
      months[month] = (months[month] || 0) + count;
    });

    return Object.values(months);
  }

  private getWeekNumber(date: Date): string {
    const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
    const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
    const weekNumber = Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
    return `${date.getFullYear()}-W${weekNumber}`;
  }
}

// Export singleton instance
export const predictiveAnalyticsService = new PredictiveAnalyticsService();

// Export types
export type { 
  TestVolumeForecast, 
  ResourceForecast, 
  LabMetrics, 
  PredictionResult,
  TestVolumeData,
  ResourceUsageData
};