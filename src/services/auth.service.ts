import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { User } from '@/types/auth.types';
import { SystemRole } from '@/constants/tenant.constants';

interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: SystemRole;
  tenantId: string;
  phoneNumber?: string;
}

export async function login(email: string, password: string): Promise<User> {
  const { user } = await signInWithEmailAndPassword(auth, email, password);
  
  const userDoc = await getDoc(doc(db, 'users', user.uid));
  if (!userDoc.exists()) {
    throw new Error('User data not found');
  }
  
  return userDoc.data() as User;
}

export async function register(data: RegisterData): Promise<User> {
  const { user } = await createUserWithEmailAndPassword(auth, data.email, data.password);
  
  const displayName = `${data.firstName} ${data.lastName}`;
  await updateProfile(user, { displayName });
  
  const userData: User = {
    id: user.uid,
    email: data.email,
    displayName,
    firstName: data.firstName,
    lastName: data.lastName,
    phoneNumber: data.phoneNumber,
    role: data.role,
    tenantId: data.tenantId,
    permissions: [],
    isActive: true,
    isEmailVerified: user.emailVerified,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
  
  await setDoc(doc(db, 'users', user.uid), userData);
  
  return userData;
}

export async function logout(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function updateUserProfile(userId: string, updates: Partial<User>): Promise<void> {
  await updateDoc(doc(db, 'users', userId), {
    ...updates,
    updatedAt: serverTimestamp(),
  });
}

export async function getUserById(userId: string): Promise<User | null> {
  const userDoc = await getDoc(doc(db, 'users', userId));
  
  if (!userDoc.exists()) {
    return null;
  }
  
  return userDoc.data() as User;
}

export async function changePassword(oldPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('No user logged in');
  }
  
  const credential = EmailAuthProvider.credential(user.email, oldPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}