import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatient, useUpdatePatient } from '@/hooks/usePatients';
import { LoadingScreen } from '@/components/ui/LoadingScreen';
import { toast } from '@/stores/toast.store';
import { useAuthStore } from '@/stores/auth.store';
import { PatientEditForm } from '@/components/patients/PatientEditForm';
import type { UpdatePatientData } from '@/types/patient.types';
import PageHeader from '@/components/common/PageHeader';

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
        data: {
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
      <PageHeader
        title="Edit Patient"
        subtitle={`Update patient information for ${patient.firstName} ${patient.lastName}`}
        backTo={`/patients/${patientId}`}
        backLabel="Back to Patient Details"
      />

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