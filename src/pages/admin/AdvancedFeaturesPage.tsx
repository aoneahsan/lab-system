import { useState } from 'react';
import { Settings, GitBranch, FileText, Shield } from 'lucide-react';
import AdvancedWorkflowBuilder from '@/components/workflow/AdvancedWorkflowBuilder';
import DynamicFieldBuilder from '@/components/custom-fields/DynamicFieldBuilder';
import { CheckboxField, NumberField } from '@/components/form-fields';

export default function AdvancedFeaturesPage() {
  const [activeTab, setActiveTab] = useState<'workflow' | 'customFields' | 'security' | 'integrations'>('workflow');

  const tabs = [
    { id: 'workflow', name: 'Workflow Automation', icon: GitBranch },
    { id: 'customFields', name: 'Custom Fields', icon: FileText },
    { id: 'security', name: 'Security Settings', icon: Shield },
    { id: 'integrations', name: 'Integrations', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Advanced Features</h1>
        <p className="text-gray-600 mt-2">Configure advanced system features and automation</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`
                  py-2 px-1 border-b-2 font-medium text-sm flex items-center gap-2
                  ${activeTab === tab.id
                    ? 'border-indigo-500 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }
                `}
              >
                <Icon className="h-4 w-4" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'workflow' && (
          <div>
            <AdvancedWorkflowBuilder />
          </div>
        )}

        {activeTab === 'customFields' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Configure Custom Fields</h2>
              <p className="text-sm text-gray-600 mb-6">
                Define custom fields for different entities to capture additional information specific to your lab
              </p>
              
              <div className="space-y-8">
                {['patient', 'test', 'sample', 'result'].map((entityType) => (
                  <div key={entityType} className="border-t pt-6 first:border-0 first:pt-0">
                    <DynamicFieldBuilder
                      entityType={entityType as any}
                      onSave={(fields) => {
                        console.log(`Saving ${entityType} fields:`, fields);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'security' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Security Settings</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Two-Factor Authentication</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Require two-factor authentication for all users accessing sensitive data
                </p>
                <CheckboxField
                  name="enable2FA"
                  label="Enable mandatory 2FA"
                  className="text-sm"
                />
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Session Management</h3>
                <div className="space-y-2">
                  <div>
                    <NumberField
                      name="sessionTimeout"
                      label="Session Timeout (minutes)"
                      defaultValue={30}
                      className="w-32"
                    />
                  </div>
                  <CheckboxField
                    name="lockScreenInactivity"
                    label="Lock screen on inactivity"
                    className="text-sm"
                  />
                </div>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Audit Logging</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Configure which actions should be logged for compliance
                </p>
                <div className="space-y-2">
                  <CheckboxField
                    name="logDataAccess"
                    label="Log all data access"
                    defaultChecked={true}
                    className="text-sm"
                  />
                  <CheckboxField
                    name="logModifications"
                    label="Log all modifications"
                    defaultChecked={true}
                    className="text-sm"
                  />
                  <CheckboxField
                    name="logExports"
                    label="Log all exports"
                    className="text-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'integrations' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">System Integrations</h2>
            <div className="space-y-4">
              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">EMR Integration</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Configure HL7/FHIR integration settings for EMR systems
                </p>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Configure EMR
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Billing Systems</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Connect to external billing and insurance systems
                </p>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Configure Billing
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">Laboratory Instruments</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Configure connections to laboratory analyzers and instruments
                </p>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Add Instrument
                </button>
              </div>

              <div className="border rounded-lg p-4">
                <h3 className="font-medium text-gray-900 mb-2">API Access</h3>
                <p className="text-sm text-gray-600 mb-3">
                  Manage API keys and webhook endpoints
                </p>
                <button className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
                  Manage API Keys
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}