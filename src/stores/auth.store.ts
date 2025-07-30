import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  onAuthStateChanged,
  type User as FirebaseUser,
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, firestore } from '@/config/firebase.config';
import { COLLECTION_NAMES } from '@/constants/tenant.constants';
import type { User, LoginCredentials, RegisterData, AuthState } from '@/types/auth.types';
import { biometricService } from '@/services/biometric.service';
import type { BiometricAuthResult } from '@/types/biometric.types';

interface AuthStore extends AuthState {
  setFirebaseUser: (user: FirebaseUser | null) => void;
  setCurrentUser: (user: User | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: Error | null) => void;

  login: (credentials: LoginCredentials) => Promise<User>;
  loginWithBiometric: () => Promise<BiometricAuthResult>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;

  fetchUserData: (uid: string) => Promise<User | null>;
  updateUserProfile: (userId: string, data: Partial<User>) => Promise<void>;
  refreshUser: () => Promise<void>;
  joinLaboratory: (tenantCode: string) => Promise<User>;

  initializeAuth: () => void;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      firebaseUser: null,
      currentUser: null,
      isLoading: true,
      isAuthenticated: false,
      error: null,

      setFirebaseUser: (user) => set({ firebaseUser: user, isAuthenticated: !!user }),
      setCurrentUser: (user) => set({ currentUser: user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),

      login: async (credentials) => {
        const { setLoading, setError, fetchUserData } = get();

        try {
          setLoading(true);
          setError(null);

          const userCredential = await signInWithEmailAndPassword(
            auth,
            credentials.email,
            credentials.password
          );

          const userData = await fetchUserData(userCredential.user.uid);

          if (!userData) {
            throw new Error('User data not found');
          }

          if (!userData.isActive) {
            await signOut(auth);
            throw new Error('Account is deactivated');
          }

          // Update last login
          await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, userData.id), {
            lastLoginAt: serverTimestamp(),
          });

          return userData;
        } catch (error) {
          setError(error as Error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      register: async (data) => {
        const { setLoading, setError, setCurrentUser } = get();

        try {
          setLoading(true);
          setError(null);

          // Only check tenant if code is provided
          if (data.tenantCode) {
            const tenantDoc = await getDoc(doc(firestore, 'tenants', data.tenantCode.toLowerCase()));
            if (!tenantDoc.exists()) {
              throw new Error('Invalid laboratory code. Please check and try again.');
            }
          }

          // Create Firebase Auth user
          const userCredential = await createUserWithEmailAndPassword(
            auth,
            data.email,
            data.password
          );

          // Update display name
          await updateProfile(userCredential.user, {
            displayName: `${data.firstName} ${data.lastName}`,
          });

          // Create user document in Firestore
          const userData: User = {
            id: userCredential.user.uid,
            uid: userCredential.user.uid,
            email: data.email,
            displayName: `${data.firstName} ${data.lastName}`,
            firstName: data.firstName,
            lastName: data.lastName,
            phoneNumber: data.phoneNumber,
            role: data.role || 'patient',
            tenantId: data.tenantCode ? data.tenantCode.toLowerCase() : '', // Empty if no tenant
            permissions: [],
            isActive: true,
            isEmailVerified: false,
            createdAt: new Date(),
            updatedAt: new Date(),
          };

          await setDoc(doc(firestore, COLLECTION_NAMES.USERS, userData.id), {
            ...userData,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Only create tenant_users entry if tenant code is provided
          if (data.tenantCode) {
            const tenantUserId = `${userData.id}_${data.tenantCode.toLowerCase()}`;
            await setDoc(doc(firestore, 'tenant_users', tenantUserId), {
              userId: userData.id,
              tenantId: data.tenantCode.toLowerCase(),
              role: userData.role,
              permissions: [],
              isActive: true,
              createdAt: serverTimestamp(),
              updatedAt: serverTimestamp(),
            });
          }

          setCurrentUser(userData);
          return userData;
        } catch (error) {
          setError(error as Error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      loginWithBiometric: async () => {
        const { firebaseUser } = get();

        if (!firebaseUser) {
          return {
            success: false,
            error: 'No authenticated user found',
            errorCode: 'NO_USER',
          };
        }

        try {
          // Authenticate with biometrics
          const result = await biometricService.authenticate({
            reason: 'Authenticate to access LabFlow',
          });

          if (!result.success) {
            return result;
          }

          // Refresh user data after successful biometric auth
          await get().refreshUser();

          return { success: true };
        } catch (error) {
          console.error('Biometric login error:', error);
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
            errorCode: 'AUTH_ERROR',
          };
        }
      },

      logout: async () => {
        const { setLoading, setError, setFirebaseUser, setCurrentUser } = get();

        try {
          setLoading(true);
          setError(null);

          // Clear biometric data on logout
          await biometricService.clearBiometricData();

          await signOut(auth);
          setFirebaseUser(null);
          setCurrentUser(null);
        } catch (error) {
          setError(error as Error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      resetPassword: async (email) => {
        const { setLoading, setError } = get();

        try {
          setLoading(true);
          setError(null);

          await sendPasswordResetEmail(auth, email);
        } catch (error) {
          setError(error as Error);
          throw error;
        } finally {
          setLoading(false);
        }
      },

      fetchUserData: async (uid) => {
        const { setCurrentUser } = get();

        try {
          const userDoc = await getDoc(doc(firestore, COLLECTION_NAMES.USERS, uid));

          if (!userDoc.exists()) {
            console.error('User document not found for uid:', uid);
            return null;
          }

          const userData = {
            id: userDoc.id,
            uid: userDoc.id,
            ...userDoc.data(),
            createdAt: userDoc.data().createdAt?.toDate() || new Date(),
            updatedAt: userDoc.data().updatedAt?.toDate() || new Date(),
            lastLoginAt: userDoc.data().lastLoginAt?.toDate(),
          } as User;

          setCurrentUser(userData);
          return userData;
        } catch (error) {
          console.error('Error fetching user data:', error);
          return null;
        }
      },

      updateUserProfile: async (userId, data) => {
        const { setError, fetchUserData } = get();

        try {
          setError(null);

          await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, userId), {
            ...data,
            updatedAt: serverTimestamp(),
          });

          await fetchUserData(userId);
        } catch (error) {
          setError(error as Error);
          throw error;
        }
      },

      refreshUser: async () => {
        const { firebaseUser, fetchUserData } = get();

        if (firebaseUser) {
          await fetchUserData(firebaseUser.uid);
        }
      },

      joinLaboratory: async (tenantCode: string) => {
        const { currentUser, setCurrentUser, setError } = get();

        if (!currentUser) {
          throw new Error('No authenticated user found');
        }

        try {
          // Check if tenant exists
          const tenantDoc = await getDoc(doc(firestore, 'tenants', tenantCode.toLowerCase()));
          if (!tenantDoc.exists()) {
            throw new Error('Invalid laboratory code. Please check and try again.');
          }

          // Create tenant_users entry
          const tenantUserId = `${currentUser.id}_${tenantCode.toLowerCase()}`;
          await setDoc(doc(firestore, 'tenant_users', tenantUserId), {
            userId: currentUser.id,
            tenantId: tenantCode.toLowerCase(),
            role: 'patient', // Default role when joining
            permissions: [],
            isActive: true,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });

          // Update user's tenantId
          await updateDoc(doc(firestore, COLLECTION_NAMES.USERS, currentUser.id), {
            tenantId: tenantCode.toLowerCase(),
            updatedAt: serverTimestamp(),
          });

          // Update local user state
          const updatedUser = {
            ...currentUser,
            tenantId: tenantCode.toLowerCase(),
          };
          setCurrentUser(updatedUser);

          return updatedUser;
        } catch (error) {
          setError(error as Error);
          throw error;
        }
      },

      initializeAuth: () => {
        const { setFirebaseUser, fetchUserData, setLoading } = get();

        onAuthStateChanged(auth, async (user) => {
          setFirebaseUser(user);

          if (user) {
            await fetchUserData(user.uid);
          }

          setLoading(false);
        });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        currentUser: state.currentUser,
      }),
    }
  )
);
