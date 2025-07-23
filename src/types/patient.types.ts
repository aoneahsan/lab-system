export type PatientGender = 'male' | 'female' | 'other' | 'unknown';
export type PatientBloodGroup = 'A+' | 'A-' | 'B+' | 'B-' | 'AB+' | 'AB-' | 'O+' | 'O-' | 'unknown';
export type PatientMaritalStatus = 'single' | 'married' | 'divorced' | 'widowed' | 'separated' | 'unknown';
export type PatientIdType = 'national_id' | 'passport' | 'driver_license' | 'health_card' | 'other';

export interface PatientAddress {
  type: 'home' | 'work' | 'temporary' | 'other';
  line1: string;
  line2?: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  isDefault: boolean;
}

export interface PatientContact {
  type: 'mobile' | 'home' | 'work' | 'emergency';
  value: string;
  isPrimary: boolean;
  isVerified: boolean;
}

export interface PatientEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  email?: string;
  address?: string;
}

export interface PatientInsurance {
  id: string;
  provider: string;
  policyNumber: string;
  groupNumber?: string;
  validFrom: Date;
  validTo?: Date;
  isPrimary: boolean;
  coverageDetails?: string;
}

export interface PatientAllergy {
  allergen: string;
  reaction: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life-threatening';
  confirmedDate?: Date;
  notes?: string;
}

export interface PatientMedication {
  name: string;
  dosage: string;
  frequency: string;
  startDate: Date;
  endDate?: Date;
  prescribedBy?: string;
  reason?: string;
}

export interface PatientMedicalHistory {
  condition: string;
  diagnosedDate?: Date;
  status: 'active' | 'resolved' | 'chronic';
  notes?: string;
}

export interface PatientDocument {
  id: string;
  type: 'lab_report' | 'prescription' | 'medical_record' | 'insurance_card' | 'id_proof' | 'other';
  title: string;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: Date;
  uploadedBy: string;
  tags?: string[];
  notes?: string;
}

export interface Patient {
  id: string;
  tenantId: string;
  
  // Basic Information
  patientId: string; // Unique patient ID for the lab
  mrn?: string; // Medical Record Number
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  bloodGroup?: PatientBloodGroup;
  maritalStatus?: PatientMaritalStatus;
  
  // Identification
  identifications?: Array<{
    type: PatientIdType;
    number: string;
    issuedBy?: string;
    expiryDate?: Date;
  }>;
  
  // Contact Information
  email?: string;
  phoneNumbers: PatientContact[];
  addresses: PatientAddress[];
  emergencyContacts: PatientEmergencyContact[];
  
  // Medical Information
  allergies: PatientAllergy[];
  medications: PatientMedication[];
  medicalHistory: PatientMedicalHistory[];
  familyHistory?: string;
  
  // Insurance Information
  insurances: PatientInsurance[];
  
  // Additional Information
  occupation?: string;
  employer?: string;
  nationality?: string;
  language?: string;
  religion?: string;
  notes?: string;
  
  // System Information
  isActive: boolean;
  isVip?: boolean;
  tags?: string[];
  documents?: PatientDocument[];
  
  // Audit
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  lastVisitDate?: Date;
  totalVisits?: number;
}

export interface PatientSearchFilters {
  searchTerm?: string;
  gender?: PatientGender;
  ageMin?: number;
  ageMax?: number;
  bloodGroup?: PatientBloodGroup;
  isActive?: boolean;
  isVip?: boolean;
  tags?: string[];
  dateFrom?: Date;
  dateTo?: Date;
}

export interface CreatePatientData {
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date;
  gender: PatientGender;
  email?: string;
  phoneNumber: string;
  address: Omit<PatientAddress, 'isDefault'>;
  emergencyContact?: PatientEmergencyContact;
  bloodGroup?: PatientBloodGroup;
  maritalStatus?: PatientMaritalStatus;
  occupation?: string;
  nationality?: string;
  notes?: string;
}

export interface UpdatePatientData extends Partial<Omit<Patient, 'id' | 'tenantId' | 'patientId' | 'createdAt' | 'createdBy'>> {
  updatedBy: string;
}

export interface PatientListItem {
  id: string;
  patientId: string;
  fullName: string;
  dateOfBirth: Date;
  age: number;
  gender: PatientGender;
  phoneNumber: string;
  email?: string;
  lastVisitDate?: Date;
  isActive: boolean;
  isVip?: boolean;
}

export interface PatientStats {
  totalPatients: number;
  activePatients: number;
  newPatientsThisMonth: number;
  vipPatients: number;
  averageAge: number;
  genderDistribution: Record<PatientGender, number>;
}

export interface PatientAgeGroup {
  range: string;
  count: number;
  percentage: number;
}

export interface PatientVisit {
  id: string;
  patientId: string;
  visitDate: Date;
  visitType: 'walk-in' | 'appointment' | 'emergency' | 'home-collection';
  purpose: string;
  orderedTests?: string[];
  diagnosis?: string;
  notes?: string;
  createdBy: string;
}