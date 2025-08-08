import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query, 
  where, 
  orderBy,
  serverTimestamp,
  writeBatch
} from 'firebase/firestore';
import { 
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  updateProfile
} from 'firebase/auth';
import { db, auth, functions } from '@/lib/firebase';
import { httpsCallable } from 'firebase/functions';
import { logger } from '@/services/monitoring/logger';
import type { User, UserRole } from '@/types/auth.types';
import type { UserFormData } from '@/types/user-management.types';

const COLLECTION_NAME = 'labflow_users';

export class UserService {
  async getUsers(role?: UserRole): Promise<User[]> {
    try {
      let q = query(collection(db, COLLECTION_NAME), orderBy('displayName'));
      
      if (role) {
        q = query(q, where('role', '==', role));
      }

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        updatedAt: doc.data().updatedAt?.toDate(),
        lastLoginAt: doc.data().lastLoginAt?.toDate()
      })) as User[];
    } catch (error) {
      logger.error('Failed to fetch users', error);
      throw error;
    }
  }

  async getUser(userId: string): Promise<User | null> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      const docSnap = await getDoc(docRef);
      
      if (!docSnap.exists()) {
        return null;
      }

      const data = docSnap.data();
      return {
        id: docSnap.id,
        ...data,
        createdAt: data.createdAt?.toDate(),
        updatedAt: data.updatedAt?.toDate(),
        lastLoginAt: data.lastLoginAt?.toDate()
      } as User;
    } catch (error) {
      logger.error('Failed to fetch user', error);
      throw error;
    }
  }

  async createUser(data: UserFormData): Promise<User> {
    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.temporaryPassword || this.generateTempPassword()
      );

      const uid = userCredential.user.uid;

      // Update display name
      if (data.displayName) {
        await updateProfile(userCredential.user, {
          displayName: data.displayName
        });
      }

      // Create user document
      const userData: Partial<User> = {
        uid,
        email: data.email,
        displayName: data.displayName,
        role: data.role,
        permissions: data.permissions || [],
        isActive: true,
        metadata: {
          ...data.metadata,
          employeeId: data.metadata?.employeeId,
          department: data.metadata?.department,
          phoneNumber: data.metadata?.phoneNumber
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const docRef = await addDoc(collection(db, COLLECTION_NAME), {
        ...userData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // Send password reset email if requested
      if (data.sendPasswordReset) {
        await sendPasswordResetEmail(auth, data.email);
      }

      logger.info('User created successfully', { userId: docRef.id, email: data.email });

      return {
        id: docRef.id,
        ...userData
      } as User;
    } catch (error) {
      logger.error('Failed to create user', error);
      throw error;
    }
  }

  async updateUser(userId: string, data: Partial<UserFormData>): Promise<void> {
    try {
      const docRef = doc(db, COLLECTION_NAME, userId);
      
      const updateData: any = {
        ...data,
        updatedAt: serverTimestamp()
      };

      // Remove undefined values
      Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
          delete updateData[key];
        }
      });

      await updateDoc(docRef, updateData);

      // If role or permissions changed, update auth claims
      if (data.role || data.permissions) {
        const updateUserClaims = httpsCallable(functions, 'updateUserClaims');
        await updateUserClaims({ 
          userId, 
          claims: { 
            role: data.role,
            permissions: data.permissions 
          } 
        });
      }

      logger.info('User updated successfully', { userId });
    } catch (error) {
      logger.error('Failed to update user', error);
      throw error;
    }
  }

  async deleteUser(userId: string): Promise<void> {
    try {
      // Soft delete by setting isActive to false
      await this.updateUser(userId, { isActive: false });
      
      // Optionally, you can also delete the document
      // await deleteDoc(doc(db, COLLECTION_NAME, userId));
      
      logger.info('User deleted successfully', { userId });
    } catch (error) {
      logger.error('Failed to delete user', error);
      throw error;
    }
  }

  async toggleUserStatus(userId: string, isActive: boolean): Promise<void> {
    try {
      await this.updateUser(userId, { isActive });
      
      // Disable/enable auth account
      const disableUser = httpsCallable(functions, 'disableUser');
      await disableUser({ userId, disabled: !isActive });
      
      logger.info('User status toggled', { userId, isActive });
    } catch (error) {
      logger.error('Failed to toggle user status', error);
      throw error;
    }
  }

  async resetUserPassword(userId: string, email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
      logger.info('Password reset email sent', { userId, email });
    } catch (error) {
      logger.error('Failed to send password reset email', error);
      throw error;
    }
  }

  async bulkUpdateUsers(userIds: string[], updates: Partial<UserFormData>): Promise<void> {
    try {
      const batch = writeBatch(db);
      
      userIds.forEach(userId => {
        const docRef = doc(db, COLLECTION_NAME, userId);
        batch.update(docRef, {
          ...updates,
          updatedAt: serverTimestamp()
        });
      });

      await batch.commit();
      logger.info('Bulk user update completed', { count: userIds.length });
    } catch (error) {
      logger.error('Failed to bulk update users', error);
      throw error;
    }
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export const userService = new UserService();