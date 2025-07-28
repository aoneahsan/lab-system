import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { usePatients, usePatient, useCreatePatient } from './usePatients';
import { patientService } from '@/services/patient.service';
import { createMockPatient } from '@/test/utils';
import React from 'react';

// Mock performance monitoring
vi.mock('@/utils/performance-monitoring', () => ({
  performanceMonitor: {
    trackApiCall: vi.fn(async (traceName, fn) => {
      if (typeof fn === 'function') {
        return await fn();
      }
      return fn;
    }),
    trackRender: vi.fn(),
    startTrace: vi.fn(),
    stopTrace: vi.fn(),
    reportMetrics: vi.fn(),
  },
}));

// Mock the patient service
vi.mock('@/services/patient.service', () => ({
  patientService: {
    searchPatients: vi.fn(),
    getPatient: vi.fn(),
    createPatient: vi.fn(),
    updatePatient: vi.fn(),
    deletePatient: vi.fn(),
  },
}));

// Mock tenant hook
vi.mock('@/hooks/useTenant', () => ({
  useTenant: () => ({ tenant: { id: 'test-tenant' } }),
}));

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: () => ({ currentUser: { id: 'test-user' } }),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('usePatients', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches patients successfully', async () => {
    const mockPatients = [
      createMockPatient({ id: '1', firstName: 'John' }),
      createMockPatient({ id: '2', firstName: 'Jane' }),
    ];

    vi.mocked(patientService.searchPatients).mockResolvedValue({
      patients: mockPatients,
      total: 2,
      page: 1,
      pageSize: 10,
    });

    const { result } = renderHook(() => usePatients(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isLoading).toBe(true);

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.data?.patients).toHaveLength(2);
    expect(result.current.data?.patients[0].firstName).toBe('John');
    expect(result.current.data?.patients[1].firstName).toBe('Jane');
  });

  it('handles error when fetching patients fails', async () => {
    const error = new Error('Failed to fetch patients');
    vi.mocked(patientService.searchPatients).mockRejectedValue(error);

    const { result } = renderHook(() => usePatients(), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });

  it('applies search filter correctly', async () => {
    const { result } = renderHook(() => usePatients({ search: 'john' }), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(patientService.searchPatients).toHaveBeenCalledWith(
        'test-tenant',
        { search: 'john' },
        20
      );
    });
  });
});

describe('usePatient', () => {
  it('fetches a single patient successfully', async () => {
    const mockPatient = createMockPatient({ id: '1' });
    vi.mocked(patientService.getPatient).mockResolvedValue(mockPatient);

    const { result } = renderHook(() => usePatient('1'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data).toEqual(mockPatient);
    expect(patientService.getPatient).toHaveBeenCalledWith('test-tenant', '1');
  });

  it('returns undefined when patientId is not provided', () => {
    vi.clearAllMocks(); // Clear previous calls

    const { result } = renderHook(() => usePatient(undefined as any), {
      wrapper: createWrapper(),
    });

    expect(result.current.data).toBeUndefined();
    expect(patientService.getPatient).not.toHaveBeenCalled();
  });
});

describe('useCreatePatient', () => {
  it('creates a patient successfully', async () => {
    const newPatient = createMockPatient({ id: '3' });
    vi.mocked(patientService.createPatient).mockResolvedValue(newPatient);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });

    const patientData = {
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1990-01-01'),
      gender: 'male',
      email: 'john@example.com',
      phone: '+1234567890',
    };

    await result.current.mutateAsync(patientData);

    expect(patientService.createPatient).toHaveBeenCalledWith(
      'test-tenant',
      patientData,
      'test-user'
    );
  });

  it('handles error when creating patient fails', async () => {
    const error = new Error('Failed to create patient');
    vi.mocked(patientService.createPatient).mockRejectedValue(error);

    const { result } = renderHook(() => useCreatePatient(), {
      wrapper: createWrapper(),
    });

    await expect(result.current.mutateAsync({ firstName: 'John' } as any)).rejects.toThrow(
      'Failed to create patient'
    );
  });
});
