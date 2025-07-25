import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from './auth.store';

// Mock Firebase modules
vi.mock('@/config/firebase', () => ({
  auth: {},
  firestore: {},
  storage: {},
  functions: {},
  analytics: {},
  performance: {},
  remoteConfig: {},
  messaging: {},
  database: {},
}));

vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn((auth, callback) => {
    // Immediately call with null to simulate no user
    callback(null);
    return () => {};
  }),
}));

vi.mock('firebase/firestore', () => ({
  getFirestore: vi.fn(() => ({})),
  doc: vi.fn(),
  getDoc: vi.fn(),
  setDoc: vi.fn(),
  collection: vi.fn(),
  query: vi.fn(),
  where: vi.fn(),
  getDocs: vi.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset store to initial state
    useAuthStore.setState({
      currentUser: null,
      loading: false,
      error: null,
      tenantId: null,
      permissions: [],
    });
  });

  describe('state management', () => {
    it('has correct initial state', () => {
      const { result } = renderHook(() => useAuthStore());
      
      expect(result.current.currentUser).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
      expect(result.current.tenantId).toBeNull();
      expect(result.current.permissions).toEqual([]);
    });

    it('sets loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.loading).toBe(false);
    });

    it('sets error state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error message');
      });

      expect(result.current.error).toBe('Test error message');

      act(() => {
        result.current.setError(null);
      });

      expect(result.current.error).toBeNull();
    });

    it('sets current user correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        id: 'user123',
        email: 'user@example.com',
        name: 'Test User',
        role: 'lab_technician' as const,
        tenantId: 'tenant123',
        permissions: ['view_patients', 'edit_results'],
      };

      act(() => {
        result.current.setCurrentUser(mockUser);
      });

      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('sets tenant ID correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setTenantId('tenant123');
      });

      expect(result.current.tenantId).toBe('tenant123');
    });

    it('sets permissions correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      const permissions = ['view_patients', 'edit_results', 'approve_results'];

      act(() => {
        result.current.setPermissions(permissions);
      });

      expect(result.current.permissions).toEqual(permissions);
    });
  });

  describe('permission checks', () => {
    it('checks single permission correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setPermissions(['view_patients', 'edit_results']);
      });

      expect(result.current.hasPermission('view_patients')).toBe(true);
      expect(result.current.hasPermission('delete_patients')).toBe(false);
    });

    it('checks multiple permissions with ALL requirement', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setPermissions(['view_patients', 'edit_results']);
      });

      expect(
        result.current.hasPermissions(['view_patients', 'edit_results'], 'all')
      ).toBe(true);

      expect(
        result.current.hasPermissions(['view_patients', 'delete_patients'], 'all')
      ).toBe(false);
    });

    it('checks multiple permissions with ANY requirement', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setPermissions(['view_patients', 'edit_results']);
      });

      expect(
        result.current.hasPermissions(['view_patients', 'delete_patients'], 'any')
      ).toBe(true);

      expect(
        result.current.hasPermissions(['delete_patients', 'admin_access'], 'any')
      ).toBe(false);
    });
  });

  describe('role checks', () => {
    it('checks if user has specific role', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setCurrentUser({
          id: 'user123',
          email: 'admin@example.com',
          name: 'Admin User',
          role: 'admin',
          tenantId: 'tenant123',
          permissions: [],
        });
      });

      expect(result.current.hasRole('admin')).toBe(true);
      expect(result.current.hasRole('lab_technician')).toBe(false);
    });

    it('returns false when no user is logged in', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.hasRole('admin')).toBe(false);
    });
  });

  describe('authentication state', () => {
    it('identifies authenticated state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setCurrentUser({
          id: 'user123',
          email: 'user@example.com',
          name: 'Test User',
          role: 'lab_technician',
          tenantId: 'tenant123',
          permissions: [],
        });
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});