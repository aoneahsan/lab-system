import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { FileText, Save } from 'lucide-react';
import { useReportTemplates } from '@/hooks/useReports';
import type { ReportFormData, ReportType, ReportFormat } from '@/types/report.types';

interface ReportBuilderProps {
  onSubmit: (data: ReportFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const ReportBuilder: React.FC<ReportBuilderProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [selectedType, setSelectedType] = useState<ReportType>('patient_results');
  const { data: templates = [] } = useReportTemplates();
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<ReportFormData>({
    defaultValues: {
      type: 'patient_results',
      formats: ['pdf'],
    },
  });

  const templateId = watch('templateId');
  const selectedTemplate = templates.find(t => t.id === templateId);

  const reportTypes: { value: ReportType; label: string }[] = [
    { value: 'patient_results', label: 'Patient Results' },
    { value: 'test_summary', label: 'Test Summary' },
    { value: 'qc_summary', label: 'Quality Control Summary' },
    { value: 'financial', label: 'Financial Report' },
    { value: 'inventory', label: 'Inventory Report' },
    { value: 'turnaround_time', label: 'Turnaround Time Analysis' },
    { value: 'workload', label: 'Workload Analysis' },
    { value: 'custom', label: 'Custom Report' },
  ];

  const reportFormats: { value: ReportFormat; label: string }[] = [
    { value: 'pdf', label: 'PDF' },
    { value: 'excel', label: 'Excel' },
    { value: 'csv', label: 'CSV' },
    { value: 'json', label: 'JSON' },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Basic Information */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Report Information
        </h3>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Report Name *
            </label>
            <input
              type="text"
              {...register('name', { required: 'Report name is required' })}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Monthly Lab Report"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name?.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Description
            </label>
            <textarea
              {...register('description')}
              rows={3}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Comprehensive monthly report including all test results..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Report Type *
              </label>
              <select
                {...register('type', { required: 'Report type is required' })}
                onChange={(e) => setSelectedType(e.target.value as ReportType)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                {reportTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Use Template
              </label>
              <select
                {...register('templateId')}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="">None - Custom Report</option>
                {templates
                  .filter(t => t.type === selectedType)
                  .map(template => (
                    <option key={template.id} value={template.id}>
                      {template.name}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Output Formats */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Output Formats
        </h3>
        
        <div className="space-y-2">
          {reportFormats.map(format => (
            <label key={format.value} className="flex items-center">
              <input
                type="checkbox"
                value={format.value}
                {...register('formats', { required: 'Select at least one format' })}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">{format.label}</span>
            </label>
          ))}
          {errors.formats && (
            <p className="text-sm text-red-600">{errors.formats?.message}</p>
          )}
        </div>
      </div>

      {/* Template Info */}
      {selectedTemplate && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900">Template: {selectedTemplate.name}</h4>
          {selectedTemplate.description && (
            <p className="mt-1 text-sm text-blue-700">{selectedTemplate.description}</p>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {isLoading ? 'Creating...' : 'Create Report'}
        </button>
      </div>
    </form>
  );
};

export default ReportBuilder;