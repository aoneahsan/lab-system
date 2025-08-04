export interface Tenant {
  id: string;
  name: string;
  code: string;
  description?: string;
  logo?: string;
  firebasePrefix?: string; // Prefix for Firebase collections/storage
  settings: TenantSettings;
  subscription: TenantSubscription;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  metadata?: Record<string, unknown>;
}

export interface TenantSettings {
  language: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  timeFormat: string;
  addressFormat: string;
  features: FeatureFlags;
  branding: BrandingSettings;
  notifications: NotificationSettings;
  integrations: IntegrationSettings;
}

export interface FeatureFlags {
  enableBilling: boolean;
  enableInventory: boolean;
  enableAppointments: boolean;
  enableTelemedicine: boolean;
  enablePatientPortal: boolean;
  enableMobileApp: boolean;
  enableBiometricAuth: boolean;
  enableOfflineMode: boolean;
  enableQualityControl: boolean;
  enableInsuranceClaims: boolean;
  enableHL7Integration: boolean;
  enableFHIRIntegration: boolean;
}

export interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl?: string;
  faviconUrl?: string;
  companyName: string;
  companyAddress?: string;
  companyPhone?: string;
  companyEmail?: string;
  companyWebsite?: string;
}

export interface NotificationSettings {
  enableEmailNotifications: boolean;
  enableSMSNotifications: boolean;
  enablePushNotifications: boolean;
  enableInAppNotifications: boolean;
  criticalResultsNotification: 'email' | 'sms' | 'both' | 'none';
  appointmentReminders: boolean;
  resultReadyNotifications: boolean;
}

export interface IntegrationSettings {
  emrSystem?: string;
  lisSystem?: string;
  billingSystem?: string;
  hl7Endpoint?: string;
  fhirEndpoint?: string;
  apiKeys?: Record<string, string>;
}

export interface TenantSubscription {
  plan: 'basic' | 'standard' | 'premium' | 'enterprise';
  status: 'active' | 'suspended' | 'cancelled' | 'trial';
  startDate: Date;
  endDate?: Date;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  maxUsers: number;
  maxPatients: number;
  maxTestsPerMonth: number;
  storageQuotaGB: number;
  features: string[];
}

export interface TenantUser {
  userId: string;
  tenantId: string;
  role: string;
  permissions: string[];
  isActive: boolean;
  joinedAt: Date;
}

export interface TenantContext {
  currentTenant: Tenant | null;
  isLoading: boolean;
  error: Error | null;
  setCurrentTenant: (tenant: Tenant) => void;
  clearCurrentTenant: () => void;
  refreshTenant: () => Promise<void>;
}
