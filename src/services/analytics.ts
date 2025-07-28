import { api } from './api';

export interface DashboardData {
  totalTests: number;
  testsChange: number;
  activePatients: number;
  patientsChange: number;
  avgTurnaroundTime: number;
  turnaroundChange: number;
  revenue: number;
  revenueChange: number;
  dailyTestVolume: Array<{
    date: string;
    count: number;
  }>;
  testsByCategory: Array<{
    category: string;
    count: number;
  }>;
  insights: Array<{
    title: string;
    description: string;
  }>;
}

export interface PerformanceMetrics {
  departmentMetrics: Array<{
    department: string;
    testsCompleted: number;
    avgTurnaround: number;
    errorRate: number;
  }>;
  staffPerformance: Array<{
    staffId: string;
    name: string;
    testsProcessed: number;
    accuracy: number;
  }>;
  equipmentUtilization: Array<{
    equipmentId: string;
    name: string;
    utilizationRate: number;
    downtime: number;
  }>;
}

export interface FinancialMetrics {
  totalRevenue: number;
  outstandingClaims: number;
  collectionRate: number;
  avgDaysToPayment: number;
  revenueByInsurer: Array<{
    insurer: string;
    amount: number;
    percentage: number;
  }>;
  revenueByTestCategory: Array<{
    category: string;
    amount: number;
  }>;
}

export interface QualityMetrics {
  criticalValueReporting: {
    total: number;
    withinTime: number;
    percentage: number;
  };
  sampleRejectionRate: number;
  testAccuracy: number;
  qcPassRate: number;
  incidentReports: number;
  patientSatisfaction: number;
}

export interface OperationalMetrics {
  sampleBacklog: number;
  averageWaitTime: number;
  peakHours: Array<{
    hour: number;
    volume: number;
  }>;
  resourceUtilization: {
    staff: number;
    equipment: number;
    supplies: number;
  };
}

export const analyticsService = {
  // Get main dashboard data
  async getDashboardData(startDate: Date, endDate: Date): Promise<DashboardData> {
    const response = await api.get('/api/analytics/dashboard', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  // Get performance metrics
  async getPerformanceMetrics(startDate: Date, endDate: Date): Promise<PerformanceMetrics> {
    const response = await api.get('/api/analytics/performance', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  // Get financial metrics
  async getFinancialMetrics(startDate: Date, endDate: Date): Promise<FinancialMetrics> {
    const response = await api.get('/api/analytics/financial', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  // Get quality metrics
  async getQualityMetrics(startDate: Date, endDate: Date): Promise<QualityMetrics> {
    const response = await api.get('/api/analytics/quality', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  // Get operational metrics
  async getOperationalMetrics(startDate: Date, endDate: Date): Promise<OperationalMetrics> {
    const response = await api.get('/api/analytics/operational', {
      params: {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      },
    });
    return response.data;
  },

  // Export analytics data
  async exportAnalytics(
    type: 'pdf' | 'excel' | 'csv',
    filters: {
      startDate: Date;
      endDate: Date;
      metrics: string[];
    }
  ): Promise<Blob> {
    const response = await api.post('/api/analytics/export', filters, {
      params: { type },
      responseType: 'blob',
    });
    return response.data;
  },

  // Get custom report
  async getCustomReport(config: {
    metrics: string[];
    groupBy: string;
    filters: Record<string, any>;
    startDate: Date;
    endDate: Date;
  }): Promise<any> {
    const response = await api.post('/api/analytics/custom-report', config);
    return response.data;
  },

  // Real-time metrics
  async getRealtimeMetrics(): Promise<{
    activeTests: number;
    pendingResults: number;
    criticalValues: number;
    onlineUsers: number;
    systemLoad: number;
  }> {
    const response = await api.get('/api/analytics/realtime');
    return response.data;
  },

  // Predictive analytics
  async getPredictiveAnalytics(): Promise<{
    expectedTestVolume: Array<{ date: string; predicted: number; confidence: number }>;
    staffingRecommendations: Array<{ date: string; department: string; recommended: number }>;
    supplyForecast: Array<{ item: string; daysUntilReorder: number; predictedUsage: number }>;
  }> {
    const response = await api.get('/api/analytics/predictive');
    return response.data;
  },
};
