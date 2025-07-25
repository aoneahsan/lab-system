import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { settingsService, SystemSettings } from '../../services/settings';
import GeneralSettings from './GeneralSettings';
import LaboratorySettings from './LaboratorySettings';
import BillingSettings from './BillingSettings';
import IntegrationSettings from './IntegrationSettings';
import NotificationSettings from './NotificationSettings';
import SecuritySettings from './SecuritySettings';
import DisplaySettings from './DisplaySettings';
import {
  Cog6ToothIcon,
  BeakerIcon,
  CurrencyDollarIcon,
  LinkIcon,
  BellIcon,
  ShieldCheckIcon,
  ComputerDesktopIcon,
  ArrowDownTrayIcon,
  ArrowUpTrayIcon
} from '@heroicons/react/24/outline';

const tabs = [
  { id: 'general', label: 'General', icon: Cog6ToothIcon },
  { id: 'laboratory', label: 'Laboratory', icon: BeakerIcon },
  { id: 'billing', label: 'Billing', icon: CurrencyDollarIcon },
  { id: 'integration', label: 'Integration', icon: LinkIcon },
  { id: 'notifications', label: 'Notifications', icon: BellIcon },
  { id: 'security', label: 'Security', icon: ShieldCheckIcon },
  { id: 'display', label: 'Display', icon: ComputerDesktopIcon }
];

const SystemSettingsPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [importFile, setImportFile] = useState<File | null>(null);
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: () => settingsService.getSettings()
  });

  const updateMutation = useMutation({
    mutationFn: ({ section, data }: { section: keyof SystemSettings; data: any }) =>
      settingsService.updateSettings(section, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
    }
  });

  const exportMutation = useMutation({
    mutationFn: () => settingsService.exportSettings(),
    onSuccess: (blob) => {
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `system-settings-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    }
  });

  const importMutation = useMutation({
    mutationFn: (file: File) => settingsService.importSettings(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings'] });
      setImportFile(null);
    }
  });

  const handleSave = (section: keyof SystemSettings, data: any) => {
    updateMutation.mutate({ section, data });
  };

  const handleImport = () => {
    if (importFile) {
      importMutation.mutate(importFile);
    }
  };

  const renderTabContent = () => {
    if (!settings) return null;

    switch (activeTab) {
      case 'general':
        return (
          <GeneralSettings
            settings={settings.general}
            onSave={(data) => handleSave('general', data)}
            isSaving={updateMutation.isPending}
          />
        );
      case 'laboratory':
        return (
          <LaboratorySettings
            settings={settings.laboratory}
            onSave={(data) => handleSave('laboratory', data)}
            isSaving={updateMutation.isPending}
          />
        );
      case 'billing':
        return (
          <BillingSettings
            settings={settings.billing}
            onSave={(data) => handleSave('billing', data)}
            isSaving={updateMutation.isPending}
          />
        );
      case 'integration':
        return (
          <IntegrationSettings
            settings={settings.integration}
            onSave={(data) => handleSave('integration', data)}
            isSaving={updateMutation.isPending}
          />
        );
      case 'notifications':
        return (
          <NotificationSettings
            settings={settings.notifications}
            onSave={(data) => handleSave('notifications', data)}
            isSaving={updateMutation.isPending}
          />
        );
      case 'security':
        return (
          <SecuritySettings
            settings={settings.security}
            onSave={(data) => handleSave('security', data)}
            isSaving={updateMutation.isPending}
          />
        );
      case 'display':
        return (
          <DisplaySettings
            settings={settings.display}
            onSave={(data) => handleSave('display', data)}
            isSaving={updateMutation.isPending}
          />
        );
      default:
        return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow rounded-lg">
        <div className="border-b border-gray-200">
          <div className="flex items-center justify-between px-6 py-4">
            <h1 className="text-2xl font-semibold text-gray-900">System Settings</h1>
            <div className="flex space-x-2">
              <button
                onClick={() => exportMutation.mutate()}
                disabled={exportMutation.isPending}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
                Export
              </button>
              <label className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={(e) => setImportFile(e.target.files?.[0] || null)}
                  className="sr-only"
                />
              </label>
              {importFile && (
                <button
                  onClick={handleImport}
                  disabled={importMutation.isPending}
                  className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  Confirm Import
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex">
          <div className="w-64 border-r border-gray-200">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-blue-50 text-blue-700'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    <Icon className="flex-shrink-0 -ml-1 mr-3 h-6 w-6" />
                    {tab.label}
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="flex-1 p-6">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemSettingsPage;