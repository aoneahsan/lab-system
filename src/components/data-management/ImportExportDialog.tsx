import React from 'react';
import { X, Upload, Download, FileSpreadsheet } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Tab } from '@headlessui/react';

interface ImportExportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  importComponent: React.ReactNode;
  exportComponent: React.ReactNode;
  templateDownload?: () => void;
}

export const ImportExportDialog: React.FC<ImportExportDialogProps> = ({
  isOpen,
  onClose,
  title,
  importComponent,
  exportComponent,
  templateDownload,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/30" onClick={onClose} />
        
        <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between p-6 border-b">
            <h2 className="text-xl font-semibold">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
          
          <div className="p-6">
            <Tab.Group>
              <Tab.List className="flex space-x-1 rounded-lg bg-gray-100 p-1">
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5 
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                    }`
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <Upload className="h-4 w-4" />
                    Import
                  </div>
                </Tab>
                <Tab
                  className={({ selected }) =>
                    `w-full rounded-lg py-2.5 text-sm font-medium leading-5
                    ${selected
                      ? 'bg-white text-blue-700 shadow'
                      : 'text-gray-600 hover:bg-white/[0.12] hover:text-gray-800'
                    }`
                  }
                >
                  <div className="flex items-center justify-center gap-2">
                    <Download className="h-4 w-4" />
                    Export
                  </div>
                </Tab>
              </Tab.List>
              
              <Tab.Panels className="mt-6">
                <Tab.Panel>
                  <div className="space-y-4">
                    {templateDownload && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-sm text-blue-800 mb-3">
                          Need a template? Download our pre-formatted template to ensure your data is in the correct format.
                        </p>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={templateDownload}
                          className="text-blue-700 border-blue-300 hover:bg-blue-100"
                        >
                          <FileSpreadsheet className="h-4 w-4 mr-2" />
                          Download Template
                        </Button>
                      </div>
                    )}
                    {importComponent}
                  </div>
                </Tab.Panel>
                
                <Tab.Panel>
                  {exportComponent}
                </Tab.Panel>
              </Tab.Panels>
            </Tab.Group>
          </div>
        </div>
      </div>
    </div>
  );
};