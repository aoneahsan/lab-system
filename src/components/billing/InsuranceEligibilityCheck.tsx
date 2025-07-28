import React, { useState } from 'react';
import { Shield, CheckCircle, XCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { useCheckEligibility, usePatientInsurance } from '@/hooks/useBilling';
import type { EligibilityCheckRequest, InsuranceEligibility } from '@/types/billing.types';

interface InsuranceEligibilityCheckProps {
  patientId: string;
  onClose?: () => void;
}

const InsuranceEligibilityCheck: React.FC<InsuranceEligibilityCheckProps> = ({
  patientId,
  onClose,
}) => {
  const [selectedInsurance, setSelectedInsurance] = useState<string>('');
  const { data: patientInsurance = [] } = usePatientInsurance(patientId);
  const checkEligibilityMutation = useCheckEligibility();

  const [eligibilityResult, setEligibilityResult] = useState<InsuranceEligibility | null>(null);

  const handleCheckEligibility = async () => {
    if (!selectedInsurance) return;

    const insurance = patientInsurance.find((i) => i.id === selectedInsurance);
    if (!insurance) return;

    const request: EligibilityCheckRequest = {
      patientId,
      insuranceProviderId: insurance.providerId,
      memberNumber: insurance.policyNumber,
      groupNumber: insurance.groupNumber,
      dateOfService: new Date(),
    };

    const result = await checkEligibilityMutation.mutateAsync(request);
    setEligibilityResult(result);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'inactive':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'checking':
        return <RefreshCw className="h-5 w-5 text-blue-500 animate-spin" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold">Insurance Eligibility Verification</h2>
        </div>
        {onClose && (
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            ×
          </button>
        )}
      </div>

      {/* Insurance Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Insurance Plan
        </label>
        <select
          value={selectedInsurance}
          onChange={(e) => setSelectedInsurance(e.target.value)}
          className="w-full border border-gray-300 rounded-md px-3 py-2"
        >
          <option value="">Select insurance...</option>
          {patientInsurance.map((insurance) => (
            <option key={insurance.id} value={insurance.id}>
              {insurance.insuranceType} - {insurance.providerId} ({insurance.policyNumber})
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleCheckEligibility}
        disabled={!selectedInsurance || checkEligibilityMutation.isPending}
        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 flex items-center gap-2"
      >
        {checkEligibilityMutation.isPending ? (
          <>
            <RefreshCw className="h-4 w-4 animate-spin" />
            Checking Eligibility...
          </>
        ) : (
          <>
            <Shield className="h-4 w-4" />
            Check Eligibility
          </>
        )}
      </button>

      {/* Results */}
      {eligibilityResult && (
        <div className="mt-6 space-y-4">
          {/* Status */}
          <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
            {getStatusIcon(eligibilityResult.status)}
            <div>
              <p className="font-medium">
                Coverage Status: {eligibilityResult.status.toUpperCase()}
              </p>
              {eligibilityResult.responseMessage && (
                <p className="text-sm text-gray-600">{eligibilityResult.responseMessage}</p>
              )}
            </div>
          </div>

          {/* Coverage Details */}
          {eligibilityResult.status === 'active' && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Coverage Types</h4>
                  <div className="space-y-1">
                    {Object.entries(eligibilityResult.coverage).map(([type, covered]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="capitalize">{type}:</span>
                        <span className={covered ? 'text-green-600' : 'text-red-600'}>
                          {covered ? 'Covered' : 'Not Covered'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Effective Dates</h4>
                  <div className="space-y-1">
                    <div className="flex justify-between">
                      <span>Effective:</span>
                      <span>
                        {new Date(eligibilityResult.effectiveDate.toDate()).toLocaleDateString()}
                      </span>
                    </div>
                    {eligibilityResult.terminationDate && (
                      <div className="flex justify-between">
                        <span>Termination:</span>
                        <span>
                          {new Date(
                            eligibilityResult.terminationDate.toDate()
                          ).toLocaleDateString()}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Financial Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Deductible</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Individual</p>
                      <p className="font-medium">
                        ${eligibilityResult.deductible.individualMet} / $
                        {eligibilityResult.deductible.individual}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-blue-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (eligibilityResult.deductible.individualMet /
                                eligibilityResult.deductible.individual) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    {eligibilityResult.deductible.family > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Family</p>
                        <p className="font-medium">
                          ${eligibilityResult.deductible.familyMet} / $
                          {eligibilityResult.deductible.family}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (eligibilityResult.deductible.familyMet /
                                  eligibilityResult.deductible.family) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Out of Pocket Maximum</h4>
                  <div className="space-y-2">
                    <div>
                      <p className="text-sm text-gray-600">Individual</p>
                      <p className="font-medium">
                        ${eligibilityResult.outOfPocketMax.individualMet} / $
                        {eligibilityResult.outOfPocketMax.individual}
                      </p>
                      <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                        <div
                          className="bg-green-600 h-2 rounded-full"
                          style={{
                            width: `${
                              (eligibilityResult.outOfPocketMax.individualMet /
                                eligibilityResult.outOfPocketMax.individual) *
                              100
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                    {eligibilityResult.outOfPocketMax.family > 0 && (
                      <div>
                        <p className="text-sm text-gray-600">Family</p>
                        <p className="font-medium">
                          ${eligibilityResult.outOfPocketMax.familyMet} / $
                          {eligibilityResult.outOfPocketMax.family}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div
                            className="bg-green-600 h-2 rounded-full"
                            style={{
                              width: `${
                                (eligibilityResult.outOfPocketMax.familyMet /
                                  eligibilityResult.outOfPocketMax.family) *
                                100
                              }%`,
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Copay Information */}
              {eligibilityResult.copay && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Copay Amounts</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(eligibilityResult.copay).map(([type, amount]) => (
                      <div key={type}>
                        <p className="text-sm text-gray-600 capitalize">
                          {type.replace(/([A-Z])/g, ' $1').trim()}
                        </p>
                        <p className="font-medium">${amount}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Coinsurance */}
              {eligibilityResult.coinsurance && (
                <div className="border rounded-lg p-4">
                  <h4 className="font-medium mb-2">Coinsurance</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">In-Network</p>
                      <p className="font-medium">{eligibilityResult.coinsurance.inNetwork}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Out-of-Network</p>
                      <p className="font-medium">{eligibilityResult.coinsurance.outOfNetwork}%</p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default InsuranceEligibilityCheck;
