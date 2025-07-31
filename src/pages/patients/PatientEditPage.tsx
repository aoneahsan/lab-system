import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient, useUpdatePatient } from '@/hooks/usePatients';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { PatientEditForm } from '@/components/patients/PatientEditForm';
import type { UpdatePatientData } from '@/types/patient.types';
import { ArrowLeft } from 'lucide-react';

const PatientEditPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { currentUser } = useAuthStore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: patient, isLoading, error } = usePatient(patientId || '');
  const updatePatientMutation = useUpdatePatient();

  useEffect(() => {
    if (error) {
      toast.error('Error Loading Patient', 'Unable to load patient data');
      navigate('/patients');
    }
  }, [error, navigate]);

  const handleSubmit = async (data: Partial<UpdatePatientData>) => {
    if (!currentUser || !patientId) return;

    setIsSubmitting(true);
    try {
      await updatePatientMutation.mutateAsync({
        patientId,
        updates: {
          ...data,
          updatedBy: currentUser.email,
          updatedAt: new Date(),
        },
      });

      toast.success('Patient Updated', 'Patient information has been updated successfully');
      navigate(`/patients/${patientId}`);
    } catch (error) {
      console.error('Error updating patient:', error);
      toast.error('Update Failed', 'Unable to update patient information');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate(`/patients/${patientId}`);
  };

  if (isLoading) {
    return <LoadingScreen />;
  }

  if (!patient) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-white mb-2">
          Patient not found
        </h2>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          The patient you're looking for doesn't exist or has been removed.
        </p>
        <button onClick={() => navigate('/patients')} className="btn btn-primary">
          Back to Patients
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(`/patients/${patientId}`)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              Edit Patient
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Update patient information for {patient.firstName} {patient.lastName}
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg">
        <PatientEditForm
          patient={patient}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          isSubmitting={isSubmitting}
        />
      </div>
    </div>
  );
};

export default PatientEditPage;