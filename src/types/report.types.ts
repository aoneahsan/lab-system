import type { Timestamp } from 'firebase/firestore';

export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  category: ReportCategory;
  type: ReportType;
  format: ReportFormat;
  sections: ReportSection[];
  parameters: ReportParameter[];
  layout: ReportLayout;
  isActive: boolean;
  isDefault?: boolean;
  createdBy: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

export type ReportCategory = 
  | 'patient'
  | 'laboratory'
  | 'financial'
  | 'inventory'
  | 'quality'
  | 'administrative';

export type ReportType = 
  | 'patient_report'
  | 'cumulative_report'
  | 'daily_summary'
  | 'monthly_summary'
  | 'turnaround_time'
  | 'quality_control'
  | 'inventory_status'
  | 'financial_summary'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'html';

export interface ReportSection {
  id: string;
  type: SectionType;
  title: string;
  order: number;
  content?: unknown;
  visible: boolean;
  pageBreak?: boolean;
}

export type SectionType = 
  | 'header'
  | 'patient_info'
  | 'test_results'
  | 'chart'
  | 'table'
  | 'summary'
  | 'signature'
  | 'footer'
  | 'custom';

export interface ReportParameter {
  name: string;
  label: string;
  type: ParameterType;
  required: boolean;
  defaultValue?: string | number | boolean;
  options?: Array<{ value: string; label: string }>;
}

export type ParameterType = 
  | 'date'
  | 'dateRange'
  | 'select'
  | 'multiSelect'
  | 'text'
  | 'number';

export interface ReportLayout {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  headerHeight?: number;
  footerHeight?: number;
  fontSize?: number;
  fontFamily?: string;
  logo?: string;
  watermark?: string;
}

export interface GeneratedReport {
  id: string;
  tenantId: string;
  templateId: string;
  templateName: string;
  format: ReportFormat;
  parameters: Record<string, string | number | boolean>;
  fileUrl?: string;
  status: ReportStatus;
  generatedBy: string;
  generatedAt: Timestamp;
  expiresAt?: Timestamp;
  error?: string;
}

export type ReportStatus = 
  | 'pending'
  | 'generating'
  | 'completed'
  | 'failed';

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'last90days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

export interface ReportData {
  patient?: {
    id: string;
    name: string;
    dateOfBirth: string;
    gender: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  order?: {
    id: string;
    date: string;
    physician: string;
    priority: string;
  };
  results?: Array<{
    testName: string;
    value: string | number;
    unit?: string;
    referenceRange?: string;
    flag?: string;
    comments?: string;
  }>;
  laboratory?: {
    name: string;
    address: string;
    phone: string;
    email: string;
    director: string;
    clia?: string;
  };
}