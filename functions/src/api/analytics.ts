import { Request, Response } from 'express';
import { db } from '../config/firebase';
import { authenticateRequest } from '../middleware/auth';

const projectPrefix = 'labflow_';

// Get dashboard data
export const getDashboardData = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const { startDate, endDate } = req.query;
      const start = new Date(startDate as string);
      const end = new Date(endDate as string);

      // Get test counts
      const testsSnapshot = await db.collection(`${projectPrefix}samples`)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .get();
      
      const totalTests = testsSnapshot.size;

      // Get patient counts
      const patientsSnapshot = await db.collection(`${projectPrefix}patients`)
        .where('createdAt', '>=', start)
        .where('createdAt', '<=', end)
        .get();
      
      const activePatients = patientsSnapshot.size;

      // Calculate other metrics
      const dashboardData = {
        totalTests,
        testsChange: 12.5, // Would calculate from previous period
        activePatients,
        patientsChange: 8.3,
        avgTurnaroundTime: 24,
        turnaroundChange: -5.2,
        revenue: 125000,
        revenueChange: 15.7,
        dailyTestVolume: generateDailyVolume(start, end),
        testsByCategory: await getTestsByCategory(start, end),
        insights: [
          {
            title: 'Peak Testing Hours',
            description: 'Most tests are ordered between 8 AM and 11 AM'
          },
          {
            title: 'Top Test Type',
            description: 'CBC is the most frequently ordered test'
          }
        ]
      };

      res.json(dashboardData);
    });
  } catch (error) {
    console.error('Error getting dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get performance metrics
export const getPerformanceMetrics = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const { startDate, endDate } = req.query;

      const performanceData = {
        departmentMetrics: [
          { department: 'Hematology', testsCompleted: 1250, avgTurnaround: 18, errorRate: 0.02 },
          { department: 'Chemistry', testsCompleted: 2100, avgTurnaround: 24, errorRate: 0.01 },
          { department: 'Microbiology', testsCompleted: 450, avgTurnaround: 48, errorRate: 0.03 }
        ],
        staffPerformance: [],
        equipmentUtilization: []
      };

      res.json(performanceData);
    });
  } catch (error) {
    console.error('Error getting performance metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get financial metrics
export const getFinancialMetrics = async (req: Request, res: Response) => {
  try {
    await authenticateRequest(req, res, async () => {
      const financialData = {
        totalRevenue: 125000,
        outstandingClaims: 45000,
        collectionRate: 92,
        avgDaysToPayment: 28,
        revenueByInsurer: [
          { insurer: 'Medicare', amount: 45000, percentage: 36 },
          { insurer: 'Blue Cross', amount: 35000, percentage: 28 },
          { insurer: 'Private Pay', amount: 25000, percentage: 20 },
          { insurer: 'Other', amount: 20000, percentage: 16 }
        ],
        revenueByTestCategory: []
      };

      res.json(financialData);
    });
  } catch (error) {
    console.error('Error getting financial metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Helper functions
function generateDailyVolume(start: Date, end: Date) {
  const dailyVolume = [];
  const current = new Date(start);
  
  while (current <= end) {
    dailyVolume.push({
      date: current.toISOString().split('T')[0],
      count: Math.floor(Math.random() * 100) + 50
    });
    current.setDate(current.getDate() + 1);
  }
  
  return dailyVolume;
}

async function getTestsByCategory(start: Date, end: Date) {
  return [
    { category: 'Hematology', count: 450 },
    { category: 'Chemistry', count: 780 },
    { category: 'Microbiology', count: 230 },
    { category: 'Immunology', count: 150 },
    { category: 'Molecular', count: 90 }
  ];
}