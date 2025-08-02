import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { getUserById } from '@/services/auth.service';
import { patientService } from '@/services/patient.service';
import { sampleService } from '@/services/sample.service';
import { orderService } from '@/services/order.service';
import { resultService } from '@/services/result.service';
import { qcService } from '@/services/qc.service';
import { inventoryService } from '@/services/inventory.service';
import { billingService } from '@/services/billing.service';
import type {
  Report,
  ReportTemplate,
  ReportQueryFilter,
  ReportFormData,
  ReportTemplateFormData,
  DateRangePreset,
  AnalyticsDashboard,
  DashboardFormData,
  AnalyticsMetrics,
} from '@/types/report.types';

// Helper function to get date range
const getDateRange = (preset: DateRangePreset): { start: Date; end: Date } => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  switch (preset) {
    case 'today':
      return { start: today, end: now };
    case 'yesterday':
      return { start: yesterday, end: today };
    case 'last7days': {
      const last7days = new Date(today);
      last7days.setDate(last7days.getDate() - 7);
      return { start: last7days, end: now };
    }
    case 'last30days': {
      const last30days = new Date(today);
      last30days.setDate(last30days.getDate() - 30);
      return { start: last30days, end: now };
    }
    case 'thisMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth(), 1),
        end: now,
      };
    case 'lastMonth':
      return {
        start: new Date(now.getFullYear(), now.getMonth() - 1, 1),
        end: new Date(now.getFullYear(), now.getMonth(), 0),
      };
    case 'thisQuarter': {
      const quarterMonth = Math.floor(now.getMonth() / 3) * 3;
      return {
        start: new Date(now.getFullYear(), quarterMonth, 1),
        end: now,
      };
    }
    case 'lastQuarter': {
      const lastQuarterMonth = Math.floor(now.getMonth() / 3) * 3 - 3;
      return {
        start: new Date(now.getFullYear(), lastQuarterMonth, 1),
        end: new Date(now.getFullYear(), lastQuarterMonth + 3, 0),
      };
    }
    case 'thisYear':
      return {
        start: new Date(now.getFullYear(), 0, 1),
        end: now,
      };
    case 'lastYear':
      return {
        start: new Date(now.getFullYear() - 1, 0, 1),
        end: new Date(now.getFullYear() - 1, 11, 31),
      };
    default:
      return { start: today, end: now };
  }
};

export const reportService = {
  // Report Templates
  async getReportTemplates(tenantId: string): Promise<ReportTemplate[]> {
    const templatesRef = collection(db, COLLECTIONS.REPORT_TEMPLATES);
    const q = query(
      templatesRef,
      where('tenantId', '==', tenantId),
      where('isActive', '==', true),
      orderBy('category'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as ReportTemplate);
  },

  async getReportTemplate(tenantId: string, templateId: string): Promise<ReportTemplate | null> {
    const templateRef = doc(db, COLLECTIONS.REPORT_TEMPLATES, templateId);
    const templateDoc = await getDoc(templateRef);

    if (!templateDoc.exists() || templateDoc.data()?.tenantId !== tenantId) {
      return null;
    }

    return { id: templateDoc.id, ...templateDoc.data() } as ReportTemplate;
  },

  async createReportTemplate(
    tenantId: string,
    userId: string,
    data: ReportTemplateFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;

    const templateData: Omit<ReportTemplate, 'id'> = {
      tenantId,
      ...data,
      format: 'pdf', // Default format
      isActive: true,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REPORT_TEMPLATES), templateData as any);
    return docRef.id;
  },

  async updateReportTemplate(
    tenantId: string,
    userId: string,
    templateId: string,
    data: Partial<ReportTemplateFormData>
  ): Promise<void> {
    const templateRef = doc(db, COLLECTIONS.REPORT_TEMPLATES, templateId);
    const templateDoc = await getDoc(templateRef);

    if (!templateDoc.exists() || templateDoc.data()?.tenantId !== tenantId) {
      throw new Error('Report template not found');
    }

    await updateDoc(templateRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async deleteReportTemplate(tenantId: string, templateId: string): Promise<void> {
    const templateRef = doc(db, COLLECTIONS.REPORT_TEMPLATES, templateId);
    const templateDoc = await getDoc(templateRef);

    if (!templateDoc.exists() || templateDoc.data()?.tenantId !== tenantId) {
      throw new Error('Report template not found');
    }

    await deleteDoc(templateRef);
  },

  // Reports
  async getReports(tenantId: string, filter?: ReportQueryFilter): Promise<Report[]> {
    const reportsRef = collection(db, COLLECTIONS.REPORTS);
    let q = query(reportsRef, where('tenantId', '==', tenantId));

    if (filter?.type) {
      q = query(q, where('type', '==', filter.type));
    }
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }
    if (filter?.generatedBy) {
      q = query(q, where('generatedBy', '==', filter.generatedBy));
    }

    q = query(q, orderBy('createdAt', 'desc'), limit(100));

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as Report);
  },

  async getReport(tenantId: string, reportId: string): Promise<Report | null> {
    const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists() || reportDoc.data()?.tenantId !== tenantId) {
      return null;
    }

    return { id: reportDoc.id, ...reportDoc.data() } as Report;
  },

  async createReport(tenantId: string, userId: string, data: ReportFormData): Promise<string> {
    const now = serverTimestamp() as Timestamp;

    // Get template if specified
    let config: Record<string, unknown> = {};
    if (data.templateId) {
      const template = await this.getReportTemplate(tenantId, data.templateId);
      if (template) {
        config = template.config as unknown as Record<string, unknown>;
      }
    }

    const reportData: Omit<Report, 'id'> = {
      tenantId,
      templateId: data.templateId || '',
      templateName: data.name,
      format: data.formats?.[0] || 'pdf',
      parameters: data.filters || {},
      status: 'pending',
      generatedBy: userId,
      generatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.REPORTS), reportData);
    return docRef.id;
  },

  async updateReport(
    tenantId: string,
    userId: string,
    reportId: string,
    data: Partial<Report>
  ): Promise<void> {
    const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists() || reportDoc.data()?.tenantId !== tenantId) {
      throw new Error('Report not found');
    }

    await updateDoc(reportRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async deleteReport(tenantId: string, reportId: string): Promise<void> {
    const reportRef = doc(db, COLLECTIONS.REPORTS, reportId);
    const reportDoc = await getDoc(reportRef);

    if (!reportDoc.exists() || reportDoc.data()?.tenantId !== tenantId) {
      throw new Error('Report not found');
    }

    await deleteDoc(reportRef);
  },

  // Dashboards
  async getDashboards(tenantId: string): Promise<AnalyticsDashboard[]> {
    const dashboardsRef = collection(db, COLLECTIONS.ANALYTICS_DASHBOARDS);
    const q = query(
      dashboardsRef,
      where('tenantId', '==', tenantId),
      orderBy('isDefault', 'desc'),
      orderBy('name')
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }) as AnalyticsDashboard);
  },

  async getDashboard(tenantId: string, dashboardId: string): Promise<AnalyticsDashboard | null> {
    const dashboardRef = doc(db, COLLECTIONS.ANALYTICS_DASHBOARDS, dashboardId);
    const dashboardDoc = await getDoc(dashboardRef);

    if (!dashboardDoc.exists() || dashboardDoc.data()?.tenantId !== tenantId) {
      return null;
    }

    return { id: dashboardDoc.id, ...dashboardDoc.data() } as AnalyticsDashboard;
  },

  async createDashboard(
    tenantId: string,
    userId: string,
    data: DashboardFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;

    const dashboardData: Omit<AnalyticsDashboard, 'id'> = {
      tenantId,
      ...data,
      widgets: [],
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
    };

    const docRef = await addDoc(collection(db, COLLECTIONS.ANALYTICS_DASHBOARDS), dashboardData);
    return docRef.id;
  },

  async updateDashboard(
    tenantId: string,
    userId: string,
    dashboardId: string,
    data: Partial<AnalyticsDashboard>
  ): Promise<void> {
    const dashboardRef = doc(db, COLLECTIONS.ANALYTICS_DASHBOARDS, dashboardId);
    const dashboardDoc = await getDoc(dashboardRef);

    if (!dashboardDoc.exists() || dashboardDoc.data()?.tenantId !== tenantId) {
      throw new Error('Dashboard not found');
    }

    await updateDoc(dashboardRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });
  },

  async deleteDashboard(tenantId: string, dashboardId: string): Promise<void> {
    const dashboardRef = doc(db, COLLECTIONS.ANALYTICS_DASHBOARDS, dashboardId);
    const dashboardDoc = await getDoc(dashboardRef);

    if (!dashboardDoc.exists() || dashboardDoc.data()?.tenantId !== tenantId) {
      throw new Error('Dashboard not found');
    }

    await deleteDoc(dashboardRef);
  },

  // Analytics Metrics
  async getAnalyticsMetrics(
    tenantId: string,
    dateRange: DateRangePreset = 'last30days'
  ): Promise<AnalyticsMetrics> {
    const { start, end } = getDateRange(dateRange);
    const startTimestamp = Timestamp.fromDate(start);
    const endTimestamp = Timestamp.fromDate(end);

    // Get total counts
    const [testsSnapshot, patientsSnapshot, samplesSnapshot] = await Promise.all([
      getDocs(
        query(
          collection(db, COLLECTIONS.TEST_ORDERS),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp)
        )
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.PATIENTS),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', startTimestamp),
          where('createdAt', '<=', endTimestamp)
        )
      ),
      getDocs(
        query(
          collection(db, COLLECTIONS.SAMPLES),
          where('tenantId', '==', tenantId),
          where('collectedAt', '>=', startTimestamp),
          where('collectedAt', '<=', endTimestamp)
        )
      ),
    ]);

    const totalTests = testsSnapshot.size;
    const totalPatients = patientsSnapshot.size;
    const totalSamples = samplesSnapshot.size;

    // Calculate revenue (simplified)
    let totalRevenue = 0;
    testsSnapshot.forEach((doc) => {
      const order = doc.data();
      totalRevenue += order.totalAmount || 0;
    });

    // Calculate average turnaround time
    let totalTurnaroundTime = 0;
    let completedTests = 0;
    testsSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.status === 'completed' && order.completedAt && order.createdAt) {
        const turnaround = order.completedAt.toMillis() - order.createdAt.toMillis();
        totalTurnaroundTime += turnaround;
        completedTests++;
      }
    });
    const averageTurnaroundTime =
      completedTests > 0
        ? totalTurnaroundTime / completedTests / (1000 * 60 * 60) // Convert to hours
        : 0;

    // Get test volume trend (simplified - last 7 days)
    const testVolumeTrend = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);

      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);

      const daySnapshot = await getDocs(
        query(
          collection(db, COLLECTIONS.TEST_ORDERS),
          where('tenantId', '==', tenantId),
          where('createdAt', '>=', Timestamp.fromDate(date)),
          where('createdAt', '<', Timestamp.fromDate(nextDate))
        )
      );

      testVolumeTrend.push({
        date,
        value: daySnapshot.size,
        label: date.toLocaleDateString('en-US', { weekday: 'short' }),
      });
    }

    // Get revenue trend (simplified - same as test volume * average price)
    const avgPrice = totalRevenue / (totalTests || 1);
    const revenueTrend = testVolumeTrend.map((item) => ({
      date: item.date,
      value: item.value * avgPrice,
      label: item.label,
    }));

    // Get top tests
    const testCounts = new Map<string, { name: string; count: number }>();
    testsSnapshot.forEach((doc) => {
      const order = doc.data();
      if (order.tests) {
        order.tests.forEach((test: { testCode: string; testName: string }) => {
          const current = testCounts.get(test.testCode) || { name: test.testName, count: 0 };
          current.count++;
          testCounts.set(test.testCode, current);
        });
      }
    });

    const topTests = Array.from(testCounts.entries())
      .map(([testCode, data]) => ({ testCode, testName: data.name, count: data.count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Get department stats (simplified)
    const departmentStats = [
      { department: 'Chemistry', tests: Math.floor(totalTests * 0.4), revenue: totalRevenue * 0.4 },
      {
        department: 'Hematology',
        tests: Math.floor(totalTests * 0.3),
        revenue: totalRevenue * 0.3,
      },
      {
        department: 'Microbiology',
        tests: Math.floor(totalTests * 0.2),
        revenue: totalRevenue * 0.2,
      },
      {
        department: 'Immunology',
        tests: Math.floor(totalTests * 0.1),
        revenue: totalRevenue * 0.1,
      },
    ];

    return {
      totalTests,
      totalPatients,
      totalSamples,
      totalRevenue,
      averageTurnaroundTime,
      testVolumeTrend,
      revenueTrend,
      topTests,
      departmentStats,
    };
  },

  // Generate report
  async generateReport(tenantId: string, userId: string, reportId: string): Promise<void> {
    const startTime = Date.now();
    const report = await this.getReport(tenantId, reportId);
    if (!report) {
      throw new Error('Report not found');
    }

    // Update status to generating
    await this.updateReport(tenantId, userId, reportId, {
      status: 'generating',
      runAt: serverTimestamp() as Timestamp,
    });

    try {
      // Get template if specified
      const template = report.templateId 
        ? await this.getReportTemplate(tenantId, report.templateId)
        : null;

      // Fetch data based on template type
      const reportData = await this.fetchReportData(
        tenantId, 
        template?.type || 'custom', 
        report.parameters
      );

      // Generate report in requested format
      const fileUrl = await this.generateReportFile(
        tenantId,
        reportId,
        template,
        reportData,
        report.format,
        userId
      );

      // Update report with results
      await this.updateReport(tenantId, userId, reportId, {
        status: 'completed',
        completedAt: serverTimestamp() as Timestamp,
        fileUrl,
        output: {
          data: reportData.data || [],
          metadata: {
            generatedAt: serverTimestamp() as Timestamp,
            generatedBy: userId,
            duration: Date.now() - startTime,
            recordCount: reportData.recordCount || 0,
            parameters: report.parameters || {},
          },
        },
      });
    } catch (error) {
      await this.updateReport(tenantId, userId, reportId, {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  },

  // Fetch data based on report type
  async fetchReportData(
    tenantId: string, 
    reportType: string, 
    parameters: Record<string, any>
  ): Promise<{ data: any[]; recordCount: number }> {
    const { startDate, endDate } = parameters;
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    switch (reportType) {
      case 'patient_results': {
        const patientId = parameters.patientId;
        if (!patientId) throw new Error('Patient ID required for patient results report');
        
        const patient = await patientService.getPatient(tenantId, patientId);
        const results = await resultService.getPatientResults(tenantId, patientId);
        
        return {
          data: results,
          recordCount: results.length,
        };
      }

      case 'daily_summary': {
        const orders = await orderService.getOrdersByDateRange(tenantId, start, end);
        const samples = await sampleService.getSamplesByDateRange(tenantId, start, end);
        
        return {
          data: [
            { 
              date: start.toISOString(),
              totalOrders: orders.length,
              totalSamples: samples.length,
              completedOrders: orders.filter(o => o.status === 'completed').length,
              pendingOrders: orders.filter(o => o.status === 'pending').length,
            }
          ],
          recordCount: 1,
        };
      }

      case 'quality_control': {
        const qcRuns = await qcService.getQCRuns(tenantId, {
          startDate: start,
          endDate: end,
        });
        
        return {
          data: qcRuns,
          recordCount: qcRuns.length,
        };
      }

      case 'inventory_status': {
        const items = await inventoryService.getItems(tenantId);
        const lowStock = items.filter(item => 
          item.quantityInStock <= item.reorderLevel
        );
        
        return {
          data: lowStock,
          recordCount: lowStock.length,
        };
      }

      case 'financial_summary': {
        const invoices = await billingService.getInvoicesByDateRange(
          tenantId, 
          start, 
          end
        );
        
        const totalRevenue = invoices.reduce((sum, inv) => sum + inv.totalAmount, 0);
        const paidAmount = invoices
          .filter(inv => inv.status === 'paid')
          .reduce((sum, inv) => sum + inv.totalAmount, 0);
        
        return {
          data: [{
            period: `${start.toLocaleDateString()} - ${end.toLocaleDateString()}`,
            totalInvoices: invoices.length,
            totalRevenue,
            paidAmount,
            pendingAmount: totalRevenue - paidAmount,
            invoices,
          }],
          recordCount: invoices.length,
        };
      }

      default: {
        // Custom report - fetch all available data types
        const [orders, patients, samples] = await Promise.all([
          orderService.getOrdersByDateRange(tenantId, start, end),
          patientService.getPatients(tenantId, { limit: 100 }),
          sampleService.getSamplesByDateRange(tenantId, start, end),
        ]);
        
        return {
          data: { orders, patients, samples },
          recordCount: orders.length + patients.length + samples.length,
        };
      }
    }
  },

  // Generate report file in specified format
  async generateReportFile(
    tenantId: string,
    reportId: string,
    template: ReportTemplate | null,
    reportData: { data: any[]; recordCount: number },
    format: string,
    userId: string
  ): Promise<string> {
    const user = await getUserById(userId);
    const userName = user ? `${user.firstName} ${user.lastName}` : 'System';
    
    switch (format) {
      case 'pdf': {
        const pdf = new jsPDF({
          orientation: template?.layout?.orientation || 'portrait',
          unit: 'mm',
          format: template?.layout?.pageSize?.toLowerCase() || 'a4',
        });

        // Add header
        pdf.setFontSize(20);
        pdf.text(template?.name || 'Report', 20, 20);
        
        pdf.setFontSize(10);
        pdf.text(`Generated by: ${userName}`, 20, 30);
        pdf.text(`Date: ${new Date().toLocaleString()}`, 20, 35);
        pdf.text(`Records: ${reportData.recordCount}`, 20, 40);

        // Add content based on template sections
        const yPosition = 50;
        
        if (Array.isArray(reportData.data) && reportData.data.length > 0) {
          // Create table from data
          const headers = Object.keys(reportData.data[0]);
          const rows = reportData.data.map(item => 
            headers.map(header => String(item[header] || ''))
          );

          autoTable(pdf, {
            startY: yPosition,
            head: [headers],
            body: rows,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [79, 70, 229] },
          });
        }

        // Save PDF to blob
        const pdfBlob = pdf.output('blob');
        
        // Upload to Firebase Storage
        const fileName = `reports/${tenantId}/${reportId}.pdf`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, pdfBlob);
        
        return await getDownloadURL(storageRef);
      }

      case 'excel':
      case 'csv': {
        // Convert data to CSV
        let csvContent = '';
        
        if (Array.isArray(reportData.data) && reportData.data.length > 0) {
          const headers = Object.keys(reportData.data[0]);
          csvContent = headers.join(',') + '\n';
          
          reportData.data.forEach(row => {
            const values = headers.map(header => {
              const value = row[header];
              // Escape commas and quotes in CSV
              if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
                return `"${value.replace(/"/g, '""')}"`;
              }
              return value;
            });
            csvContent += values.join(',') + '\n';
          });
        }

        // Create blob
        const blob = new Blob([csvContent], { type: 'text/csv' });
        
        // Upload to Firebase Storage
        const fileName = `reports/${tenantId}/${reportId}.csv`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        
        return await getDownloadURL(storageRef);
      }

      case 'json': {
        // Convert to JSON
        const jsonContent = JSON.stringify(reportData, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        
        // Upload to Firebase Storage
        const fileName = `reports/${tenantId}/${reportId}.json`;
        const storageRef = ref(storage, fileName);
        await uploadBytes(storageRef, blob);
        
        return await getDownloadURL(storageRef);
      }

      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  },
};
