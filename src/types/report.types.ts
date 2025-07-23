import { Timestamp } from 'firebase/firestore';

// Report types
export type ReportType = 
  | 'patient_results'
  | 'test_summary'
  | 'qc_summary'
  | 'financial'
  | 'inventory'
  | 'turnaround_time'
  | 'workload'
  | 'custom';

export type ReportFormat = 'pdf' | 'excel' | 'csv' | 'json';

export type ReportFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';

export type ReportStatus = 'draft' | 'scheduled' | 'generating' | 'completed' | 'failed';

export type ChartType = 'line' | 'bar' | 'pie' | 'donut' | 'scatter' | 'heatmap';

export type DateRangePreset = 
  | 'today'
  | 'yesterday'
  | 'last7days'
  | 'last30days'
  | 'thisMonth'
  | 'lastMonth'
  | 'thisQuarter'
  | 'lastQuarter'
  | 'thisYear'
  | 'lastYear'
  | 'custom';

// Report template
export interface ReportTemplate {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  type: ReportType;
  category: string;
  config: ReportConfig;
  isPublic: boolean;
  isActive: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// Report configuration
export interface ReportConfig {
  dataSource: DataSource;
  filters: ReportFilter[];
  groupBy?: string[];
  sortBy?: SortConfig[];
  columns?: ColumnConfig[];
  charts?: ChartConfig[];
  summary?: SummaryConfig;
  formatting?: FormattingConfig;
}

// Data source configuration
export interface DataSource {
  collection: string;
  joins?: JoinConfig[];
  fields: string[];
  aggregations?: AggregationConfig[];
}

// Join configuration
export interface JoinConfig {
  collection: string;
  localField: string;
  foreignField: string;
  as: string;
}

// Filter configuration
export interface ReportFilter {
  field: string;
  operator: FilterOperator;
  value: any;
  label?: string;
  type?: 'date' | 'number' | 'string' | 'boolean' | 'select';
  options?: { value: string; label: string }[];
}

export type FilterOperator = 
  | '='
  | '!='
  | '>'
  | '>='
  | '<'
  | '<='
  | 'in'
  | 'not_in'
  | 'contains'
  | 'starts_with'
  | 'ends_with'
  | 'between';

// Sort configuration
export interface SortConfig {
  field: string;
  direction: 'asc' | 'desc';
}

// Column configuration
export interface ColumnConfig {
  field: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'currency' | 'percentage';
  width?: number;
  align?: 'left' | 'center' | 'right';
  format?: string;
  aggregate?: 'sum' | 'avg' | 'min' | 'max' | 'count';
}

// Chart configuration
export interface ChartConfig {
  type: ChartType;
  title: string;
  xAxis: string;
  yAxis: string | string[];
  series?: SeriesConfig[];
  options?: Record<string, any>;
}

// Series configuration
export interface SeriesConfig {
  field: string;
  label: string;
  color?: string;
  type?: 'line' | 'bar' | 'area';
}

// Aggregation configuration
export interface AggregationConfig {
  field: string;
  operation: 'sum' | 'avg' | 'min' | 'max' | 'count' | 'distinct';
  as: string;
}

// Summary configuration
export interface SummaryConfig {
  showTotals: boolean;
  showAverages: boolean;
  showCounts: boolean;
  customMetrics?: CustomMetric[];
}

// Custom metric
export interface CustomMetric {
  label: string;
  formula: string;
  format?: string;
}

// Formatting configuration
export interface FormattingConfig {
  numberFormat?: string;
  dateFormat?: string;
  currencySymbol?: string;
  thousandsSeparator?: string;
  decimalSeparator?: string;
  decimalPlaces?: number;
}

// Report instance
export interface Report {
  id: string;
  tenantId: string;
  templateId?: string;
  name: string;
  description?: string;
  type: ReportType;
  status: ReportStatus;
  config: ReportConfig;
  parameters?: Record<string, any>;
  schedule?: ReportSchedule;
  output?: ReportOutput;
  error?: string;
  runAt?: Timestamp;
  completedAt?: Timestamp;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// Report schedule
export interface ReportSchedule {
  frequency: ReportFrequency;
  time?: string; // HH:mm format
  dayOfWeek?: number; // 0-6 (Sunday-Saturday)
  dayOfMonth?: number; // 1-31
  monthOfYear?: number; // 1-12
  timezone: string;
  recipients: string[];
  formats: ReportFormat[];
  enabled: boolean;
  nextRunAt?: Timestamp;
  lastRunAt?: Timestamp;
}

// Report output
export interface ReportOutput {
  data: any[];
  charts?: ChartData[];
  summary?: ReportSummary;
  metadata: ReportMetadata;
  fileUrls?: Record<ReportFormat, string>;
}

// Chart data
export interface ChartData {
  chartId: string;
  type: ChartType;
  data: any[];
  options: Record<string, any>;
}

// Report summary
export interface ReportSummary {
  totalRecords: number;
  totals?: Record<string, number>;
  averages?: Record<string, number>;
  customMetrics?: Record<string, any>;
}

// Report metadata
export interface ReportMetadata {
  generatedAt: Timestamp;
  generatedBy: string;
  duration: number; // milliseconds
  recordCount: number;
  parameters: Record<string, any>;
}

// Analytics dashboard
export interface AnalyticsDashboard {
  id: string;
  tenantId: string;
  name: string;
  description?: string;
  widgets: DashboardWidget[];
  layout: DashboardLayout;
  refreshInterval?: number; // seconds
  isPublic: boolean;
  isDefault: boolean;
  createdAt: Timestamp;
  createdBy: string;
  updatedAt: Timestamp;
  updatedBy: string;
}

// Dashboard widget
export interface DashboardWidget {
  id: string;
  type: 'metric' | 'chart' | 'table' | 'report';
  title: string;
  config: WidgetConfig;
  position: WidgetPosition;
  size: WidgetSize;
}

// Widget configuration
export interface WidgetConfig {
  reportId?: string;
  metric?: MetricConfig;
  chart?: ChartConfig;
  table?: TableConfig;
  refreshInterval?: number;
}

// Metric configuration
export interface MetricConfig {
  value: string | number;
  label: string;
  format?: string;
  trend?: {
    value: number;
    direction: 'up' | 'down' | 'flat';
    percentage: number;
  };
  icon?: string;
  color?: string;
}

// Table configuration
export interface TableConfig {
  dataSource: DataSource;
  columns: ColumnConfig[];
  pageSize?: number;
  sortable?: boolean;
  filterable?: boolean;
}

// Widget position
export interface WidgetPosition {
  x: number;
  y: number;
}

// Widget size
export interface WidgetSize {
  width: number;
  height: number;
}

// Dashboard layout
export interface DashboardLayout {
  type: 'grid' | 'flex';
  columns: number;
  rowHeight?: number;
  gap?: number;
}

// Report filter for queries
export interface ReportQueryFilter {
  type?: ReportType;
  status?: ReportStatus;
  createdBy?: string;
  startDate?: Date;
  endDate?: Date;
  search?: string;
}

// Form data types
export interface ReportTemplateFormData {
  name: string;
  description?: string;
  type: ReportType;
  category: string;
  config: ReportConfig;
  isPublic: boolean;
}

export interface ReportFormData {
  name: string;
  description?: string;
  type: ReportType;
  templateId?: string;
  parameters?: Record<string, any>;
  schedule?: ReportSchedule;
  formats: ReportFormat[];
}

export interface DashboardFormData {
  name: string;
  description?: string;
  layout: DashboardLayout;
  refreshInterval?: number;
  isPublic: boolean;
  isDefault: boolean;
}

// Analytics metrics
export interface AnalyticsMetrics {
  totalTests: number;
  totalPatients: number;
  totalSamples: number;
  totalRevenue: number;
  averageTurnaroundTime: number;
  testVolumeTrend: TrendData[];
  revenueTrend: TrendData[];
  topTests: { testCode: string; testName: string; count: number }[];
  departmentStats: { department: string; tests: number; revenue: number }[];
}

export interface TrendData {
  date: Date;
  value: number;
  label?: string;
}