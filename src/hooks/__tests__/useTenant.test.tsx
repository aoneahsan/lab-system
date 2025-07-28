import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useTenant } from '../useTenant';

const mockTenant = {
  id: 'test-tenant-id',
  name: 'Test Laboratory',
  code: 'TEST_LAB',
  type: 'diagnostic_lab',
  isActive: true,
  subscription: {
    plan: 'professional',
    status: 'active',
    startDate: new Date('2024-01-01'),
    endDate: new Date('2024-12-31'),
  },
  settings: {
    features: {
      barcodeScanning: true,
      biometricAuth: true,
      offlineMode: true,
      emrIntegration: true,
    },
    workflowSettings: {
      requireResultApproval: true,
      autoReleaseNormalResults: false,
      criticalResultNotification: true,
    },
  },
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-01'),
};

const mockStore = {
  currentTenant: mockTenant,
  isLoading: false,
  error: null,
  fetchTenant: vi.fn(),
  refreshTenant: vi.fn(),
  shouldRefetch: vi.fn().mockReturnValue(false),
  clearTenant: vi.fn(),
};

// Mock the tenant store
vi.mock('@/stores/tenant.store', () => ({
  useTenantStore: vi.fn(() => mockStore),
}));

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({
    currentUser: { id: 'test-user', tenantId: 'test-tenant-id' },
  }),
}));

describe('useTenant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset the mock store to default values
    mockStore.currentTenant = mockTenant;
    mockStore.isLoading = false;
    mockStore.error = null;
  });

  it('returns current tenant data', () => {
    const { result } = renderHook(() => useTenant());

    expect(result.current.tenant).toBeDefined();
    expect(result.current.tenant?.id).toBe('test-tenant-id');
    expect(result.current.tenant?.name).toBe('Test Laboratory');
    expect(result.current.tenant?.code).toBe('TEST_LAB');
  });

  it('returns loading state', () => {
    // Update the mock store for this test
    mockStore.currentTenant = null;
    mockStore.isLoading = true;
    mockStore.error = null;

    const { result } = renderHook(() => useTenant());

    expect(result.current.isLoading).toBe(true);
    expect(result.current.tenant).toBeNull();
  });

  it('returns error state', () => {
    const testError = new Error('Failed to fetch tenant');

    // Update the mock store for this test
    mockStore.currentTenant = null;
    mockStore.isLoading = false;
    mockStore.error = testError;

    const { result } = renderHook(() => useTenant());

    expect(result.current.error).toBe(testError);
    expect(result.current.tenant).toBeNull();
  });

  it('returns correct subscription status', () => {
    const { result } = renderHook(() => useTenant());

    expect(result.current.subscription?.status).toBe('active');
    expect(result.current.subscription?.plan).toBe('professional');
  });

  it('returns correct feature flags', () => {
    const { result } = renderHook(() => useTenant());

    expect(result.current.features?.barcodeScanning).toBe(true);
    expect(result.current.features?.biometricAuth).toBe(true);
    expect(result.current.features?.offlineMode).toBe(true);
    expect(result.current.features?.emrIntegration).toBe(true);
  });

  it('returns correct workflow settings', () => {
    const { result } = renderHook(() => useTenant());

    expect(result.current.settings?.workflowSettings?.requireResultApproval).toBe(true);
    expect(result.current.settings?.workflowSettings?.autoReleaseNormalResults).toBe(false);
    expect(result.current.settings?.workflowSettings?.criticalResultNotification).toBe(true);
  });
});
