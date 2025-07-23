import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { reportService } from '@/services/report.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import type {
  Report,
  ReportQueryFilter,
  ReportFormData,
  ReportTemplateFormData,
  AnalyticsDashboard,
  DashboardFormData,
  DateRangePreset,
} from '@/types/report.types';

// Query keys
const REPORT_KEYS = {
  all: ['reports'] as const,
  templates: () => [...REPORT_KEYS.all, 'templates'] as const,
  template: (id: string) => [...REPORT_KEYS.templates(), id] as const,
  reports: () => [...REPORT_KEYS.all, 'reports'] as const,
  report: (id: string) => [...REPORT_KEYS.reports(), id] as const,
  reportList: (filter?: ReportQueryFilter) => [...REPORT_KEYS.reports(), filter] as const,
  dashboards: () => [...REPORT_KEYS.all, 'dashboards'] as const,
  dashboard: (id: string) => [...REPORT_KEYS.dashboards(), id] as const,
  analytics: (dateRange: DateRangePreset) => [...REPORT_KEYS.all, 'analytics', dateRange] as const,
};

// Report Templates
export const useReportTemplates = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.templates(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getReportTemplates(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};

export const useReportTemplate = (templateId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.template(templateId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getReportTemplate(currentTenant.id, templateId);
    },
    enabled: !!currentTenant && !!templateId,
  });
};

export const useCreateReportTemplate = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: ReportTemplateFormData) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.createReportTemplate(currentTenant.id, user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.templates() });
      toast.success('Report template created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create report template');
      console.error('Error creating report template:', error);
    },
  });
};

export const useUpdateReportTemplate = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ templateId, data }: { templateId: string; data: Partial<ReportTemplateFormData> }) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.updateReportTemplate(currentTenant.id, user.uid, templateId, data);
    },
    onSuccess: (_, { templateId }) => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.templates() });
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.template(templateId) });
      toast.success('Report template updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update report template');
      console.error('Error updating report template:', error);
    },
  });
};

export const useDeleteReportTemplate = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (templateId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.deleteReportTemplate(currentTenant.id, templateId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.templates() });
      toast.success('Report template deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete report template');
      console.error('Error deleting report template:', error);
    },
  });
};

// Reports
export const useReports = (filter?: ReportQueryFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.reportList(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getReports(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

export const useReport = (reportId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.report(reportId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getReport(currentTenant.id, reportId);
    },
    enabled: !!currentTenant && !!reportId,
  });
};

export const useCreateReport = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: ReportFormData) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.createReport(currentTenant.id, user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.reports() });
      toast.success('Report created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create report');
      console.error('Error creating report:', error);
    },
  });
};

export const useUpdateReport = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ reportId, data }: { reportId: string; data: Partial<Report> }) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.updateReport(currentTenant.id, user.uid, reportId, data);
    },
    onSuccess: (_, { reportId }) => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.reports() });
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.report(reportId) });
      toast.success('Report updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update report');
      console.error('Error updating report:', error);
    },
  });
};

export const useDeleteReport = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (reportId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.deleteReport(currentTenant.id, reportId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.reports() });
      toast.success('Report deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete report');
      console.error('Error deleting report:', error);
    },
  });
};

export const useGenerateReport = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (reportId: string) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.generateReport(currentTenant.id, user.uid, reportId);
    },
    onSuccess: (_, reportId) => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.report(reportId) });
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.reports() });
      toast.success('Report generation started');
    },
    onError: (error) => {
      toast.error('Failed to generate report');
      console.error('Error generating report:', error);
    },
  });
};

// Dashboards
export const useDashboards = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.dashboards(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getDashboards(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};

export const useDashboard = (dashboardId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.dashboard(dashboardId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getDashboard(currentTenant.id, dashboardId);
    },
    enabled: !!currentTenant && !!dashboardId,
  });
};

export const useCreateDashboard = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: (data: DashboardFormData) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.createDashboard(currentTenant.id, user.uid, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.dashboards() });
      toast.success('Dashboard created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create dashboard');
      console.error('Error creating dashboard:', error);
    },
  });
};

export const useUpdateDashboard = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { user } = useAuthStore();

  return useMutation({
    mutationFn: ({ dashboardId, data }: { dashboardId: string; data: Partial<AnalyticsDashboard> }) => {
      if (!currentTenant || !user) throw new Error('No tenant or user');
      return reportService.updateDashboard(currentTenant.id, user.uid, dashboardId, data);
    },
    onSuccess: (_, { dashboardId }) => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.dashboards() });
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.dashboard(dashboardId) });
      toast.success('Dashboard updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update dashboard');
      console.error('Error updating dashboard:', error);
    },
  });
};

export const useDeleteDashboard = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();

  return useMutation({
    mutationFn: (dashboardId: string) => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.deleteDashboard(currentTenant.id, dashboardId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: REPORT_KEYS.dashboards() });
      toast.success('Dashboard deleted successfully');
    },
    onError: (error) => {
      toast.error('Failed to delete dashboard');
      console.error('Error deleting dashboard:', error);
    },
  });
};

// Analytics
export const useAnalyticsMetrics = (dateRange: DateRangePreset = 'last30days') => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: REPORT_KEYS.analytics(dateRange),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return reportService.getAnalyticsMetrics(currentTenant.id, dateRange);
    },
    enabled: !!currentTenant,
    refetchInterval: 300000, // Refresh every 5 minutes
  });
};