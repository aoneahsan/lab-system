import { describe, it, expect, vi, beforeEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useAuthStore } from './auth.store';
import { auth } from '@/config/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';

// Mock Firebase auth
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  signOut: vi.fn(),
  onAuthStateChanged: vi.fn(),
}));

describe('authStore', () => {
  beforeEach(() => {
    // Reset store state
    const { result } = renderHook(() => useAuthStore());
    act(() => {
      result.current.setCurrentUser(null);
      result.current.setLoading(false);
      result.current.setError(null);
    });
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('logs in user successfully', async () => {
      const mockUser = {
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.login('test@example.com', 'password123');
      });

      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
    });

    it('handles login error', async () => {
      const error = new Error('Invalid credentials');
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.login('test@example.com', 'wrongpassword')
        ).rejects.toThrow('Invalid credentials');
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.error).toBe('Invalid credentials');
    });
  });

  describe('register', () => {
    it('registers new user successfully', async () => {
      const mockUser = {
        uid: '456',
        email: 'newuser@example.com',
        displayName: null,
      };

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await result.current.register('newuser@example.com', 'password123');
      });

      expect(result.current.currentUser).toEqual(mockUser);
      expect(result.current.error).toBeNull();
      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'newuser@example.com',
        'password123'
      );
    });

    it('handles registration error', async () => {
      const error = new Error('Email already in use');
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(
          result.current.register('existing@example.com', 'password123')
        ).rejects.toThrow('Email already in use');
      });

      expect(result.current.currentUser).toBeNull();
      expect(result.current.error).toBe('Email already in use');
    });
  });

  describe('logout', () => {
    it('logs out user successfully', async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);

      const { result } = renderHook(() => useAuthStore());

      // Set initial user
      act(() => {
        result.current.setCurrentUser({
          uid: '123',
          email: 'test@example.com',
          displayName: 'Test User',
        } as any);
      });

      expect(result.current.currentUser).not.toBeNull();

      await act(async () => {
        await result.current.logout();
      });

      expect(result.current.currentUser).toBeNull();
      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('handles logout error', async () => {
      const error = new Error('Logout failed');
      vi.mocked(signOut).mockRejectedValue(error);

      const { result } = renderHook(() => useAuthStore());

      await act(async () => {
        await expect(result.current.logout()).rejects.toThrow('Logout failed');
      });

      expect(result.current.error).toBe('Logout failed');
    });
  });

  describe('state management', () => {
    it('sets loading state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.loading).toBe(false);

      act(() => {
        result.current.setLoading(true);
      });

      expect(result.current.loading).toBe(true);
    });

    it('sets error state correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      expect(result.current.error).toBeNull();

      act(() => {
        result.current.setError('Test error');
      });

      expect(result.current.error).toBe('Test error');
    });

    it('sets current user correctly', () => {
      const { result } = renderHook(() => useAuthStore());

      const mockUser = {
        uid: '789',
        email: 'user@example.com',
        displayName: 'User',
      };

      act(() => {
        result.current.setCurrentUser(mockUser as any);
      });

      expect(result.current.currentUser).toEqual(mockUser);
    });
  });
});