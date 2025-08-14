import { useState } from 'react';
import { format } from 'date-fns';
import type { Patient, PatientAllergy, PatientMedication, PatientMedicalHistory } from '@/types/patient.types';
import { AddAllergyModal } from '../modals/AddAllergyModal';
import { AddMedicationModal } from '../modals/AddMedicationModal';
import { AddMedicalHistoryModal } from '../modals/AddMedicalHistoryModal';
import { DeleteConfirmModal } from '../modals/DeleteConfirmModal';
import { useUpdatePatient } from '@/hooks/usePatients';
import { toast } from 'react-hot-toast';

interface PatientMedicalHistoryTabProps {
  patient: Patient;
  patientId: string;
}

export const PatientMedicalHistoryTab = ({ patient, patientId }: PatientMedicalHistoryTabProps) => {
  const [isAllergyModalOpen, setIsAllergyModalOpen] = useState(false);
  const [isMedicationModalOpen, setIsMedicationModalOpen] = useState(false);
  const [isMedicalHistoryModalOpen, setIsMedicalHistoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingAllergy, setEditingAllergy] = useState<PatientAllergy | undefined>();
  const [editingMedication, setEditingMedication] = useState<PatientMedication | undefined>();
  const [editingHistory, setEditingHistory] = useState<PatientMedicalHistory | undefined>();
  
  const [deleteItem, setDeleteItem] = useState<{
    type: 'allergy' | 'medication' | 'history';
    index: number;
    name: string;
  } | null>(null);

  const updatePatient = useUpdatePatient();

  // Handle Allergy operations
  const handleAddAllergy = async (allergy: PatientAllergy) => {
    try {
      const updatedAllergies = editingAllergy 
        ? patient.allergies.map((a, i) => i === patient.allergies.indexOf(editingAllergy) ? allergy : a)
        : [...patient.allergies, allergy];
      
      await updatePatient.mutateAsync({
        patientId: patientId,
        data: { allergies: updatedAllergies }
      });
      
      toast.success(editingAllergy ? 'Allergy updated successfully' : 'Allergy added successfully');
      setEditingAllergy(undefined);
    } catch (error) {
      toast.error('Failed to save allergy');
      throw error;
    }
  };

  const handleEditAllergy = (allergy: PatientAllergy) => {
    setEditingAllergy(allergy);
    setIsAllergyModalOpen(true);
  };

  // Handle Medication operations
  const handleAddMedication = async (medication: PatientMedication) => {
    try {
      const updatedMedications = editingMedication
        ? patient.medications.map((m, i) => i === patient.medications.indexOf(editingMedication) ? medication : m)
        : [...patient.medications, medication];
      
      await updatePatient.mutateAsync({
        patientId: patientId,
        data: { medications: updatedMedications }
      });
      
      toast.success(editingMedication ? 'Medication updated successfully' : 'Medication added successfully');
      setEditingMedication(undefined);
    } catch (error) {
      toast.error('Failed to save medication');
      throw error;
    }
  };

  const handleEditMedication = (medication: PatientMedication) => {
    setEditingMedication(medication);
    setIsMedicationModalOpen(true);
  };

  // Handle Medical History operations
  const handleAddMedicalHistory = async (history: PatientMedicalHistory) => {
    try {
      const updatedHistory = editingHistory
        ? patient.medicalHistory.map((h, i) => i === patient.medicalHistory.indexOf(editingHistory) ? history : h)
        : [...patient.medicalHistory, history];
      
      await updatePatient.mutateAsync({
        patientId: patientId,
        data: { medicalHistory: updatedHistory }
      });
      
      toast.success(editingHistory ? 'Medical condition updated successfully' : 'Medical condition added successfully');
      setEditingHistory(undefined);
    } catch (error) {
      toast.error('Failed to save medical condition');
      throw error;
    }
  };

  const handleEditHistory = (history: PatientMedicalHistory) => {
    setEditingHistory(history);
    setIsMedicalHistoryModalOpen(true);
  };

  // Handle Delete operations
  const handleDelete = async () => {
    if (!deleteItem) return;
    
    try {
      let updateData: any = {};
      
      if (deleteItem.type === 'allergy') {
        updateData.allergies = patient.allergies.filter((_, i) => i !== deleteItem.index);
      } else if (deleteItem.type === 'medication') {
        updateData.medications = patient.medications.filter((_, i) => i !== deleteItem.index);
      } else if (deleteItem.type === 'history') {
        updateData.medicalHistory = patient.medicalHistory.filter((_, i) => i !== deleteItem.index);
      }
      
      await updatePatient.mutateAsync({
        patientId: patientId,
        data: updateData
      });
      
      toast.success(`${deleteItem.type} deleted successfully`);
      setDeleteItem(null);
    } catch (error) {
      toast.error(`Failed to delete ${deleteItem.type}`);
    }
  };

  const openDeleteModal = (type: 'allergy' | 'medication' | 'history', index: number, name: string) => {
    setDeleteItem({ type, index, name });
    setIsDeleteModalOpen(true);
  };
  return (
    <div className="space-y-6">
      {/* Allergies */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Allergies</h3>
          <button 
            onClick={() => {
              setEditingAllergy(undefined);
              setIsAllergyModalOpen(true);
            }}
            className="btn btn-sm btn-primary"
          >
            Add Allergy
          </button>
        </div>

        {patient.allergies.length > 0 ? (
          <div className="space-y-3">
            {patient.allergies.map((allergy, index) => (
              <div
                key={index}
                className={`p-4 rounded-lg border ${
                  allergy.severity === 'severe'
                    ? 'bg-danger-50 dark:bg-danger-900/20 border-danger-200 dark:border-danger-800'
                    : allergy.severity === 'moderate'
                      ? 'bg-warning-50 dark:bg-warning-900/20 border-warning-200 dark:border-warning-800'
                      : 'bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {allergy.allergen}
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Reaction: {allergy.reaction}
                    </p>
                    <div className="flex items-center gap-4 mt-2 text-sm">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                          allergy.severity === 'severe'
                            ? 'bg-danger-100 text-danger-800'
                            : allergy.severity === 'moderate'
                              ? 'bg-warning-100 text-warning-800'
                              : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {allergy.severity}
                      </span>
                      {allergy.confirmedDate && (
                        <span className="text-gray-500">
                          Confirmed: {format(allergy.confirmedDate, 'MMM dd, yyyy')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => handleEditAllergy(allergy)}
                      className="text-gray-400 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button 
                      onClick={() => openDeleteModal('allergy', index, allergy.allergen)}
                      className="text-gray-400 hover:text-danger-600"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No known allergies</p>
          </div>
        )}
      </div>

      {/* Medications */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Current Medications</h3>
          <button 
            onClick={() => {
              setEditingMedication(undefined);
              setIsMedicationModalOpen(true);
            }}
            className="btn btn-sm btn-primary"
          >
            Add Medication
          </button>
        </div>

        {patient.medications.length > 0 ? (
          <div className="space-y-3">
            {patient.medications
              .filter((med) => !med.endDate || new Date(med.endDate) >= new Date())
              .map((medication, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {medication.name}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-2 text-sm">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Dosage:</span>
                          <p className="text-gray-900 dark:text-white">{medication.dosage}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Frequency:</span>
                          <p className="text-gray-900 dark:text-white">{medication.frequency}</p>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Prescribed by:</span>
                          <p className="text-gray-900 dark:text-white">
                            {medication.prescribedBy || 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        Started: {format(medication.startDate, 'MMM dd, yyyy')}
                      </p>
                      {medication.notes && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                          Notes: {medication.notes}
                        </p>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      <button 
                        onClick={() => handleEditMedication(medication)}
                        className="text-gray-400 hover:text-primary-600"
                        title="Edit"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                          />
                        </svg>
                      </button>
                      <button 
                        onClick={() => openDeleteModal('medication', index, medication.name)}
                        className="text-gray-400 hover:text-danger-600"
                        title="Delete"
                      >
                        <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No current medications</p>
          </div>
        )}
      </div>

      {/* Medical History */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">Medical History</h3>
          <button 
            onClick={() => {
              setEditingHistory(undefined);
              setIsMedicalHistoryModalOpen(true);
            }}
            className="btn btn-sm btn-primary"
          >
            Add Condition
          </button>
        </div>

        {patient.medicalHistory.length > 0 ? (
          <div className="space-y-3">
            {patient.medicalHistory.map((history, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      {history.condition}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2 text-sm">
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Status:</span>
                        <p className="text-gray-900 dark:text-white">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                              history.status === 'active'
                                ? 'bg-warning-100 text-warning-800'
                                : history.status === 'resolved'
                                  ? 'bg-success-100 text-success-800'
                                  : 'bg-gray-100 text-gray-800'
                            }`}
                          >
                            {history.status}
                          </span>
                        </p>
                      </div>
                      {history.diagnosedDate && (
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Diagnosed:</span>
                          <p className="text-gray-900 dark:text-white">
                            {format(history.diagnosedDate, 'MMM dd, yyyy')}
                          </p>
                        </div>
                      )}
                    </div>
                    {history.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {history.notes}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <button 
                      onClick={() => handleEditHistory(history)}
                      className="text-gray-400 hover:text-primary-600"
                      title="Edit"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button 
                      onClick={() => openDeleteModal('history', index, history.condition)}
                      className="text-gray-400 hover:text-danger-600"
                      title="Delete"
                    >
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 bg-gray-50 dark:bg-gray-900 rounded-lg">
            <p className="text-gray-500 dark:text-gray-400">No medical history recorded</p>
          </div>
        )}
      </div>

      {/* Past Medications */}
      {patient.medications.filter((med) => med.endDate && new Date(med.endDate) < new Date())
        .length > 0 && (
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">
            Past Medications
          </h3>
          <div className="space-y-3">
            {patient.medications
              .filter((med) => med.endDate && new Date(med.endDate) < new Date())
              .map((medication, index) => (
                <div
                  key={index}
                  className="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 opacity-75"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        {medication.name}
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {medication.dosage} - {medication.frequency}
                      </p>
                      <p className="text-sm text-gray-500 mt-2">
                        {format(medication.startDate, 'MMM dd, yyyy')} -{' '}
                        {medication.endDate && format(medication.endDate, 'MMM dd, yyyy')}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Modals */}
      <AddAllergyModal
        isOpen={isAllergyModalOpen}
        onClose={() => {
          setIsAllergyModalOpen(false);
          setEditingAllergy(undefined);
        }}
        onSubmit={handleAddAllergy}
        allergy={editingAllergy}
      />

      <AddMedicationModal
        isOpen={isMedicationModalOpen}
        onClose={() => {
          setIsMedicationModalOpen(false);
          setEditingMedication(undefined);
        }}
        onSubmit={handleAddMedication}
        medication={editingMedication}
      />

      <AddMedicalHistoryModal
        isOpen={isMedicalHistoryModalOpen}
        onClose={() => {
          setIsMedicalHistoryModalOpen(false);
          setEditingHistory(undefined);
        }}
        onSubmit={handleAddMedicalHistory}
        history={editingHistory}
      />

      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setDeleteItem(null);
        }}
        onConfirm={handleDelete}
        title={`Delete ${deleteItem?.type || ''}`}
        message={`Are you sure you want to delete this ${deleteItem?.type || 'item'}?`}
        itemName={deleteItem?.name}
      />
    </div>
  );
};
