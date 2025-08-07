import { insurancePayers, ClaimStatus } from '@/config/payment';
import { InsuranceClaim, InsuranceVerification } from '@/types/billing';

export class InsuranceService {
  // Verify insurance eligibility
  async verifyEligibility(
    payerId: string,
    memberId: string,
    dateOfService: Date
  ): Promise<InsuranceVerification> {
    const response = await fetch('/api/insurance/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ payerId, memberId, dateOfService }),
    });

    if (!response.ok) {
      throw new Error('Failed to verify insurance');
    }

    return response.json();
  }

  // Submit insurance claim
  async submitClaim(claim: InsuranceClaim): Promise<{ claimId: string; status: ClaimStatus }> {
    const response = await fetch('/api/insurance/claims', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(claim),
    });

    if (!response.ok) {
      throw new Error('Failed to submit claim');
    }

    return response.json();
  }

  // Get claim status
  async getClaimStatus(claimId: string): Promise<{ status: ClaimStatus; details: any }> {
    const response = await fetch(`/api/insurance/claims/${claimId}/status`);
    
    if (!response.ok) {
      throw new Error('Failed to get claim status');
    }

    return response.json();
  }
}