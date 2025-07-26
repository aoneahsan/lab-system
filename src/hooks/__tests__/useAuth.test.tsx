import { describe, it, expect, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { useLogin, useRegister, useLogout, useResetPassword } from '../useAuth';
import * as authService from '@/services/auth.service';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from 'sonner';

vi.mock('@/services/auth.service');
vi.mock('sonner');

// Mock auth store
vi.mock('@/stores/auth.store', () => ({
  useAuthStore: vi.fn(() => ({
    setCurrentUser: vi.fn(),
    setFirebaseUser: vi.fn(),
    setLoading: vi.fn(),
    logout: vi.fn(),
  })),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

describe('Auth Hooks', () => {
  const mockUser = {
    id: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
    firstName: 'Test',
    lastName: 'User',
    role: 'lab_technician' as const,
    tenantId: 'tenant-1',
    permissions: [],
    isActive: true,
    isEmailVerified: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  describe('useLogin', () => {
    it('should login successfully', async () => {
      const setCurrentUser = vi.fn();
      vi.mocked(useAuthStore).mockReturnValue({
        setCurrentUser,
        setFirebaseUser: vi.fn(),
        setLoading: vi.fn(),
        logout: vi.fn(),
      } as any);

      vi.mocked(authService.login).mockResolvedValue(mockUser);
      vi.mocked(toast.success).mockImplementation(() => {});

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(authService.login).toHaveBeenCalledWith('test@example.com', 'password123');
      expect(setCurrentUser).toHaveBeenCalledWith(mockUser);
      expect(toast.success).toHaveBeenCalledWith('Login successful');
    });

    it('should handle login error', async () => {
      vi.mocked(authService.login).mockRejectedValue(new Error('Invalid credentials'));
      vi.mocked(toast.error).mockImplementation(() => {});

      const { result } = renderHook(() => useLogin(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            email: 'test@example.com',
            password: 'wrong-password',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
    });
  });

  describe('useRegister', () => {
    it('should register successfully', async () => {
      const setCurrentUser = vi.fn();
      vi.mocked(useAuthStore).mockReturnValue({
        setCurrentUser,
        setFirebaseUser: vi.fn(),
        setLoading: vi.fn(),
        logout: vi.fn(),
      } as any);

      vi.mocked(authService.register).mockResolvedValue(mockUser);
      vi.mocked(toast.success).mockImplementation(() => {});

      const { result } = renderHook(() => useRegister(), {
        wrapper: createWrapper(),
      });

      const registerData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'patient' as const,
        tenantId: 'tenant-1',
      };

      await act(async () => {
        await result.current.mutateAsync(registerData);
      });

      expect(authService.register).toHaveBeenCalledWith(registerData);
      expect(setCurrentUser).toHaveBeenCalledWith(mockUser);
      expect(toast.success).toHaveBeenCalledWith('Registration successful');
    });

    it('should handle registration error', async () => {
      vi.mocked(authService.register).mockRejectedValue(new Error('Email already exists'));
      vi.mocked(toast.error).mockImplementation(() => {});

      const { result } = renderHook(() => useRegister(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({
            email: 'test@example.com',
            password: 'password123',
            firstName: 'Test',
            lastName: 'User',
            role: 'patient' as const,
            tenantId: 'tenant-1',
          });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Email already exists');
    });
  });

  describe('useLogout', () => {
    it('should logout successfully', async () => {
      const logout = vi.fn().mockResolvedValue(undefined);
      vi.mocked(useAuthStore).mockReturnValue({
        setCurrentUser: vi.fn(),
        setFirebaseUser: vi.fn(),
        setLoading: vi.fn(),
        logout,
      } as any);

      vi.mocked(toast.success).mockImplementation(() => {});

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync();
      });

      expect(logout).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith('Logged out successfully');
    });

    it('should handle logout error', async () => {
      const logout = vi.fn().mockRejectedValue(new Error('Logout failed'));
      vi.mocked(useAuthStore).mockReturnValue({
        setCurrentUser: vi.fn(),
        setFirebaseUser: vi.fn(),
        setLoading: vi.fn(),
        logout,
      } as any);

      vi.mocked(toast.error).mockImplementation(() => {});

      const { result } = renderHook(() => useLogout(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync();
        } catch (error) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('Logout failed');
    });
  });

  describe('useResetPassword', () => {
    it('should send reset password email successfully', async () => {
      vi.mocked(authService.resetPassword).mockResolvedValue(undefined);
      vi.mocked(toast.success).mockImplementation(() => {});

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        await result.current.mutateAsync({ email: 'test@example.com' });
      });

      expect(authService.resetPassword).toHaveBeenCalledWith('test@example.com');
      expect(toast.success).toHaveBeenCalledWith('Password reset email sent');
    });

    it('should handle reset password error', async () => {
      vi.mocked(authService.resetPassword).mockRejectedValue(new Error('User not found'));
      vi.mocked(toast.error).mockImplementation(() => {});

      const { result } = renderHook(() => useResetPassword(), {
        wrapper: createWrapper(),
      });

      await act(async () => {
        try {
          await result.current.mutateAsync({ email: 'nonexistent@example.com' });
        } catch (error) {
          // Expected to throw
        }
      });

      expect(toast.error).toHaveBeenCalledWith('User not found');
    });
  });
});