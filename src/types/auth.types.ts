import { User as FirebaseUser } from 'firebase/auth';
import { SystemRole } from '@constants/tenant.constants';

export interface User {
  id: string;
  email: string;
  displayName: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  photoURL?: string;
  role: SystemRole;
  tenantId: string;
  permissions: string[];
  isActive: boolean;
  isEmailVerified: boolean;
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  metadata?: UserMetadata;
  preferences?: UserPreferences;
}

export interface UserMetadata {
  employeeId?: string;
  department?: string;
  designation?: string;
  licenseNumber?: string;
  specialization?: string;
  qualifications?: string[];
  yearsOfExperience?: number;
  languages?: string[];
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
}

export interface NotificationPreferences {
  email: boolean;
  sms: boolean;
  push: boolean;
  inApp: boolean;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  language: string;
  notifications: NotificationPreferences;
  defaultView?: string;
  dashboardLayout?: Record<string, unknown>;
  shortcuts?: string[];
}

export interface AuthState {
  firebaseUser: FirebaseUser | null;
  currentUser: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: Error | null;
}

export interface LoginCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  tenantCode: string;
  role?: SystemRole;
}

export interface PasswordResetData {
  email: string;
}

export interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  actions: string[];
}

export interface RolePermissions {
  role: SystemRole;
  permissions: Permission[];
}

export interface SessionInfo {
  sessionId: string;
  userId: string;
  deviceInfo: {
    userAgent: string;
    platform: string;
    browser: string;
  };
  ipAddress: string;
  location?: {
    country: string;
    city: string;
  };
  startedAt: Date;
  lastActivityAt: Date;
  expiresAt: Date;
}