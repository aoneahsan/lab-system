import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { authService } from '../auth.service';
import { UserRole } from '@/types/auth.types';

// Mock Firebase modules
vi.mock('firebase/auth');
vi.mock('firebase/firestore');

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should successfully login a user', async () => {
      const mockUser = {
        uid: 'test-uid',
        email: 'test@example.com',
        displayName: 'Test User',
      };
      
      const mockUserDoc = {
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          role: UserRole.LAB_TECHNICIAN,
          tenantId: 'tenant-123',
          active: true,
        }),
      };

      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);
      
      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);

      const result = await authService.login('test@example.com', 'password');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com',
        'password'
      );
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('test@example.com');
    });

    it('should throw error for invalid credentials', async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(
        new Error('Invalid credentials')
      );

      await expect(
        authService.login('test@example.com', 'wrongpassword')
      ).rejects.toThrow('Invalid credentials');
    });
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        uid: 'new-user-uid',
        email: 'newuser@example.com',
      };

      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);
      
      vi.mocked(updateProfile).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const result = await authService.register({
        email: 'newuser@example.com',
        password: 'password123',
        displayName: 'New User',
        role: UserRole.PATIENT,
        tenantId: 'tenant-123',
      });

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        expect.anything(),
        'newuser@example.com',
        'password123'
      );
      expect(updateProfile).toHaveBeenCalledWith(mockUser, {
        displayName: 'New User',
      });
      expect(setDoc).toHaveBeenCalled();
      expect(result.user).toBeDefined();
    });

    it('should throw error for duplicate email', async () => {
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(
        new Error('Email already in use')
      );

      await expect(
        authService.register({
          email: 'existing@example.com',
          password: 'password123',
          displayName: 'User',
          role: UserRole.PATIENT,
          tenantId: 'tenant-123',
        })
      ).rejects.toThrow('Email already in use');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email', async () => {
      vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

      await authService.resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(
        expect.anything(),
        'test@example.com'
      );
    });

    it('should throw error for non-existent email', async () => {
      vi.mocked(sendPasswordResetEmail).mockRejectedValue(
        new Error('User not found')
      );

      await expect(
        authService.resetPassword('nonexistent@example.com')
      ).rejects.toThrow('User not found');
    });
  });

  describe('logout', () => {
    it('should successfully logout user', async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalledWith(expect.anything());
    });
  });

  describe('getUserById', () => {
    it('should return user data for valid user ID', async () => {
      const mockUserDoc = {
        exists: () => true,
        id: 'user-123',
        data: () => ({
          email: 'test@example.com',
          displayName: 'Test User',
          role: UserRole.CLINICIAN,
          tenantId: 'tenant-123',
          active: true,
        }),
      };

      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);

      const user = await authService.getUserById('user-123');

      expect(getDoc).toHaveBeenCalled();
      expect(user).toBeDefined();
      expect(user?.id).toBe('user-123');
      expect(user?.email).toBe('test@example.com');
      expect(user?.role).toBe(UserRole.CLINICIAN);
    });

    it('should return null for non-existent user', async () => {
      const mockUserDoc = {
        exists: () => false,
      };

      vi.mocked(getDoc).mockResolvedValue(mockUserDoc as any);

      const user = await authService.getUserById('non-existent');

      expect(user).toBeNull();
    });
  });
});