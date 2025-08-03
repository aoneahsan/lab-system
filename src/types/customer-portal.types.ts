export interface CustomerPortalAccess {
  id: string;
  patientId: string;
  email: string;
  isActive: boolean;
  
  // Access control
  canViewResults: boolean;
  canDownloadReports: boolean;
  canShareResults: boolean;
  canUploadPrescriptions: boolean;
  canBookAppointments: boolean;
  canViewInvoices: boolean;
  canMakePayments: boolean;
  
  // Authentication
  lastLogin?: Date;
  passwordResetToken?: string;
  passwordResetExpiry?: Date;
  emailVerified: boolean;
  emailVerificationToken?: string;
  
  // Preferences
  preferredLanguage: string;
  receiveNotifications: boolean;
  notificationChannels: ('email' | 'sms' | 'whatsapp')[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface SharedResult {
  id: string;
  resultId: string;
  patientId: string;
  sharedBy: string;
  sharedWith: {
    email?: string;
    phone?: string;
    name: string;
  };
  
  // Access control
  accessToken: string;
  expiresAt: Date;
  viewCount: number;
  maxViews?: number;
  allowDownload: boolean;
  
  // Share details
  shareMethod: 'email' | 'link' | 'whatsapp' | 'sms';
  message?: string;
  
  // Tracking
  firstViewedAt?: Date;
  lastViewedAt?: Date;
  downloadedAt?: Date;
  
  // Metadata
  createdAt: Date;
  tenantId: string;
}

export interface PrescriptionUpload {
  id: string;
  patientId: string;
  
  // File details
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  
  // Prescription info
  doctorName?: string;
  clinicName?: string;
  prescriptionDate?: Date;
  validUntil?: Date;
  
  // Processing
  status: 'uploaded' | 'processing' | 'processed' | 'rejected';
  testsIdentified?: string[];
  notes?: string;
  rejectionReason?: string;
  
  // Metadata
  uploadedAt: Date;
  processedAt?: Date;
  processedBy?: string;
  tenantId: string;
}

export interface PortalNotification {
  id: string;
  recipientId: string;
  
  // Notification details
  type: 'result_ready' | 'appointment_reminder' | 'payment_due' | 'report_shared' | 'general';
  title: string;
  message: string;
  
  // Delivery
  channels: ('email' | 'sms' | 'whatsapp' | 'in_app')[];
  deliveryStatus: {
    email?: 'pending' | 'sent' | 'failed';
    sms?: 'pending' | 'sent' | 'failed';
    whatsapp?: 'pending' | 'sent' | 'failed';
    in_app?: 'pending' | 'read';
  };
  
  // Tracking
  sentAt?: Date;
  readAt?: Date;
  clickedAt?: Date;
  
  // Action
  actionUrl?: string;
  actionLabel?: string;
  
  // Metadata
  createdAt: Date;
  expiresAt?: Date;
  tenantId: string;
}

export interface PortalInvoice {
  id: string;
  invoiceNumber: string;
  patientId: string;
  
  // Invoice details
  invoiceDate: Date;
  dueDate: Date;
  status: 'draft' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled';
  
  // Financial
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  totalAmount: number;
  paidAmount: number;
  balanceAmount: number;
  
  // Line items
  items: Array<{
    testName: string;
    testCode: string;
    quantity: number;
    unitPrice: number;
    totalPrice: number;
  }>;
  
  // Payment
  paymentMethods: ('cash' | 'card' | 'upi' | 'bank_transfer')[];
  onlinePaymentEnabled: boolean;
  paymentLink?: string;
  
  // Tracking
  viewedAt?: Date;
  downloadedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface PortalAppointment {
  id: string;
  patientId: string;
  
  // Appointment details
  appointmentDate: Date;
  timeSlot: string;
  type: 'lab_visit' | 'home_collection' | 'consultation';
  status: 'requested' | 'confirmed' | 'cancelled' | 'completed';
  
  // Tests
  requestedTests: Array<{
    testId: string;
    testName: string;
    testCode: string;
  }>;
  
  // Location
  location?: {
    type: 'lab' | 'home';
    address?: string;
    labBranchId?: string;
    labBranchName?: string;
  };
  
  // Confirmation
  confirmationCode?: string;
  specialInstructions?: string;
  preparationInstructions?: string;
  
  // Reminders
  remindersSent: Date[];
  
  // Metadata
  bookedAt: Date;
  bookedThrough: 'portal' | 'phone' | 'walk_in';
  tenantId: string;
}

export interface PortalDashboardStats {
  totalResults: number;
  pendingResults: number;
  recentResults: Array<{
    id: string;
    testName: string;
    date: Date;
    status: string;
  }>;
  
  upcomingAppointments: Array<{
    id: string;
    date: Date;
    type: string;
    location: string;
  }>;
  
  pendingInvoices: Array<{
    id: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
  }>;
  
  totalSpent: number;
  lastVisit?: Date;
}

// Form types
export interface CustomerRegistrationData {
  email: string;
  phone: string;
  patientId: string;
  password: string;
  acceptTerms: boolean;
}

export interface ShareResultData {
  resultId: string;
  shareWith: {
    email?: string;
    phone?: string;
    name: string;
  };
  shareMethod: 'email' | 'link' | 'whatsapp' | 'sms';
  message?: string;
  expiryDays: number;
  allowDownload: boolean;
  maxViews?: number;
}

export interface PrescriptionUploadData {
  file: File;
  doctorName?: string;
  clinicName?: string;
  prescriptionDate?: string;
  notes?: string;
}