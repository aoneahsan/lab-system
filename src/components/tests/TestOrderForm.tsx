import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { Search, X, AlertCircle } from 'lucide-react';
import { useTests, useTestPanels } from '@/hooks/useTests';
import { usePatients } from '@/hooks/usePatients';
import type { TestOrderFormData, TestDefinition, TestPanel } from '@/types/test.types';
import type { PatientListItem } from '@/types/patient.types';
import { TextField, SelectField, CheckboxField, LexicalEditorField } from '@/components/form-fields';

interface TestOrderFormProps {
  onSubmit: (data: TestOrderFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const TestOrderForm: React.FC<TestOrderFormProps> = ({ onSubmit, onCancel, isLoading = false }) => {
  const [patientSearch, setPatientSearch] = useState('');
  const [testSearch, setTestSearch] = useState('');
  const [selectedPatient, setSelectedPatient] = useState<PatientListItem | null>(null);
  const [selectedTests, setSelectedTests] = useState<TestDefinition[]>([]);
  const [showPanels, setShowPanels] = useState(false);

  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];
  const { data: tests = [] } = useTests({ isActive: true });
  const { data: panels = [] } = useTestPanels();

  const { register, handleSubmit, setValue, watch, control } = useForm<TestOrderFormData>({
    defaultValues: {
      priority: 'routine',
      fasting: false,
      tests: [],
    },
  });

  const priority = watch('priority');

  const filteredPatients = patients.filter(
    (patient) =>
      patient.fullName.toLowerCase().includes(patientSearch.toLowerCase()) ||
      patient.patientId.toLowerCase().includes(patientSearch.toLowerCase())
  );

  const filteredTests = tests.filter(
    (test) =>
      !selectedTests.some((st) => st.id === test.id) &&
      (test.name.toLowerCase().includes(testSearch.toLowerCase()) ||
        test.code.toLowerCase().includes(testSearch.toLowerCase()))
  );

  const handlePatientSelect = (patient: PatientListItem) => {
    setSelectedPatient(patient);
    setValue('patientId', patient.id);
    setPatientSearch('');
  };

  const handleTestSelect = (test: TestDefinition) => {
    setSelectedTests([...selectedTests, test]);
    setValue('tests', [...selectedTests.map((t) => t.id), test.id]);
    setTestSearch('');
  };

  const handlePanelSelect = (panel: TestPanel) => {
    const panelTests = tests.filter((test) => panel.testIds.includes(test.id));
    const newTests = panelTests.filter((test) => !selectedTests.some((st) => st.id === test.id));
    setSelectedTests([...selectedTests, ...newTests]);
    setValue('tests', [...selectedTests.map((t) => t.id), ...newTests.map((t) => t.id)]);
  };

  const handleRemoveTest = (testId: string) => {
    setSelectedTests(selectedTests.filter((t) => t.id !== testId));
    setValue(
      'tests',
      selectedTests.filter((t) => t.id !== testId).map((t) => t.id)
    );
  };

  const calculateTotalCost = () => {
    return selectedTests.reduce((sum, test) => sum + (test.cost || 0), 0);
  };

  const onFormSubmit = (data: TestOrderFormData) => {
    if (!selectedPatient) return;
    onSubmit(data);
  };

  return (
    <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6">
      {/* Patient Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Patient Information</h3>

        {!selectedPatient ? (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Patient</label>
            <div className="relative">
              <TextField
                label=""
                name="patientSearch"
                value={patientSearch}
                onChange={setPatientSearch}
                placeholder="Search by name or MRN..."
                showLabel={false}
                icon={<Search className="h-5 w-5 text-gray-400" />}
              />
            </div>

            {patientSearch && filteredPatients.length > 0 && (
              <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
                {filteredPatients.slice(0, 5).map((patient) => (
                  <button
                    key={patient.id}
                    type="button"
                    onClick={() => handlePatientSelect(patient)}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                  >
                    <div className="font-medium">{patient.fullName}</div>
                    <div className="text-sm text-gray-600">
                      Patient ID: {patient.patientId} | DOB:{' '}
                      {new Date(patient.dateOfBirth).toLocaleDateString()}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-blue-50 p-4 rounded-md">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-medium">{selectedPatient.fullName}</p>
                <p className="text-sm text-gray-600">
                  Patient ID: {selectedPatient.patientId} | DOB:{' '}
                  {new Date(selectedPatient.dateOfBirth).toLocaleDateString()} | Gender:{' '}
                  {selectedPatient.gender}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedPatient(null);
                  setValue('patientId', '');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Order Details */}
      <div className="bg-white shadow rounded-lg p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4">Order Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Controller
            name="priority"
            control={control}
            render={({ field }) => (
              <SelectField
                label="Priority"
                name="priority"
                value={field.value}
                onChange={field.onChange}
                options={[
                  { value: 'routine', label: 'Routine' },
                  { value: 'stat', label: 'STAT' },
                  { value: 'asap', label: 'ASAP' },
                ]}
                showLabel
              />
            )}
          />

          <Controller
            name="fasting"
            control={control}
            render={({ field }) => (
              <CheckboxField
                label="Fasting Required"
                name="fasting"
                checked={field.value}
                onChange={field.onChange}
                showLabel
              />
            )}
          />

          <div className="md:col-span-2">
            <Controller
              name="clinicalHistory"
              control={control}
              render={({ field }) => (
                <LexicalEditorField
                  label="Clinical History"
                  name="clinicalHistory"
                  value={field.value || ''}
                  onChange={field.onChange}
                  rows={2}
                  showLabel
                />
              )}
            />
          </div>

          <div className="md:col-span-2">
            <Controller
              name="diagnosis"
              control={control}
              render={({ field }) => (
                <TextField
                  label="Diagnosis/Reason for Testing"
                  name="diagnosis"
                  value={field.value || ''}
                  onChange={field.onChange}
                  showLabel
                />
              )}
            />
          </div>
        </div>

        {priority === 'stat' && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-md flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-yellow-800">
              STAT orders require immediate processing. Please ensure specimen collection is
              prioritized.
            </p>
          </div>
        )}
      </div>

      {/* Test Selection */}
      <div className="bg-white shadow rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">Tests</h3>
          <button
            type="button"
            onClick={() => setShowPanels(!showPanels)}
            className="text-sm text-blue-600 hover:text-blue-800"
          >
            {showPanels ? 'Show Individual Tests' : 'Show Panels'}
          </button>
        </div>

        {/* Test/Panel Search */}
        <div className="mb-4">
          <div className="relative">
            <TextField
              label=""
              name="testSearch"
              value={testSearch}
              onChange={setTestSearch}
              placeholder={showPanels ? 'Search panels...' : 'Search tests...'}
              showLabel={false}
              icon={<Search className="h-5 w-5 text-gray-400" />}
            />
          </div>

          {testSearch && (showPanels ? panels : filteredTests).length > 0 && (
            <div className="mt-2 border rounded-md max-h-48 overflow-y-auto">
              {showPanels
                ? panels
                    .filter(
                      (panel) =>
                        panel.name.toLowerCase().includes(testSearch.toLowerCase()) ||
                        panel.code.toLowerCase().includes(testSearch.toLowerCase())
                    )
                    .map((panel) => (
                      <button
                        key={panel.id}
                        type="button"
                        onClick={() => handlePanelSelect(panel)}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                      >
                        <div className="font-medium">{panel.name}</div>
                        <div className="text-sm text-gray-600">
                          Code: {panel.code} | Tests: {panel.testIds.length}
                        </div>
                      </button>
                    ))
                : filteredTests.slice(0, 10).map((test) => (
                    <button
                      key={test.id}
                      type="button"
                      onClick={() => handleTestSelect(test)}
                      className="w-full text-left px-4 py-2 hover:bg-gray-50 border-b last:border-b-0"
                    >
                      <div className="font-medium">{test.name}</div>
                      <div className="text-sm text-gray-600">
                        Code: {test.code} | {test.specimen.type} | ${test.cost || 0}
                      </div>
                    </button>
                  ))}
            </div>
          )}
        </div>

        {/* Selected Tests */}
        <div className="space-y-2">
          {selectedTests.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No tests selected. Search and add tests or panels.
            </p>
          ) : (
            <>
              {selectedTests.map((test) => (
                <div
                  key={test.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                >
                  <div>
                    <div className="font-medium">{test.name}</div>
                    <div className="text-sm text-gray-600">
                      Code: {test.code} | TAT: {test.turnaroundTime.routine}h | ${test.cost || 0}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveTest(test.id)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              ))}
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div className="flex justify-between text-lg font-medium">
                  <span>Total Cost:</span>
                  <span>${calculateTotalCost().toFixed(2)}</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

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
          disabled={isLoading || !selectedPatient || selectedTests.length === 0}
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Creating Order...' : 'Create Order'}
        </button>
      </div>
    </form>
  );
};

export default TestOrderForm;
