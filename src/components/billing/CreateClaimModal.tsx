import React, { useState } from 'react';
import { X, FileText, Search } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useInvoices, useInsuranceProviders } from '@/hooks/useBilling';
import { usePatients } from '@/hooks/usePatients';
import { billingService } from '@/services/billing.service';
import { useTenant } from '@/hooks/useTenant';
import { useAuthStore } from '@/stores/auth.store';
import { toast } from '@/stores/toast.store';
import type { ClaimFormData } from '@/types/billing.types';

interface CreateClaimModalProps {
  isOpen: boolean;
  onClose: () => void;
  preSelectedInvoiceId?: string;
}

const CreateClaimModal: React.FC<CreateClaimModalProps> = ({
  isOpen,
  onClose,
  preSelectedInvoiceId,
}) => {
  const { tenant } = useTenant();
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  
  const { data: invoices = [] } = useInvoices();
  const { data: insuranceProviders = [] } = useInsuranceProviders();
  const { data: patientsData } = usePatients();
  const patients = patientsData?.patients || [];

  const [formData, setFormData] = useState<Partial<ClaimFormData>>({
    invoiceId: preSelectedInvoiceId || '',
    insuranceId: '',
    serviceDate: new Date(),
    primaryDiagnosis: '',
    secondaryDiagnoses: [],
    services: [],
    renderingProvider: user?.displayName || '',
    notes: '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const createClaimMutation = useMutation({
    mutationFn: async (data: ClaimFormData) => {
      if (!tenant || !user) throw new Error('Missing tenant or user');
      return billingService.createClaim(tenant.id, user.uid, data);
    },
    onSuccess: () => {
      toast.success('Insurance Claim Created', 'The claim has been created successfully');
      queryClient.invalidateQueries({ queryKey: ['billing', 'claims'] });
      onClose();
    },
    onError: (error) => {
      toast.error('Failed to Create Claim', error instanceof Error ? error.message : 'An error occurred');
    },
  });

  const selectedInvoice = invoices.find(inv => inv.id === formData.invoiceId);
  const selectedPatient = selectedInvoice ? patients.find(p => p.id === selectedInvoice.patientId) : null;

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.invoiceId) {
      newErrors.invoiceId = 'Invoice is required';
    }
    if (!formData.insuranceId) {
      newErrors.insuranceId = 'Insurance provider is required';
    }
    if (!formData.primaryDiagnosis) {
      newErrors.primaryDiagnosis = 'Primary diagnosis is required';
    }
    if (!formData.serviceDate) {
      newErrors.serviceDate = 'Service date is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (validateForm() && selectedInvoice) {
      const claimData: ClaimFormData = {
        invoiceId: formData.invoiceId!,
        insuranceId: formData.insuranceId!,
        serviceDate: formData.serviceDate!,
        primaryDiagnosis: formData.primaryDiagnosis!,
        secondaryDiagnoses: formData.secondaryDiagnoses || [],
        services: selectedInvoice.items.map(item => ({
          serviceDate: formData.serviceDate!,
          cptCode: item.cptCode || '',
          units: item.quantity,
          charge: item.total,
        })),
        renderingProvider: formData.renderingProvider!,
        notes: formData.notes,
      };

      createClaimMutation.mutate(claimData);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={onClose} />
        <div className="relative bg-white rounded-lg max-w-2xl w-full">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Create Insurance Claim
              </h3>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>

          <div className="p-6">
            <div className="space-y-4">
              {/* Invoice Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.invoiceId}
                  onChange={(e) => setFormData({ ...formData, invoiceId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.invoiceId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select invoice</option>
                  {invoices.filter(inv => inv.status !== 'cancelled').map((invoice) => (
                    <option key={invoice.id} value={invoice.id}>
                      #{invoice.invoiceNumber} - ${invoice.totalAmount.toFixed(2)} - {invoice.status}
                    </option>
                  ))}
                </select>
                {errors.invoiceId && (
                  <p className="text-sm text-red-600 mt-1">{errors.invoiceId}</p>
                )}
              </div>

              {/* Patient Info (Read-only) */}
              {selectedPatient && (
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Patient Information</h4>
                  <div className="text-sm text-gray-600">
                    <p><span className="font-medium">Name:</span> {selectedPatient.firstName} {selectedPatient.lastName}</p>
                    <p><span className="font-medium">DOB:</span> {new Date(selectedPatient.dateOfBirth).toLocaleDateString()}</p>
                    <p><span className="font-medium">Patient ID:</span> {selectedPatient.patientId}</p>
                  </div>
                </div>
              )}

              {/* Insurance Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Insurance Provider <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.insuranceId}
                  onChange={(e) => setFormData({ ...formData, insuranceId: e.target.value })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.insuranceId ? 'border-red-300' : 'border-gray-300'
                  }`}
                >
                  <option value="">Select insurance provider</option>
                  {insuranceProviders.map((provider) => (
                    <option key={provider.id} value={provider.id}>
                      {provider.name}
                    </option>
                  ))}
                </select>
                {errors.insuranceId && (
                  <p className="text-sm text-red-600 mt-1">{errors.insuranceId}</p>
                )}
              </div>

              {/* Service Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Service Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={formData.serviceDate ? new Date(formData.serviceDate).toISOString().split('T')[0] : ''}
                  onChange={(e) => setFormData({ ...formData, serviceDate: new Date(e.target.value) })}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                    errors.serviceDate ? 'border-red-300' : 'border-gray-300'
                  }`}
                />
                {errors.serviceDate && (
                  <p className="text-sm text-red-600 mt-1">{errors.serviceDate}</p>
                )}
              </div>

              {/* Primary Diagnosis */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Primary Diagnosis (ICD-10) <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={formData.primaryDiagnosis}
                    onChange={(e) => setFormData({ ...formData, primaryDiagnosis: e.target.value })}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                      errors.primaryDiagnosis ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="e.g., E11.9"
                  />
                  <button
                    type="button"
                    className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Search className="h-4 w-4" />
                  </button>
                </div>
                {errors.primaryDiagnosis && (
                  <p className="text-sm text-red-600 mt-1">{errors.primaryDiagnosis}</p>
                )}
              </div>

              {/* Rendering Provider */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Rendering Provider
                </label>
                <input
                  type="text"
                  value={formData.renderingProvider}
                  onChange={(e) => setFormData({ ...formData, renderingProvider: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Additional notes or special instructions..."
                />
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={createClaimMutation.isPending}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              {createClaimMutation.isPending ? 'Creating...' : 'Create Claim'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateClaimModal;