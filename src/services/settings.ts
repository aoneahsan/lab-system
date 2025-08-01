import { api } from './api';

export interface SystemSettings {
  general: GeneralSettings;
  laboratory: LaboratorySettings;
  billing: BillingSettings;
  integration: IntegrationSettings;
  notifications: NotificationSettings;
  security: SecuritySettings;
  display: DisplaySettings;
}

export interface GeneralSettings {
  labName: string;
  labLogo: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contact: {
    phone: string;
    email: string;
    website: string;
  };
  timezone: string;
  dateFormat: string;
  timeFormat: string;
  currency: string;
  npiNumber?: string;
  taxId?: string;
}

export interface LaboratorySettings {
  accessionNumberFormat: string;
  accessionNumberPrefix: string;
  barcodeFormat: 'CODE128' | 'QR' | 'CODE39';
  sampleIdFormat: string;
  resultValidationRequired: boolean;
  criticalValueNotification: boolean;
  criticalValueTimeout: number; // minutes
  defaultTurnaroundTime: number; // hours
  enableQualityControl: boolean;
  qcFrequency: 'daily' | 'weekly' | 'monthly';
  allowPartialResults: boolean;
}

export interface BillingSettings {
  taxEnabled: boolean;
  taxRate: number;
  defaultPaymentTerms: number; // days
  insuranceClaimsEnabled: boolean;
  billingCodeSystem: 'CPT' | 'ICD10' | 'CUSTOM';
  lateFeeEnabled: boolean;
  lateFeePercentage: number;
  lateFeeGracePeriod: number; // days
  discountEnabled: boolean;
  maxDiscountPercentage: number;
}

export interface IntegrationSettings {
  hl7Enabled: boolean;
  hl7Version: string;
  fhirEnabled: boolean;
  fhirVersion: string;
  apiEnabled: boolean;
  apiRateLimit: number;
  webhooksEnabled: boolean;
  emrIntegration: {
    epic: boolean;
    cerner: boolean;
    allscripts: boolean;
    athenahealth: boolean;
  };
  lisIntegration: {
    enabled: boolean;
    vendor: string;
    connectionType: 'TCP' | 'FILE' | 'API';
  };
}

export interface NotificationSettings {
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  patientNotifications: {
    resultReady: boolean;
    appointmentReminder: boolean;
    criticalValue: boolean;
  };
  providerNotifications: {
    criticalValue: boolean;
    resultReady: boolean;
    qcAlert: boolean;
  };
  staffNotifications: {
    lowInventory: boolean;
    equipmentMaintenance: boolean;
    pendingTasks: boolean;
  };
  notificationTemplates: {
    [key: string]: {
      subject: string;
      body: string;
      enabled: boolean;
    };
  };
}

export interface SecuritySettings {
  passwordPolicy: {
    minLength: number;
    requireUppercase: boolean;
    requireLowercase: boolean;
    requireNumbers: boolean;
    requireSpecialChars: boolean;
    expirationDays: number;
    preventReuse: number;
  };
  sessionTimeout: number; // minutes
  mfaRequired: boolean;
  mfaMethods: ('totp' | 'sms' | 'email' | 'biometric')[];
  ipWhitelist: string[];
  auditLogRetention: number; // days
  dataEncryption: boolean;
  biometricEnabled: boolean;
}

export interface DisplaySettings {
  theme: 'light' | 'dark' | 'system';
  primaryColor: string;
  logoPosition: 'left' | 'center';
  compactMode: boolean;
  showPatientPhoto: boolean;
  defaultView: 'dashboard' | 'worklist' | 'patients';
  itemsPerPage: number;
  graphicalReports: boolean;
  criticalValueColor: string;
  abnormalValueColor: string;
}

class SettingsService {
  private cache: SystemSettings | null = null;
  private cacheTimestamp: number = 0;
  private cacheTimeout = 5 * 60 * 1000; // 5 minutes

  // Get all settings
  async getSettings(): Promise<SystemSettings> {
    // Check cache
    if (this.cache && Date.now() - this.cacheTimestamp < this.cacheTimeout) {
      return this.cache;
    }

    const response = await api.get('/api/settings');
    this.cache = response.data;
    this.cacheTimestamp = Date.now();
    return response.data;
  }

  // Update settings
  async updateSettings(section: keyof SystemSettings, settings: any): Promise<void> {
    await api.put(`/api/settings/${section}`, settings);
    // Invalidate cache
    this.cache = null;
  }

  // Get specific setting section
  async getSettingSection<K extends keyof SystemSettings>(section: K): Promise<SystemSettings[K]> {
    const settings = await this.getSettings();
    return settings[section];
  }

  // Update specific setting
  async updateSetting(path: string, value: any): Promise<void> {
    await api.patch('/api/settings', { path, value });
    // Invalidate cache
    this.cache = null;
  }

  // Reset settings to defaults
  async resetToDefaults(section?: keyof SystemSettings): Promise<void> {
    await api.post('/api/settings/reset', { section });
    // Invalidate cache
    this.cache = null;
  }

  // Export settings
  async exportSettings(): Promise<Blob> {
    const response = await api.get('/api/settings/export', {
      responseType: 'blob',
    });
    return response.data;
  }

  // Import settings
  async importSettings(file: File): Promise<void> {
    const formData = new FormData();
    formData.append('settings', file);
    await api.post('/api/settings/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    // Invalidate cache
    this.cache = null;
  }

  // Validate settings
  async validateSettings(settings: Partial<SystemSettings>): Promise<{
    valid: boolean;
    errors: string[];
  }> {
    const response = await api.post('/api/settings/validate', settings);
    return response.data;
  }

  // Get default settings
  async getDefaultSettings(): Promise<SystemSettings> {
    const response = await api.get('/api/settings/defaults');
    return response.data;
  }

  // Helper methods for common settings
  async getLabInfo(): Promise<GeneralSettings> {
    return this.getSettingSection('general');
  }

  async updateLabInfo(info: Partial<GeneralSettings>): Promise<void> {
    const current = await this.getLabInfo();
    await this.updateSettings('general', { ...current, ...info });
  }

  async getSecurityPolicy(): Promise<SecuritySettings> {
    return this.getSettingSection('security');
  }

  async updateSecurityPolicy(policy: Partial<SecuritySettings>): Promise<void> {
    const current = await this.getSecurityPolicy();
    await this.updateSettings('security', { ...current, ...policy });
  }

  // Clear cache
  clearCache(): void {
    this.cache = null;
    this.cacheTimestamp = 0;
  }
}

export const settingsService = new SettingsService();
