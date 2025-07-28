import React from 'react';
import { DocumentArrowDownIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ReportPreviewProps {
  templateId: string | null;
  filters: any;
  onGenerate: (format: 'pdf' | 'excel' | 'csv') => void;
  isGenerating: boolean;
}

const ReportPreview: React.FC<ReportPreviewProps> = ({
  templateId,
  filters,
  onGenerate,
  isGenerating,
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 min-h-[400px]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 flex items-center">
            <EyeIcon className="h-5 w-5 mr-2" />
            Report Preview
          </h3>
          <div className="flex space-x-2">
            <button
              onClick={() => onGenerate('pdf')}
              disabled={!templateId || isGenerating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              PDF
            </button>
            <button
              onClick={() => onGenerate('excel')}
              disabled={!templateId || isGenerating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Excel
            </button>
            <button
              onClick={() => onGenerate('csv')}
              disabled={!templateId || isGenerating}
              className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              CSV
            </button>
          </div>
        </div>

        {!templateId ? (
          <div className="text-center py-12">
            <DocumentArrowDownIcon className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">Select a report template to preview</p>
          </div>
        ) : isGenerating ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">Generating report...</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="bg-white p-4 rounded border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Report Parameters</h4>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                {filters.startDate && (
                  <>
                    <dt className="text-gray-500">Start Date:</dt>
                    <dd className="font-medium">{filters.startDate}</dd>
                  </>
                )}
                {filters.endDate && (
                  <>
                    <dt className="text-gray-500">End Date:</dt>
                    <dd className="font-medium">{filters.endDate}</dd>
                  </>
                )}
                {filters.department && (
                  <>
                    <dt className="text-gray-500">Department:</dt>
                    <dd className="font-medium">{filters.department}</dd>
                  </>
                )}
                {filters.status && (
                  <>
                    <dt className="text-gray-500">Status:</dt>
                    <dd className="font-medium">{filters.status}</dd>
                  </>
                )}
              </dl>
            </div>

            <div className="bg-white p-4 rounded border border-gray-200">
              <h4 className="font-medium text-gray-900 mb-2">Preview</h4>
              <p className="text-sm text-gray-500">
                Report preview will be displayed here once data is loaded...
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportPreview;
