import { collection, doc, setDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { db } from '@/config/firebase';
import { COLLECTIONS } from '@/config/firebase-collections';
import type {
  EMRConnection,
  FHIRAuthConfig,
  EMRMessage,
  FHIRResourceType,
} from '@/types/emr.types';

// FHIR Resource interfaces (simplified)
export interface FHIRPatient {
  resourceType: 'Patient';
  id?: string;
  identifier?: Array<{
    system?: string;
    value?: string;
  }>;
  name?: Array<{
    family?: string;
    given?: string[];
    use?: string;
  }>;
  gender?: string;
  birthDate?: string;
  telecom?: Array<{
    system?: string;
    value?: string;
    use?: string;
  }>;
  address?: Array<{
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  }>;
}

export interface FHIRObservation {
  resourceType: 'Observation';
  id?: string;
  status:
    | 'registered'
    | 'preliminary'
    | 'final'
    | 'amended'
    | 'corrected'
    | 'cancelled'
    | 'entered-in-error'
    | 'unknown';
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
    display?: string;
  };
  effectiveDateTime?: string;
  valueQuantity?: {
    value?: number;
    unit?: string;
    system?: string;
    code?: string;
  };
  valueString?: string;
  valueBoolean?: boolean;
  referenceRange?: Array<{
    low?: { value?: number; unit?: string };
    high?: { value?: number; unit?: string };
    text?: string;
  }>;
}

export interface FHIRDiagnosticReport {
  resourceType: 'DiagnosticReport';
  id?: string;
  status:
    | 'registered'
    | 'partial'
    | 'preliminary'
    | 'final'
    | 'amended'
    | 'corrected'
    | 'appended'
    | 'cancelled'
    | 'entered-in-error'
    | 'unknown';
  code: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
    display?: string;
  };
  effectiveDateTime?: string;
  issued?: string;
  result?: Array<{
    reference?: string;
    display?: string;
  }>;
  conclusion?: string;
}

export interface FHIRServiceRequest {
  resourceType: 'ServiceRequest';
  id?: string;
  status: 'draft' | 'active' | 'on-hold' | 'revoked' | 'completed' | 'entered-in-error' | 'unknown';
  intent:
    | 'proposal'
    | 'plan'
    | 'directive'
    | 'order'
    | 'original-order'
    | 'reflex-order'
    | 'filler-order'
    | 'instance-order'
    | 'option';
  priority?: 'routine' | 'urgent' | 'asap' | 'stat';
  code?: {
    coding?: Array<{
      system?: string;
      code?: string;
      display?: string;
    }>;
    text?: string;
  };
  subject?: {
    reference?: string;
    display?: string;
  };
  requester?: {
    reference?: string;
    display?: string;
  };
  occurrenceDateTime?: string;
}

type FHIRResource = FHIRPatient | FHIRObservation | FHIRDiagnosticReport | FHIRServiceRequest;

class FHIRService {
  private authTokens: Map<string, { token: string; expiresAt: Date }> = new Map();

  // Helper method to map FHIR priority to EMR priority
  private mapFHIRPriorityToEMRPriority(fhirPriority?: string): 'high' | 'normal' | 'low' {
    switch (fhirPriority) {
      case 'stat':
      case 'urgent':
        return 'high';
      case 'asap':
      case 'routine':
      default:
        return 'normal';
    }
  }

  // Authentication methods
  private async getAuthToken(connection: EMRConnection): Promise<string | null> {
    const auth = connection.config.fhirAuth;
    if (!auth || auth.type === 'none') return null;

    const cacheKey = connection.id;
    const cached = this.authTokens.get(cacheKey);

    if (cached && cached.expiresAt > new Date()) {
      return cached.token;
    }

    switch (auth.type) {
      case 'basic':
        return this.getBasicAuthToken(auth.username!, auth.password!);

      case 'bearer':
        return auth.token || null;

      case 'oauth2':
        return this.getOAuth2Token(auth);

      default:
        return null;
    }
  }

  private getBasicAuthToken(username: string, password: string): string {
    return 'Basic ' + btoa(`${username}:${password}`);
  }

  private async getOAuth2Token(auth: FHIRAuthConfig): Promise<string | null> {
    if (!auth.tokenUrl || !auth.clientId || !auth.clientSecret) {
      throw new Error('OAuth2 configuration is incomplete');
    }

    try {
      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: auth.clientId,
        client_secret: auth.clientSecret,
      });

      if (auth.scope) {
        params.append('scope', auth.scope);
      }

      const response = await fetch(auth.tokenUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });

      if (!response.ok) {
        throw new Error(`OAuth2 token request failed: ${response.statusText}`);
      }

      const data = await response.json();
      const token = data.access_token;
      const expiresIn = data.expires_in || 3600;

      // Cache the token
      const expiresAt = new Date();
      expiresAt.setSeconds(expiresAt.getSeconds() + expiresIn - 60); // Refresh 1 minute early

      this.authTokens.set(auth.clientId, { token, expiresAt });

      return `Bearer ${token}`;
    } catch (error) {
      console.error('OAuth2 authentication failed:', error);
      throw error;
    }
  }

  // FHIR API methods
  async makeRequest(
    connection: EMRConnection,
    method: string,
    endpoint: string,
    body?: unknown
  ): Promise<unknown> {
    const authToken = await this.getAuthToken(connection);
    const headers: Record<string, string> = {
      'Content-Type': 'application/fhir+json',
      Accept: 'application/fhir+json',
    };

    if (authToken) {
      headers['Authorization'] = authToken;
    }

    const response = await fetch(`${connection.config.fhirBaseUrl}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      throw new Error(`FHIR request failed: ${response.statusText}`);
    }

    return response.json();
  }

  // Resource operations
  async getResource(
    connection: EMRConnection,
    resourceType: FHIRResourceType,
    id: string
  ): Promise<FHIRResource> {
    return this.makeRequest(connection, 'GET', `/${resourceType}/${id}`) as Promise<FHIRResource>;
  }

  async createResource(connection: EMRConnection, resource: FHIRResource): Promise<FHIRResource> {
    return this.makeRequest(
      connection,
      'POST',
      `/${resource.resourceType}`,
      resource
    ) as Promise<FHIRResource>;
  }

  async updateResource(connection: EMRConnection, resource: FHIRResource): Promise<FHIRResource> {
    if (!resource.id) {
      throw new Error('Resource ID is required for update');
    }

    return this.makeRequest(
      connection,
      'PUT',
      `/${resource.resourceType}/${resource.id}`,
      resource
    ) as Promise<FHIRResource>;
  }

  async searchResources(
    connection: EMRConnection,
    resourceType: FHIRResourceType,
    params: Record<string, string>
  ): Promise<{ entry?: Array<{ resource: FHIRResource }> }> {
    const queryString = new URLSearchParams(params).toString();
    return this.makeRequest(connection, 'GET', `/${resourceType}?${queryString}`) as Promise<{
      entry?: Array<{ resource: FHIRResource }>;
    }>;
  }

  // Patient operations
  async syncPatient(connection: EMRConnection, patientId: string, tenantId: string): Promise<void> {
    try {
      const fhirPatient = (await this.getResource(connection, 'Patient', patientId)) as FHIRPatient;

      // Create a message for processing
      const message: Omit<EMRMessage, 'id'> = {
        tenantId,
        connectionId: connection.id,
        direction: 'inbound',
        protocol: 'fhir',
        messageType: 'Patient',
        status: 'pending',
        priority: 'normal',
        content: fhirPatient as unknown as Record<string, unknown>,
        metadata: {
          patientId: fhirPatient.id,
          sourceSystem: connection.systemType,
          timestamp: new Date().toISOString(),
        },
        attempts: 0,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      // Save to message queue
      const messagesRef = collection(
        db,
        `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_MESSAGES}`
      );
      await setDoc(doc(messagesRef), message);
    } catch (error) {
      console.error('Failed to sync patient:', error);
      throw error;
    }
  }

  // Order operations
  async createLabOrder(
    connection: EMRConnection,
    order: FHIRServiceRequest,
    tenantId: string
  ): Promise<string> {
    try {
      const createdOrder = (await this.createResource(connection, order)) as FHIRServiceRequest;

      // Create a message for tracking
      const message: Omit<EMRMessage, 'id'> = {
        tenantId,
        connectionId: connection.id,
        direction: 'outbound',
        protocol: 'fhir',
        messageType: 'ServiceRequest',
        status: 'completed',
        priority: this.mapFHIRPriorityToEMRPriority(order.priority),
        content: createdOrder as unknown as Record<string, unknown>,
        metadata: {
          orderId: createdOrder.id,
          patientId: order.subject?.reference?.split('/')[1],
          targetSystem: connection.systemType,
          timestamp: new Date().toISOString(),
        },
        attempts: 1,
        completedAt: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const messagesRef = collection(
        db,
        `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_MESSAGES}`
      );
      await setDoc(doc(messagesRef), message);

      return createdOrder.id!;
    } catch (error) {
      console.error('Failed to create lab order:', error);
      throw error;
    }
  }

  // Result operations
  async sendLabResults(
    connection: EMRConnection,
    results: FHIRDiagnosticReport,
    observations: FHIRObservation[],
    tenantId: string
  ): Promise<void> {
    try {
      // Create observations first
      const observationRefs: Array<{ reference: string; display?: string }> = [];

      for (const observation of observations) {
        const created = (await this.createResource(connection, observation)) as FHIRObservation;
        observationRefs.push({
          reference: `Observation/${created.id}`,
          display: observation.code.text || observation.code.coding?.[0]?.display,
        });
      }

      // Create diagnostic report with observation references
      results.result = observationRefs;
      const createdReport = (await this.createResource(
        connection,
        results
      )) as FHIRDiagnosticReport;

      // Create a message for tracking
      const message: Omit<EMRMessage, 'id'> = {
        tenantId,
        connectionId: connection.id,
        direction: 'outbound',
        protocol: 'fhir',
        messageType: 'DiagnosticReport',
        status: 'completed',
        priority: 'normal',
        content: {
          report: createdReport,
          observations: observations,
        },
        metadata: {
          orderId: createdReport.id,
          patientId: results.subject?.reference?.split('/')[1],
          targetSystem: connection.systemType,
          timestamp: new Date().toISOString(),
        },
        attempts: 1,
        completedAt: serverTimestamp() as Timestamp,
        createdAt: serverTimestamp() as Timestamp,
        updatedAt: serverTimestamp() as Timestamp,
      };

      const messagesRef = collection(
        db,
        `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_MESSAGES}`
      );
      await setDoc(doc(messagesRef), message);
    } catch (error) {
      console.error('Failed to send lab results:', error);
      throw error;
    }
  }

  // Connection testing
  async testConnection(connection: EMRConnection): Promise<{ success: boolean; message: string }> {
    try {
      // Try to get the capability statement
      const response = await this.makeRequest(connection, 'GET', '/metadata');

      if (response && typeof response === 'object' && 'resourceType' in response) {
        return {
          success: true,
          message: 'Successfully connected to FHIR server',
        };
      }

      return {
        success: false,
        message: 'Invalid response from FHIR server',
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed',
      };
    }
  }
}

export const fhirService = new FHIRService();
