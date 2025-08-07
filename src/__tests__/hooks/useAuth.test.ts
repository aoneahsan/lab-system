import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth } from '@/hooks/useAuth';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { customRender } from '@/test/test-utils';

// Mock Firebase auth functions
vi.mock('firebase/auth');

describe('useAuth Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('signs in user successfully', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com',
      displayName: 'Test User',
    };

    vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signIn('test@example.com', 'password');
      expect(response.user).toEqual(mockUser);
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      'test@example.com',
      'password'
    );
  });

  it('handles sign in error', async () => {
    const mockError = new Error('Invalid credentials');
    vi.mocked(signInWithEmailAndPassword).mockRejectedValue(mockError);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      try {
        await result.current.signIn('test@example.com', 'wrong-password');
      } catch (error) {
        expect(error).toBe(mockError);
      }
    });
  });

  it('signs up user successfully', async () => {
    const mockUser = {
      uid: 'new-uid',
      email: 'new@example.com',
      displayName: null,
    };

    vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
      user: mockUser,
    } as any);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      const response = await result.current.signUp('new@example.com', 'password');
      expect(response.user).toEqual(mockUser);
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
      expect.any(Object),
      'new@example.com',
      'password'
    );
  });

  it('signs out user successfully', async () => {
    vi.mocked(signOut).mockResolvedValue(undefined);

    const { result } = renderHook(() => useAuth());

    await act(async () => {
      await result.current.signOut();
    });

    expect(signOut).toHaveBeenCalledWith(expect.any(Object));
  });

  it('returns loading state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.loading).toBeDefined();
    expect(typeof result.current.loading).toBe('boolean');
  });

  it('returns user state', () => {
    const { result } = renderHook(() => useAuth());
    expect(result.current.user).toBeDefined();
  });

  it('handles authentication state changes', async () => {
    const mockUser = {
      uid: 'state-change-uid',
      email: 'state@example.com',
    };

    // Mock onAuthStateChanged
    const authStateCallbacks: ((user: any) => void)[] = [];
    vi.mock('@/config/firebase', () => ({
      auth: {
        onAuthStateChanged: (callback: (user: any) => void) => {
          authStateCallbacks.push(callback);
          return () => {
            const index = authStateCallbacks.indexOf(callback);
            if (index > -1) authStateCallbacks.splice(index, 1);
          };
        },
      },
    }));

    const { result } = renderHook(() => useAuth());

    // Simulate auth state change
    act(() => {
      authStateCallbacks.forEach(cb => cb(mockUser));
    });

    await waitFor(() => {
      expect(result.current.user).toBeTruthy();
    });
  });
});