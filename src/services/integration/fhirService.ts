import { logger } from '@/services/monitoring/logger';

export interface FHIRResource {
  resourceType: string;
  id?: string;
  meta?: {
    versionId?: string;
    lastUpdated?: string;
  };
}

export interface FHIRPatient extends FHIRResource {
  resourceType: 'Patient';
  identifier: Array<{
    system: string;
    value: string;
  }>;
  name: Array<{
    family: string;
    given: string[];
  }>;
  gender: string;
  birthDate: string;
}

export interface FHIRDiagnosticReport extends FHIRResource {
  resourceType: 'DiagnosticReport';
  status: string;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
  };
  result: Array<{
    reference: string;
  }>;
}

export class FHIRService {
  createPatient(patientData: any): FHIRPatient {
    return {
      resourceType: 'Patient',
      id: patientData.id,
      identifier: [{
        system: 'http://labflow.app/mrn',
        value: patientData.mrn
      }],
      name: [{
        family: patientData.lastName,
        given: [patientData.firstName]
      }],
      gender: patientData.gender.toLowerCase(),
      birthDate: patientData.dateOfBirth
    };
  }

  createDiagnosticReport(result: any): FHIRDiagnosticReport {
    return {
      resourceType: 'DiagnosticReport',
      id: result.id,
      status: result.status,
      code: {
        coding: [{
          system: 'http://loinc.org',
          code: result.test.loincCode,
          display: result.test.name
        }]
      },
      subject: {
        reference: `Patient/${result.patientId}`
      },
      result: [{
        reference: `Observation/${result.id}`
      }]
    };
  }

  async sendToEHR(resource: FHIRResource, ehrEndpoint: string): Promise<void> {
    try {
      const response = await fetch(ehrEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/fhir+json',
          'Accept': 'application/fhir+json'
        },
        body: JSON.stringify(resource)
      });

      if (!response.ok) {
        throw new Error(`FHIR send failed: ${response.statusText}`);
      }

      logger.info('FHIR resource sent successfully', { 
        resourceType: resource.resourceType, 
        id: resource.id 
      });
    } catch (error) {
      logger.error('Failed to send FHIR resource', error);
      throw error;
    }
  }
}

export const fhirService = new FHIRService();