import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  EmailAuthProvider,
  reauthenticateWithCredential,
  updatePassword,
  User,
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import * as authService from '../auth.service';
import { auth, db } from '@/lib/firebase';

// Mock Firebase modules
vi.mock('firebase/auth');
vi.mock('firebase/firestore');
vi.mock('@/lib/firebase', () => ({
  auth: {
    currentUser: { uid: 'test-uid', email: 'test@example.com' },
  },
  db: {},
}));

describe('AuthService', () => {
  const mockUser = {
    uid: 'test-uid',
    email: 'test@example.com',
    displayName: 'Test User',
  } as User;

  const mockUserData = {
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
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const result = await authService.login('test@example.com', 'password123');

      expect(signInWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        'test@example.com',
        'password123'
      );
      expect(getDoc).toHaveBeenCalled();
      expect(result).toEqual(mockUserData);
    });

    it('should throw error if user document not found', async () => {
      vi.mocked(signInWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      await expect(authService.login('test@example.com', 'password123')).rejects.toThrow(
        'User data not found'
      );
    });

    it('should handle login errors', async () => {
      vi.mocked(signInWithEmailAndPassword).mockRejectedValue(new Error('Invalid credentials'));

      await expect(authService.login('test@example.com', 'wrong-password')).rejects.toThrow(
        'Invalid credentials'
      );
    });
  });

  describe('register', () => {
    it('should register user successfully', async () => {
      vi.mocked(createUserWithEmailAndPassword).mockResolvedValue({
        user: mockUser,
      } as any);

      vi.mocked(updateProfile).mockResolvedValue(undefined);
      vi.mocked(setDoc).mockResolvedValue(undefined);

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'patient' as const,
        tenantId: 'tenant-1',
      };

      const result = await authService.register(userData);

      expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(
        auth,
        userData.email,
        userData.password
      );
      expect(updateProfile).toHaveBeenCalledWith(mockUser, { displayName: 'Test User' });
      expect(setDoc).toHaveBeenCalled();
      expect(result).toMatchObject({
        id: mockUser.uid,
        email: userData.email,
        displayName: 'Test User',
        firstName: userData.firstName,
        lastName: userData.lastName,
        role: userData.role,
        tenantId: userData.tenantId,
      });
    });

    it('should handle registration errors', async () => {
      vi.mocked(createUserWithEmailAndPassword).mockRejectedValue(
        new Error('Email already in use')
      );

      const userData = {
        email: 'test@example.com',
        password: 'password123',
        firstName: 'Test',
        lastName: 'User',
        role: 'patient' as const,
        tenantId: 'tenant-1',
      };

      await expect(authService.register(userData)).rejects.toThrow('Email already in use');
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      vi.mocked(signOut).mockResolvedValue(undefined);

      await authService.logout();

      expect(signOut).toHaveBeenCalledWith(auth);
    });

    it('should handle logout errors', async () => {
      vi.mocked(signOut).mockRejectedValue(new Error('Logout failed'));

      await expect(authService.logout()).rejects.toThrow('Logout failed');
    });
  });

  describe('resetPassword', () => {
    it('should send password reset email successfully', async () => {
      vi.mocked(sendPasswordResetEmail).mockResolvedValue(undefined);

      await authService.resetPassword('test@example.com');

      expect(sendPasswordResetEmail).toHaveBeenCalledWith(auth, 'test@example.com');
    });

    it('should handle password reset errors', async () => {
      vi.mocked(sendPasswordResetEmail).mockRejectedValue(new Error('User not found'));

      await expect(authService.resetPassword('test@example.com')).rejects.toThrow('User not found');
    });
  });

  describe('updateUserProfile', () => {
    it('should update user profile successfully', async () => {
      vi.mocked(updateDoc).mockResolvedValue(undefined);

      const updates = {
        displayName: 'Updated User',
        phoneNumber: '+1234567890',
      };

      await authService.updateUserProfile('test-uid', updates);

      expect(updateDoc).toHaveBeenCalledWith(doc(db, 'users', 'test-uid'), {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    });

    it('should handle profile update errors', async () => {
      vi.mocked(updateDoc).mockRejectedValue(new Error('Update failed'));

      const updates = {
        displayName: 'Updated User',
      };

      await expect(authService.updateUserProfile('test-uid', updates)).rejects.toThrow(
        'Update failed'
      );
    });
  });

  describe('getUserById', () => {
    it('should get user by id successfully', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => true,
        data: () => mockUserData,
      } as any);

      const result = await authService.getUserById('test-uid');

      expect(getDoc).toHaveBeenCalledWith(doc(db, 'users', 'test-uid'));
      expect(result).toEqual(mockUserData);
    });

    it('should return null if user not found', async () => {
      vi.mocked(getDoc).mockResolvedValue({
        exists: () => false,
      } as any);

      const result = await authService.getUserById('non-existent');

      expect(result).toBeNull();
    });
  });

  describe('changePassword', () => {
    it('should handle change password request', async () => {
      vi.mocked(EmailAuthProvider.credential).mockReturnValue({} as any);
      vi.mocked(reauthenticateWithCredential).mockResolvedValue({} as any);
      vi.mocked(updatePassword).mockResolvedValue(undefined);

      await authService.changePassword('old-password', 'new-password');

      expect(EmailAuthProvider.credential).toHaveBeenCalledWith('test@example.com', 'old-password');
      expect(reauthenticateWithCredential).toHaveBeenCalled();
      expect(updatePassword).toHaveBeenCalledWith(auth.currentUser, 'new-password');
    });
  });
});
