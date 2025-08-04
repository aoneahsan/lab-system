export interface Appointment {
  id: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  patientEmail?: string;
  locationId: string;
  locationName: string;
  appointmentType: 'walk-in' | 'scheduled' | 'home-collection';
  status: 'scheduled' | 'confirmed' | 'in-progress' | 'completed' | 'cancelled' | 'no-show';
  
  // Scheduling details
  scheduledDate: Date;
  scheduledTime: string; // HH:mm format
  duration: number; // in minutes
  
  // Test details
  testIds: string[];
  testNames: string[];
  specialInstructions?: string;
  fastingRequired: boolean;
  
  // Home collection specific
  homeCollection?: {
    address: string;
    landmark?: string;
    phlebotomistId?: string;
    phlebotomistName?: string;
    collectionKitId?: string;
    preferredTimeSlot?: string;
  };
  
  // Tracking
  checkInTime?: Date;
  checkOutTime?: Date;
  sampleCollectedTime?: Date;
  
  // Notifications
  remindersSent: {
    sms?: Date;
    email?: Date;
    whatsapp?: Date;
  };
  
  // Metadata
  notes?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface AppointmentSlot {
  id: string;
  locationId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  capacity: number;
  booked: number;
  available: number;
  type: 'regular' | 'urgent' | 'home-collection';
  phlebotomistIds?: string[]; // For home collection slots
  isActive: boolean;
}

export interface AppointmentSettings {
  id: string;
  tenantId: string;
  
  // Booking settings
  advanceBookingDays: number; // How many days in advance can book
  minBookingHours: number; // Minimum hours before appointment
  slotDuration: number; // Default slot duration in minutes
  bufferTime: number; // Buffer between appointments
  
  // Working hours by location
  locations: {
    [locationId: string]: {
      name: string;
      address: string;
      workingHours: {
        [day: string]: { // monday, tuesday, etc.
          isOpen: boolean;
          openTime: string; // HH:mm
          closeTime: string; // HH:mm
          breaks?: Array<{
            startTime: string;
            endTime: string;
          }>;
        };
      };
      capacity: number; // Max appointments per slot
      homeCollectionEnabled: boolean;
    };
  };
  
  // Reminder settings
  reminders: {
    enabled: boolean;
    channels: ('sms' | 'email' | 'whatsapp')[];
    timings: number[]; // Hours before appointment [24, 2]
    templates: {
      sms?: string;
      email?: string;
      whatsapp?: string;
    };
  };
  
  // Legacy properties for backward compatibility
  enableReminders?: boolean;
  reminderChannels?: ('sms' | 'email' | 'whatsapp')[];
  reminderTiming?: number[];
  reminderTemplates?: {
    sms?: string;
    email?: string;
    whatsapp?: string;
  };
  
  // Cancellation policy
  cancellation: {
    allowedHoursBefore: number;
    reasonRequired: boolean;
    penaltyEnabled: boolean;
    penaltyAmount?: number;
  };
  
  // Home collection settings
  homeCollection: {
    enabled: boolean;
    additionalCharge: number;
    radius: number; // Service radius in km
    minOrderAmount?: number;
    timeSlots: string[]; // Available time slots
  };
  
  updatedAt: Date;
}

export interface RecurringAppointment {
  id: string;
  patientId: string;
  templateAppointment: Partial<Appointment>;
  recurrence: {
    pattern: 'daily' | 'weekly' | 'monthly';
    interval: number; // Every n days/weeks/months
    daysOfWeek?: number[]; // For weekly: 0=Sunday, 1=Monday, etc.
    dayOfMonth?: number; // For monthly
    endDate?: Date;
    occurrences?: number; // Number of occurrences
  };
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface AppointmentReminder {
  id: string;
  appointmentId: string;
  type: 'sms' | 'email' | 'whatsapp';
  scheduledFor: Date;
  status: 'pending' | 'sent' | 'failed';
  attempts: number;
  lastAttempt?: Date;
  error?: string;
  metadata: {
    to: string;
    template: string;
    variables: Record<string, any>;
  };
}

export interface AppointmentStats {
  date: string;
  locationId: string;
  totalScheduled: number;
  completed: number;
  cancelled: number;
  noShow: number;
  walkIns: number;
  homeCollections: number;
  averageWaitTime: number; // in minutes
  utilizationRate: number; // percentage
}

// Form types
export interface AppointmentFormData {
  patientId: string;
  locationId: string;
  appointmentType: 'scheduled' | 'home-collection';
  scheduledDate: string;
  scheduledTime: string;
  testIds: string[];
  specialInstructions?: string;
  fastingRequired: boolean;
  homeAddress?: string;
  homeLandmark?: string;
  preferredTimeSlot?: string;
}

export interface AppointmentSearchFilters {
  patientId?: string;
  locationId?: string;
  status?: Appointment['status'];
  appointmentType?: Appointment['appointmentType'];
  dateFrom?: Date;
  dateTo?: Date;
  search?: string;
}