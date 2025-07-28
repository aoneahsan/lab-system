import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAuthStore } from '../auth.store';

describe('AuthStore', () => {
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
    phoneNumber: '+1234567890',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setCurrentUser(null);
    });
  });

  describe('user state', () => {
    it('should start with null user', () => {
      const { result } = renderHook(() => useAuthStore());
      expect(result.current.currentUser).toBeNull();
    });

    it('should set user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should clear user', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      expect(result.current.currentUser).toEqual(mockUser);

      act(() => {
        result.current.setCurrentUser(null);
      });

      expect(result.current.currentUser).toBeNull();
    });
  });

  describe('loading state', () => {
    it('should set loading state', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);
    });
  });

  describe('authentication state', () => {
    it('should compute isAuthenticated correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setFirebaseUser({ uid: 'test-uid' } as any);
      });

      expect(result.current.isAuthenticated).toBe(true);

      act(() => {
        result.current.setFirebaseUser(null);
      });

      expect(result.current.isAuthenticated).toBe(false);
    });
  });

  describe('edge cases', () => {
    it('should handle user state transitions', () => {
      const { result } = renderHook(() => useAuthStore());

      // Start with no user
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);

      // Set both Firebase user and current user (simulating login)
      act(() => {
        result.current.setFirebaseUser({ uid: mockUser.id } as any);
        result.current.setCurrentUser(mockUser);
      });
      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.isAuthenticated).toBe(true);

      // Clear both users (simulating logout)
      act(() => {
        result.current.setFirebaseUser(null);
        result.current.setCurrentUser(null);
      });
      expect(result.current.currentUser).toBeNull();
      expect(result.current.isAuthenticated).toBe(false);
    });
  });
});
