export interface Result {
  id?: string;
  orderId: string;
  patientId: string;
  testId: string;
  testName: string;
  value: string | number;
  unit?: string;
  referenceRange?: string;
  abnormalFlag?: 'L' | 'H' | 'LL' | 'HH' | 'N' | '<' | '>';
  status: 'pending' | 'entered' | 'validated' | 'released' | 'amended' | 'cancelled';
  enteredBy?: string;
  enteredAt?: any;
  validatedBy?: string;
  validatedAt?: any;
  comments?: string;
  criticalNotificationSent?: boolean;
  criticalNotificationAt?: any;
  isCritical?: boolean;
  criticalMessage?: string;
  createdAt: any;
  updatedAt: any;
}

export interface CriticalRange {
  low?: number;
  high?: number;
}

export interface Notification {
  id: string;
  type: 'critical_result' | 'sample_expiration' | 'qc_failure' | 'appointment_reminder' | 'system_alert';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tenantId: string;
  title: string;
  message: string;
  recipientId: string;
  recipientType: 'physician' | 'lab_tech' | 'admin' | 'patient';
  data?: any;
  requiresAcknowledgment?: boolean;
  acknowledgedAt?: any;
  acknowledgedBy?: string;
  createdAt: any;
  status: 'pending' | 'sent' | 'failed' | 'acknowledged';
  attempts: number;
  lastAttemptAt?: any;
  channels?: string[];
}

export interface Sample {
  id?: string;
  barcode: string;
  patientId: string;
  orderId: string;
  type: string;
  collectionDateTime: any;
  collectedBy: string;
  status: 'pending' | 'collected' | 'in_transit' | 'received' | 'processing' | 'completed' | 'rejected';
  expirationDateTime?: any;
  storageRequirements?: {
    temperature?: string;
    lightSensitive?: boolean;
    specialInstructions?: string;
  };
  stabilityHours?: number;
  expirationNotificationSent?: boolean;
  criticalExpirationNotificationSent?: boolean;
  tenantId: string;
  createdAt: any;
  updatedAt: any;
}

export interface QCResult {
  id?: string;
  testId: string;
  testName: string;
  controlLevel: 'low' | 'normal' | 'high';
  lot: string;
  value: number;
  mean: number;
  sd: number;
  cv?: number;
  zScore?: number;
  violations?: string[];
  accepted: boolean;
  instrumentId?: string;
  performedBy: string;
  performedAt: any;
  tenantId: string;
  createdAt: any;
  notificationSent?: boolean;
}

export interface InventoryItem {
  id?: string;
  name: string;
  code: string;
  category: string;
  currentStock: number;
  unit: string;
  reorderPoint: number;
  reorderQuantity: number;
  expirationDate?: any;
  lot?: string;
  vendorId?: string;
  lastOrderDate?: any;
  alertSent?: boolean;
  tenantId: string;
  createdAt: any;
  updatedAt: any;
}

export interface Appointment {
  id?: string;
  patientId: string;
  date: any;
  time: string;
  type: string;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  location?: string;
  reminderSent?: boolean;
  reminderSentAt?: any;
  tenantId: string;
  createdAt: any;
  updatedAt: any;
}

export interface NotificationChannel {
  type: 'email' | 'sms' | 'push' | 'in_app';
  status: 'sent' | 'failed';
  sentAt?: any;
  error?: string;
}

export interface NotificationResult {
  success: boolean;
  channels: NotificationChannel[];
  error?: string;
}