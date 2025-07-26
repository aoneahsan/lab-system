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
      expect(result.current.isLoading).toBe(true); // Initial loading state is true
      expect(result.current.error).toBeNull();
    });

    it('sets loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });

    it('sets error state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.error).toBeNull();

      const testError = new Error('Test error message');
      act(() => {
        result.current.setError(testError);
      });

      expect(result.current.error).toBe(testError);

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

  });


  describe('authentication state', () => {
    it('identifies authenticated state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.isAuthenticated).toBe(false);

      act(() => {
        result.current.setFirebaseUser({ uid: 'user123' } as any);
      });

      expect(result.current.isAuthenticated).toBe(true);
    });
  });
});