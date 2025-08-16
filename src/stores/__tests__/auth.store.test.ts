import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../auth.store';
import * as authService from '@/services/auth.service';

// Mock the auth service
vi.mock('@/services/auth.service', () => ({
  loginUser: vi.fn(),
  logoutUser: vi.fn(),
  registerUser: vi.fn(),
  updateUserProfile: vi.fn(),
  resetPassword: vi.fn(),
  getCurrentUser: vi.fn(),
  onAuthStateChange: vi.fn(),
}));

describe('AuthStore', () => {
  beforeEach(() => {
    // Reset store state
    act(() => {
      useAuthStore.setState({
        user: null,
        currentUser: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
        tenantId: null,
        permissions: [],
      });
    });
    vi.clearAllMocks();
  });

  describe('Initial State', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.user).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.tenantId).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });
  });

  describe('Login', () => {
    it('successfully logs in user', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      const mockUserData = {
        id: '123',
        email: 'test@example.com',
        name: 'Test User',
        role: 'admin',
        tenantId: 'tenant-123',
        permissions: ['read', 'write'],
      };

      vi.mocked(authService.loginUser).mockResolvedValue({
        user: mockUser,
        userData: mockUserData,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.currentUser).toEqual(mockUserData);
      expect(result.current.tenantId).toBe('tenant-123');
      expect(result.current.permissions).toEqual(['read', 'write']);
      expect(result.current.error).toBeNull();
    });

    it('handles login failure', async () => {
      const errorMessage = 'Invalid credentials';
      vi.mocked(authService.loginUser).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'wrongpassword');
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.error).toBe(errorMessage);
    });

    it('sets loading state during login', async () => {
      vi.mocked(authService.loginUser).mockImplementation(
        () => new Promise((resolve) => setTimeout(resolve, 100))
      );

      const { result } = renderHook(() => useAuthStore());

      const loginPromise = act(async () => {
        await result.current.login('test@example.com', 'password');
      });

      // Check loading state immediately after calling login
      expect(result.current.isLoading).toBe(true);

      await loginPromise;

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('Logout', () => {
    it('successfully logs out user', async () => {
      // Set initial authenticated state
      act(() => {
        useAuthStore.setState({
          user: { uid: '123', email: 'test@example.com' },
          isAuthenticated: true,
          currentUser: { id: '123', email: 'test@example.com' },
          tenantId: 'tenant-123',
          permissions: ['read', 'write'],
        });
      });

      vi.mocked(authService.logoutUser).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
      expect(result.current.currentUser).toBeNull();
      expect(result.current.tenantId).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });

    it('handles logout failure gracefully', async () => {
      vi.mocked(authService.logoutUser).mockRejectedValue(new Error('Logout failed'));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.logout();
      });

      // Should still clear user state even if logout fails
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBeNull();
    });
  });

  describe('Register', () => {
    it('successfully registers new user', async () => {
      const mockUser = {
        uid: '456',
        email: 'newuser@example.com',
        displayName: 'New User',
      };

      const mockUserData = {
        id: '456',
        email: 'newuser@example.com',
        name: 'New User',
        role: 'user',
        tenantId: 'tenant-456',
        permissions: ['read'],
      };

      vi.mocked(authService.registerUser).mockResolvedValue({
        user: mockUser,
        userData: mockUserData,
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: 'newuser@example.com',
          password: 'password123',
          name: 'New User',
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual(mockUser);
      expect(result.current.currentUser).toEqual(mockUserData);
    });

    it('handles registration failure', async () => {
      const errorMessage = 'Email already in use';
      vi.mocked(authService.registerUser).mockRejectedValue(new Error(errorMessage));

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register({
          email: 'existing@example.com',
          password: 'password123',
          name: 'User',
        });
      });

      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.error).toBe(errorMessage);
    });
  });

  describe('Permissions', () => {
    it('checks single permission correctly', () => {
      act(() => {
        useAuthStore.setState({
          permissions: ['read', 'write', 'delete'],
        });
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasPermission('read')).toBe(true);
      expect(result.current.hasPermission('write')).toBe(true);
      expect(result.current.hasPermission('admin')).toBe(false);
    });

    it('checks multiple permissions with AND logic', () => {
      act(() => {
        useAuthStore.setState({
          permissions: ['read', 'write'],
        });
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasAllPermissions(['read', 'write'])).toBe(true);
      expect(result.current.hasAllPermissions(['read', 'write', 'delete'])).toBe(false);
    });

    it('checks multiple permissions with OR logic', () => {
      act(() => {
        useAuthStore.setState({
          permissions: ['read'],
        });
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasAnyPermission(['read', 'write'])).toBe(true);
      expect(result.current.hasAnyPermission(['write', 'delete'])).toBe(false);
    });
  });

  describe('Role Checking', () => {
    it('checks user role correctly', () => {
      act(() => {
        useAuthStore.setState({
          currentUser: {
            id: '123',
            email: 'test@example.com',
            role: 'admin',
          },
        });
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('user')).toBe(false);
    });

    it('checks multiple roles', () => {
      act(() => {
        useAuthStore.setState({
          currentUser: {
            id: '123',
            email: 'test@example.com',
            role: 'lab_technician',
          },
        });
      });

      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasAnyRole(['admin', 'lab_technician'])).toBe(true);
      expect(result.current.hasAnyRole(['admin', 'doctor'])).toBe(false);
    });
  });

  describe('Update Profile', () => {
    it('successfully updates user profile', async () => {
      const updatedData = {
        name: 'Updated Name',
        phone: '1234567890',
      };

      vi.mocked(authService.updateUserProfile).mockResolvedValue({
        ...updatedData,
        id: '123',
        email: 'test@example.com',
      });

      act(() => {
        useAuthStore.setState({
          currentUser: {
            id: '123',
            email: 'test@example.com',
            name: 'Old Name',
          },
        });
      });

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.updateProfile(updatedData);
      });

      expect(result.current.currentUser?.name).toBe('Updated Name');
      expect(result.current.currentUser?.phone).toBe('1234567890');
    });
  });

  describe('Clear Error', () => {
    it('clears error state', () => {
      act(() => {
        useAuthStore.setState({
          error: 'Some error message',
        });
      });

      const { result } = renderHook(() => useAuthStore());
      expect(result.current.error).toBe('Some error message');

      act(() => {
        result.current.clearError();
      });

      expect(result.current.error).toBeNull();
    });
  });

  describe('Initialize Auth', () => {
    it('initializes auth state from existing session', () => {
      const mockUnsubscribe = vi.fn();
      vi.mocked(authService.onAuthStateChange).mockImplementation((callback) => {
        // Simulate auth state change
        callback({
          user: { uid: '789', email: 'session@example.com' },
          userData: {
            id: '789',
            email: 'session@example.com',
            role: 'user',
            permissions: ['read'],
          },
        });
        return mockUnsubscribe;
      });

      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.initializeAuth();
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('session@example.com');
    });
  });
});