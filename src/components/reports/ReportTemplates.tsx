import React from 'react';
import { DocumentTextIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ReportTemplate } from '../../services/reports';

interface ReportTemplatesProps {
  templates: ReportTemplate[];
  selectedTemplate: string | null;
  onSelectTemplate: (templateId: string) => void;
}

const ReportTemplates: React.FC<ReportTemplatesProps> = ({
  templates,
  selectedTemplate,
  onSelectTemplate
}) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-medium text-gray-900">Available Templates</h3>
      
      <div className="space-y-2">
        {templates.map((template) => (
          <div
            key={template.id}
            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedTemplate === template.id
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-200 hover:border-gray-300'
            }`}
            onClick={() => onSelectTemplate(template.id)}
          >
            <div className="flex items-start">
              <DocumentTextIcon className="h-5 w-5 text-gray-400 mt-0.5" />
              <div className="ml-3 flex-1">
                <h4 className="text-sm font-medium text-gray-900">{template.name}</h4>
                <p className="text-sm text-gray-500 mt-1">{template.description}</p>
                <div className="flex items-center mt-2 text-xs text-gray-400">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  Updated {new Date(template.updatedAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportTemplates;