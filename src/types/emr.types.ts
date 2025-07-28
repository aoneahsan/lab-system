import { Timestamp } from 'firebase/firestore';

// EMR System Types
export type EMRSystemType =
  | 'epic'
  | 'cerner'
  | 'allscripts'
  | 'athenahealth'
  | 'nextgen'
  | 'eclinicalworks'
  | 'practicefusion'
  | 'custom';

// Integration Protocol
export type IntegrationProtocol = 'fhir' | 'hl7v2' | 'hl7v3' | 'api' | 'webhook' | 'file';

// Connection Status
export type ConnectionStatus = 'connected' | 'disconnected' | 'error' | 'pending' | 'unauthorized';

// Message Status
export type MessageStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'retry';

// FHIR Resource Types
export type FHIRResourceType =
  | 'Patient'
  | 'Practitioner'
  | 'Observation'
  | 'DiagnosticReport'
  | 'ServiceRequest'
  | 'Encounter'
  | 'AllergyIntolerance'
  | 'Medication'
  | 'Condition'
  | 'Procedure';

// HL7 Message Types
export type HL7MessageType =
  | 'ADT' // Admit, Discharge, Transfer
  | 'ORM' // Order Message
  | 'ORU' // Observation Result
  | 'ORR' // Order Response
  | 'QRY' // Query
  | 'ACK' // Acknowledgment
  | 'SIU' // Scheduling Information
  | 'MDM'; // Medical Document Management;

// EMR Connection Configuration
export interface EMRConnection {
  id: string;
  tenantId: string;
  name: string;
  systemType: EMRSystemType;
  protocol: IntegrationProtocol;
  status: ConnectionStatus;
  config: EMRConnectionConfig;
  lastSyncAt?: Timestamp;
  lastErrorAt?: Timestamp;
  lastError?: string;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// Connection configuration based on protocol
export interface EMRConnectionConfig {
  // FHIR Configuration
  fhirBaseUrl?: string;
  fhirVersion?: 'R4' | 'STU3' | 'DSTU2';
  fhirAuth?: FHIRAuthConfig;

  // HL7 Configuration
  hl7Host?: string;
  hl7Port?: number;
  hl7Version?: string;
  hl7SendingApplication?: string;
  hl7SendingFacility?: string;
  hl7ReceivingApplication?: string;
  hl7ReceivingFacility?: string;

  // API Configuration
  apiBaseUrl?: string;
  apiAuth?: APIAuthConfig;
  apiHeaders?: Record<string, string>;

  // Webhook Configuration
  webhookUrl?: string;
  webhookSecret?: string;
  webhookEvents?: string[];

  // File Configuration
  fileDirectory?: string;
  filePattern?: string;
  fileFormat?: 'csv' | 'xml' | 'json' | 'hl7';

  // Common settings
  retryAttempts?: number;
  retryDelay?: number;
  timeout?: number;
  batchSize?: number;
  syncInterval?: number; // in minutes
}

// FHIR Authentication
export interface FHIRAuthConfig {
  type: 'none' | 'basic' | 'bearer' | 'oauth2';
  username?: string;
  password?: string;
  token?: string;
  clientId?: string;
  clientSecret?: string;
  authUrl?: string;
  tokenUrl?: string;
  scope?: string;
}

// API Authentication
export interface APIAuthConfig {
  type: 'none' | 'apiKey' | 'basic' | 'bearer' | 'oauth2';
  apiKey?: string;
  apiKeyHeader?: string;
  username?: string;
  password?: string;
  token?: string;
  oauth2Config?: {
    clientId: string;
    clientSecret: string;
    authUrl: string;
    tokenUrl: string;
    scope?: string;
  };
}

// Message Queue
export interface EMRMessage {
  id: string;
  tenantId: string;
  connectionId: string;
  direction: 'inbound' | 'outbound';
  protocol: IntegrationProtocol;
  messageType: string; // HL7MessageType or FHIRResourceType
  status: MessageStatus;
  priority: 'high' | 'normal' | 'low';
  content: string | Record<string, unknown>;
  parsedContent?: Record<string, unknown>;
  metadata: MessageMetadata;
  attempts: number;
  lastAttemptAt?: Timestamp;
  completedAt?: Timestamp;
  error?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// Message Metadata
export interface MessageMetadata {
  messageId?: string;
  correlationId?: string;
  patientId?: string;
  encounterId?: string;
  orderId?: string;
  sourceSystem?: string;
  targetSystem?: string;
  timestamp?: string;
  version?: string;
}

// Field Mapping
export interface FieldMapping {
  id: string;
  tenantId: string;
  connectionId: string;
  name: string;
  sourceType: 'fhir' | 'hl7' | 'api' | 'custom';
  targetType: 'fhir' | 'hl7' | 'api' | 'custom';
  mappings: FieldMap[];
  transformations?: FieldTransformation[];
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// Individual field mapping
export interface FieldMap {
  sourcePath: string;
  targetPath: string;
  dataType?: string;
  required?: boolean;
  defaultValue?: string | number | boolean;
  validation?: FieldValidation;
}

// Field transformation
export interface FieldTransformation {
  field: string;
  type: TransformationType;
  config: Record<string, unknown>;
  order: number;
}

// Transformation types
export type TransformationType =
  | 'uppercase'
  | 'lowercase'
  | 'trim'
  | 'replace'
  | 'regex'
  | 'date_format'
  | 'number_format'
  | 'lookup'
  | 'conditional'
  | 'custom';

// Field validation
export interface FieldValidation {
  type: 'required' | 'regex' | 'length' | 'range' | 'enum';
  pattern?: string;
  min?: number;
  max?: number;
  values?: string[];
  message?: string;
}

// Integration Log
export interface IntegrationLog {
  id: string;
  tenantId: string;
  connectionId: string;
  messageId?: string;
  level: 'info' | 'warning' | 'error' | 'debug';
  event: string;
  details: string;
  metadata?: Record<string, unknown>;
  timestamp: Timestamp;
}

// Sync Status
export interface SyncStatus {
  connectionId: string;
  lastSyncAt?: Timestamp;
  nextSyncAt?: Timestamp;
  status: 'idle' | 'syncing' | 'error';
  progress?: number;
  totalRecords?: number;
  processedRecords?: number;
  failedRecords?: number;
  errors?: string[];
}

// Chrome Extension Message Types
export interface ChromeExtensionMessage {
  type: 'INIT' | 'SYNC' | 'ORDER' | 'RESULT' | 'ERROR' | 'STATUS';
  action?: string;
  data?: Record<string, unknown>;
  error?: string;
  timestamp: string;
}

// EMR Order Request
export interface EMROrderRequest {
  patientId: string;
  providerId: string;
  encounterId?: string;
  tests: {
    code: string;
    name: string;
    priority?: 'routine' | 'urgent' | 'stat';
    instructions?: string;
  }[];
  diagnosis?: string[];
  notes?: string;
}

// EMR Result Response
export interface EMRResultResponse {
  orderId: string;
  patientId: string;
  results: {
    testCode: string;
    testName: string;
    value: string;
    unit?: string;
    referenceRange?: string;
    flag?: 'normal' | 'high' | 'low' | 'critical';
    status: 'final' | 'preliminary' | 'corrected';
    performedAt: string;
  }[];
  reportUrl?: string;
  notes?: string;
}

// Form data types
export interface EMRConnectionFormData {
  name: string;
  systemType: EMRSystemType;
  protocol: IntegrationProtocol;
  config: Partial<EMRConnectionConfig>;
}

export interface FieldMappingFormData {
  name: string;
  sourceType: 'fhir' | 'hl7' | 'api' | 'custom';
  targetType: 'fhir' | 'hl7' | 'api' | 'custom';
  mappings: FieldMap[];
}

// Query filters
export interface EMRConnectionFilter {
  systemType?: EMRSystemType;
  protocol?: IntegrationProtocol;
  status?: ConnectionStatus;
  isActive?: boolean;
}

export interface EMRMessageFilter {
  connectionId?: string;
  direction?: 'inbound' | 'outbound';
  status?: MessageStatus;
  messageType?: string;
  startDate?: Date;
  endDate?: Date;
}
