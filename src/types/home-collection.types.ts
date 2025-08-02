export interface HomeCollection {
  id: string;
  appointmentId: string;
  patientId: string;
  patientName: string;
  patientPhone: string;
  
  // Collection details
  scheduledDate: Date;
  scheduledTimeSlot: string; // e.g., "09:00-11:00"
  status: 'scheduled' | 'assigned' | 'in-transit' | 'arrived' | 'collecting' | 'completed' | 'cancelled' | 'failed';
  priority: 'urgent' | 'high' | 'normal' | 'low';
  
  // Location
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
    coordinates?: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Assignment
  phlebotomistId?: string;
  phlebotomistName?: string;
  routeId?: string;
  sequenceNumber?: number; // Order in the route
  
  // Collection Kit
  kitId?: string;
  kitBarcode?: string;
  requiredTubes: CollectionTube[];
  
  // Tests
  testIds: string[];
  testNames: string[];
  specialInstructions?: string;
  fastingRequired: boolean;
  
  // Tracking
  assignedAt?: Date;
  departedAt?: Date;
  arrivedAt?: Date;
  collectionStartedAt?: Date;
  collectionCompletedAt?: Date;
  estimatedArrivalTime?: Date;
  actualDistance?: number; // in km
  travelTime?: number; // in minutes
  
  // Sample info
  sampleIds?: string[];
  collectedSamples?: {
    sampleId: string;
    tubeType: string;
    collectedAt: Date;
  }[];
  
  // Issues
  failureReason?: string;
  notes?: string;
  patientNotAvailable?: boolean;
  rescheduleRequested?: boolean;
  
  // Payment
  paymentMethod: 'prepaid' | 'cash' | 'card' | 'insurance';
  paymentStatus: 'pending' | 'collected' | 'failed';
  amount?: number;
  paymentCollectedAt?: Date;
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface CollectionRoute {
  id: string;
  routeName: string;
  date: Date;
  phlebotomistId: string;
  phlebotomistName: string;
  status: 'draft' | 'assigned' | 'in-progress' | 'completed';
  
  // Collections in order
  collections: string[]; // Home collection IDs in sequence
  totalCollections: number;
  completedCollections: number;
  
  // Route optimization
  optimized: boolean;
  totalDistance: number; // in km
  estimatedDuration: number; // in minutes
  startLocation: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  endLocation: {
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
  };
  
  // Tracking
  startedAt?: Date;
  completedAt?: Date;
  currentLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  
  // Kit management
  assignedKits: string[];
  usedKits: string[];
  returnedKits: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tenantId: string;
}

export interface CollectionKit {
  id: string;
  barcode: string;
  status: 'available' | 'assigned' | 'in-use' | 'returned' | 'damaged' | 'lost';
  
  // Contents
  tubes: CollectionTube[];
  supplies: {
    needles: number;
    syringes: number;
    bandages: number;
    antisepticWipes: number;
    gloves: number;
    labels: number;
    biohazardBags: number;
  };
  
  // Assignment
  assignedTo?: string; // Phlebotomist ID
  assignedDate?: Date;
  routeId?: string;
  
  // Tracking
  lastLocation?: {
    latitude: number;
    longitude: number;
    timestamp: Date;
  };
  checkInHistory: {
    phlebotomistId: string;
    action: 'checked-out' | 'checked-in';
    timestamp: Date;
    location?: string;
  }[];
  
  // Maintenance
  lastSanitized?: Date;
  nextMaintenanceDate?: Date;
  expiryAlerts: {
    item: string;
    expiryDate: Date;
  }[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
  tenantId: string;
}

export interface CollectionTube {
  type: string; // e.g., "EDTA", "SST", "Sodium Citrate"
  color: string; // e.g., "purple", "gold", "blue"
  size: string; // e.g., "3ml", "5ml"
  quantity: number;
  testTypes: string[]; // Tests this tube is used for
}

export interface PhlebotomistLocation {
  id: string;
  phlebotomistId: string;
  timestamp: Date;
  coordinates: {
    latitude: number;
    longitude: number;
    accuracy?: number;
    heading?: number;
    speed?: number;
  };
  status: 'idle' | 'traveling' | 'at-location' | 'collecting';
  currentCollectionId?: string;
  batteryLevel?: number;
  isOnline: boolean;
}

export interface RouteOptimizationRequest {
  date: Date;
  phlebotomistId: string;
  startLocation: {
    latitude: number;
    longitude: number;
  };
  collections: Array<{
    collectionId: string;
    address: string;
    coordinates: {
      latitude: number;
      longitude: number;
    };
    priority: 'urgent' | 'high' | 'normal' | 'low';
    timeWindow?: {
      start: string; // HH:mm
      end: string; // HH:mm
    };
    estimatedDuration: number; // minutes
  }>;
  endLocation?: {
    latitude: number;
    longitude: number;
  };
  constraints?: {
    maxDistance?: number; // km
    maxDuration?: number; // minutes
    breakTime?: {
      start: string; // HH:mm
      duration: number; // minutes
    };
  };
}

export interface RouteOptimizationResponse {
  optimizedRoute: Array<{
    collectionId: string;
    sequenceNumber: number;
    estimatedArrival: Date;
    estimatedDeparture: Date;
    distanceFromPrevious: number; // km
    durationFromPrevious: number; // minutes
  }>;
  totalDistance: number; // km
  totalDuration: number; // minutes
  efficiency: number; // percentage
  alternativeRoutes?: RouteOptimizationResponse[];
}

export interface HomeCollectionStats {
  date: Date;
  totalScheduled: number;
  totalCompleted: number;
  totalCancelled: number;
  totalFailed: number;
  averageCompletionTime: number; // minutes
  averageDistancePerCollection: number; // km
  onTimePercentage: number;
  firstAttemptSuccessRate: number;
  
  byPhlebotomist: Array<{
    phlebotomistId: string;
    phlebotomistName: string;
    collections: number;
    completed: number;
    averageTime: number;
    distance: number;
    rating?: number;
  }>;
  
  byArea: Array<{
    area: string; // City or postal code
    collections: number;
    averageDuration: number;
    popularTimeSlots: string[];
  }>;
  
  byTimeSlot: Array<{
    slot: string;
    collections: number;
    completionRate: number;
  }>;
}

// Search and filter types
export interface HomeCollectionFilters {
  dateFrom?: Date;
  dateTo?: Date;
  status?: HomeCollection['status'][];
  phlebotomistId?: string;
  area?: string;
  priority?: HomeCollection['priority'][];
  paymentStatus?: HomeCollection['paymentStatus'];
  search?: string; // Patient name, phone, address
}

// Form types
export interface HomeCollectionFormData {
  patientId: string;
  testIds: string[];
  scheduledDate: string;
  scheduledTimeSlot: string;
  priority: HomeCollection['priority'];
  address: {
    line1: string;
    line2?: string;
    city: string;
    state: string;
    postalCode: string;
    landmark?: string;
  };
  specialInstructions?: string;
  fastingRequired: boolean;
  paymentMethod: HomeCollection['paymentMethod'];
}

export interface RouteAssignmentData {
  routeName: string;
  phlebotomistId: string;
  date: string;
  collectionIds: string[];
  optimize: boolean;
}