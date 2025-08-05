import type { SystemRole } from '@/constants/tenant.constants';

export interface UserFormData {
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber?: string;
  role: SystemRole;
  isActive: boolean;
  permissions?: string[];
  metadata?: {
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
  };
  preferences?: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
      email: boolean;
      sms: boolean;
      push: boolean;
      inApp: boolean;
    };
  };
  customFields?: Record<string, any>;
}

export interface UserFilter {
  role?: SystemRole;
  isActive?: boolean;
  department?: string;
  search?: string;
  startDate?: Date;
  endDate?: Date;
}

export interface UserActivity {
  id: string;
  userId: string;
  action: string;
  module: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  timestamp: Date;
}

export interface UserSession {
  id: string;
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
  isActive: boolean;
}

export interface UserPermission {
  id: string;
  module: string;
  actions: string[];
  description: string;
}

export interface RolePermissionMap {
  [role: string]: UserPermission[];
}