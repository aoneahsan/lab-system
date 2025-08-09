import { useState } from 'react';
import { FileText, Edit2, Copy, Trash2, Plus } from 'lucide-react';
import type { ReportTemplate, ReportCategory } from '@/types/report.types';

const mockTemplates: ReportTemplate[] = [
  {
    id: '1',
    tenantId: 'tenant1',
    name: 'Standard Patient Report',
    description: 'Default patient test results report',
    category: 'patient',
    type: 'patient_report',
    format: 'pdf',
    sections: [
      { id: 's1', type: 'header', title: 'Lab Header', order: 1, visible: true },
      { id: 's2', type: 'patient_info', title: 'Patient Information', order: 2, visible: true },
      { id: 's3', type: 'test_results', title: 'Test Results', order: 3, visible: true },
      { id: 's4', type: 'signature', title: 'Authorization', order: 4, visible: true },
    ],
    parameters: [{ name: 'orderId', label: 'Order ID', type: 'text', required: true }],
    layout: {
      pageSize: 'A4',
      orientation: 'portrait',
      margins: { top: 20, right: 20, bottom: 20, left: 20 },
      fontSize: 12,
      fontFamily: 'Arial',
    },
    isActive: true,
    isDefault: true,
    createdBy: 'system',
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
  {
    id: '2',
    tenantId: 'tenant1',
    name: 'Monthly Summary Report',
    description: 'Laboratory monthly performance summary',
    category: 'laboratory',
    type: 'monthly_summary',
    format: 'excel',
    sections: [
      { id: 's1', type: 'header', title: 'Report Header', order: 1, visible: true },
      { id: 's2', type: 'summary', title: 'Executive Summary', order: 2, visible: true },
      { id: 's3', type: 'table', title: 'Test Statistics', order: 3, visible: true },
      { id: 's4', type: 'chart', title: 'Trends', order: 4, visible: true },
    ],
    parameters: [
      { name: 'month', label: 'Month', type: 'date', required: true },
      {
        name: 'department',
        label: 'Department',
        type: 'select',
        required: false,
        options: [
          { value: 'all', label: 'All Departments' },
          { value: 'chemistry', label: 'Chemistry' },
          { value: 'hematology', label: 'Hematology' },
        ],
      },
    ],
    layout: {
      pageSize: 'Letter',
      orientation: 'landscape',
      margins: { top: 15, right: 15, bottom: 15, left: 15 },
    },
    isActive: true,
    createdBy: 'admin',
    createdAt: new Date() as any,
    updatedAt: new Date() as any,
  },
];

export default function ReportTemplates() {
  const [templates] = useState<ReportTemplate[]>(mockTemplates);
  const [selectedCategory, setSelectedCategory] = useState<ReportCategory | 'all'>('all');
  const [_showTemplateForm, setShowTemplateForm] = useState(false);

  const categoryConfig = {
    patient: { label: 'Patient Reports', color: 'text-blue-600 bg-blue-50' },
    laboratory: { label: 'Lab Reports', color: 'text-green-600 bg-green-50' },
    financial: { label: 'Financial', color: 'text-purple-600 bg-purple-50' },
    inventory: { label: 'Inventory', color: 'text-orange-600 bg-orange-50' },
    quality: { label: 'Quality Control', color: 'text-red-600 bg-red-50' },
    administrative: { label: 'Admin Reports', color: 'text-gray-600 bg-gray-50' },
  };

  const formatConfig: Record<string, { label: string; color: string }> = {
    pdf: { label: 'PDF', color: 'text-red-600' },
    excel: { label: 'Excel', color: 'text-green-600' },
    csv: { label: 'CSV', color: 'text-blue-600' },
    html: { label: 'HTML', color: 'text-orange-600' },
    json: { label: 'JSON', color: 'text-purple-600' },
  };

  const filteredTemplates = templates.filter(
    (template) => selectedCategory === 'all' || template.category === selectedCategory
  );

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Report Templates</h3>
          <div className="flex items-center space-x-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value as any)}
              className="input py-1"
            >
              <option value="all">All Categories</option>
              {Object.entries(categoryConfig).map(([key, config]) => (
                <option key={key} value={key}>
                  {config.label}
                </option>
              ))}
            </select>
            <button onClick={() => setShowTemplateForm(true)} className="btn btn-primary btn-sm">
              <Plus className="h-4 w-4" />
              New Template
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredTemplates.map((template) => {
            const categoryConf = categoryConfig[template.category];
            const formatConf = formatConfig[template.format];

            return (
              <div
                key={template.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-gray-400 mr-2" />
                    <div>
                      <h4 className="font-medium text-gray-900">{template.name}</h4>
                      {template.isDefault && (
                        <span className="text-xs text-indigo-600">Default</span>
                      )}
                    </div>
                  </div>
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                      template.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {template.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>

                {template.description && (
                  <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                )}

                <div className="flex items-center justify-between mb-3">
                  <span
                    className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${categoryConf.color}`}
                  >
                    {categoryConf.label}
                  </span>
                  <span className={`text-sm font-medium ${formatConf.color}`}>
                    {formatConf.label}
                  </span>
                </div>

                <div className="text-xs text-gray-500 mb-3">
                  <p>{template.sections.length} sections</p>
                  <p>{template.parameters.length} parameters</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                  <div className="flex items-center space-x-1">
                    <button className="p-1 text-gray-600 hover:text-gray-700" title="Edit Template">
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button
                      className="p-1 text-gray-600 hover:text-gray-700"
                      title="Duplicate Template"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button className="p-1 text-red-600 hover:text-red-700" title="Delete Template">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <button className="text-indigo-600 hover:text-indigo-700 text-sm font-medium">
                    Preview
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTemplates.length === 0 && (
          <div className="text-center py-8 text-gray-500">No templates found in this category</div>
        )}
      </div>
    </div>
  );
}
