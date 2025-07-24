import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { qcService } from '@/services/qc.service';
import { useTenantStore } from '@/stores/tenant.store';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/hooks/useToast';
import type {
  QCMaterial,
  // QCRun,
  // QCStatistics,
  QCFilter,
  QCMaterialFormData,
  QCRunFormData,
  LeveyJenningsData,
} from '@/types/qc.types';

// Query keys
const QC_KEYS = {
  all: ['qc'] as const,
  materials: () => [...QC_KEYS.all, 'materials'] as const,
  material: (id: string) => [...QC_KEYS.materials(), id] as const,
  runs: () => [...QC_KEYS.all, 'runs'] as const,
  run: (filter?: QCFilter) => [...QC_KEYS.runs(), filter] as const,
  runDetail: (id: string) => [...QC_KEYS.runs(), id] as const,
  statistics: () => [...QC_KEYS.all, 'statistics'] as const,
  statistic: (materialId: string, testCode: string) => [...QC_KEYS.statistics(), materialId, testCode] as const,
  dashboard: () => [...QC_KEYS.all, 'dashboard'] as const,
  leveyJennings: (materialId: string, testCode: string) => [...QC_KEYS.all, 'levey-jennings', materialId, testCode] as const,
};

// QC Materials
export const useQCMaterials = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.materials(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return qcService.getQCMaterials(currentTenant.id);
    },
    enabled: !!currentTenant,
  });
};

export const useQCMaterial = (materialId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.material(materialId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return qcService.getQCMaterial(currentTenant.id, materialId);
    },
    enabled: !!currentTenant && !!materialId,
  });
};

export const useCreateQCMaterial = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: QCMaterialFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return qcService.createQCMaterial(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QC_KEYS.materials() });
      toast.success('QC Material created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create QC material');
      console.error('Error creating QC material:', error);
    },
  });
};

export const useUpdateQCMaterial = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ materialId, data }: { materialId: string; data: Partial<QCMaterial> }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return qcService.updateQCMaterial(currentTenant.id, currentUser.id, materialId, data);
    },
    onSuccess: (_, { materialId }) => {
      queryClient.invalidateQueries({ queryKey: QC_KEYS.materials() });
      queryClient.invalidateQueries({ queryKey: QC_KEYS.material(materialId) });
      toast.success('QC Material updated successfully');
    },
    onError: (error) => {
      toast.error('Failed to update QC material');
      console.error('Error updating QC material:', error);
    },
  });
};

// QC Runs
export const useQCRuns = (filter?: QCFilter) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.run(filter),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return qcService.getQCRuns(currentTenant.id, filter);
    },
    enabled: !!currentTenant,
  });
};

export const useQCRun = (runId: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.runDetail(runId),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return qcService.getQCRun(currentTenant.id, runId);
    },
    enabled: !!currentTenant && !!runId,
  });
};

export const useCreateQCRun = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: (data: QCRunFormData) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return qcService.createQCRun(currentTenant.id, currentUser.id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QC_KEYS.runs() });
      queryClient.invalidateQueries({ queryKey: QC_KEYS.statistics() });
      queryClient.invalidateQueries({ queryKey: QC_KEYS.dashboard() });
      toast.success('QC Run created successfully');
    },
    onError: (error) => {
      toast.error('Failed to create QC run');
      console.error('Error creating QC run:', error);
    },
  });
};

export const useReviewQCRun = () => {
  const queryClient = useQueryClient();
  const { currentTenant } = useTenantStore();
  const { currentUser } = useAuthStore();

  return useMutation({
    mutationFn: ({ runId, accept, comments }: { runId: string; accept: boolean; comments?: string }) => {
      if (!currentTenant || !currentUser) throw new Error('No tenant or user');
      return qcService.reviewQCRun(currentTenant.id, currentUser.id, runId, accept, comments);
    },
    onSuccess: (_, { runId }) => {
      queryClient.invalidateQueries({ queryKey: QC_KEYS.runs() });
      queryClient.invalidateQueries({ queryKey: QC_KEYS.runDetail(runId) });
      queryClient.invalidateQueries({ queryKey: QC_KEYS.dashboard() });
      toast.success('QC Run reviewed successfully');
    },
    onError: (error) => {
      toast.error('Failed to review QC run');
      console.error('Error reviewing QC run:', error);
    },
  });
};

// QC Statistics
export const useQCStatistics = (materialId: string, testCode: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.statistic(materialId, testCode),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return qcService.getQCStatistics(currentTenant.id, materialId, testCode);
    },
    enabled: !!currentTenant && !!materialId && !!testCode,
  });
};

// Dashboard
export const useQCDashboard = () => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.dashboard(),
    queryFn: () => {
      if (!currentTenant) throw new Error('No tenant selected');
      return qcService.getQCDashboardStats(currentTenant.id);
    },
    enabled: !!currentTenant,
    refetchInterval: 60000, // Refresh every minute
  });
};

// Levey-Jennings Chart Data
export const useLeveyJenningsData = (materialId: string, testCode: string) => {
  const { currentTenant } = useTenantStore();

  return useQuery({
    queryKey: QC_KEYS.leveyJennings(materialId, testCode),
    queryFn: async () => {
      if (!currentTenant) throw new Error('No tenant selected');
      
      // Get material and statistics
      const [material, statistics] = await Promise.all([
        qcService.getQCMaterial(currentTenant.id, materialId),
        qcService.getQCStatistics(currentTenant.id, materialId, testCode),
      ]);
      
      if (!material || !statistics) {
        throw new Error('Material or statistics not found');
      }
      
      const analyte = material.analytes.find(a => a.testCode === testCode);
      if (!analyte) {
        throw new Error('Test not found in material');
      }
      
      // Convert data points for chart
      const chartData: LeveyJenningsData = {
        testName: analyte.testName,
        unit: analyte.unit,
        mean: statistics.mean,
        sd: statistics.sd,
        ucl: statistics.mean + 3 * statistics.sd,
        uwl: statistics.mean + 2 * statistics.sd,
        lcl: statistics.mean - 3 * statistics.sd,
        lwl: statistics.mean - 2 * statistics.sd,
        points: statistics.dataPoints.map(dp => ({
          date: dp.runDate.toDate(),
          value: dp.value,
          status: dp.status,
          runId: dp.runId,
          violatedRules: [], // TODO: Get from run details
        })),
      };
      
      return chartData;
    },
    enabled: !!currentTenant && !!materialId && !!testCode,
  });
};