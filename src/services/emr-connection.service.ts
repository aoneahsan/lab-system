import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  orderBy,
  serverTimestamp,
  Timestamp,
  updateDoc,
  deleteDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { COLLECTIONS } from '@/constants/firebase';
import { fhirService } from './fhir.service';
import { hl7Parser } from './hl7-parser.service';
import type { 
  EMRConnection,
  EMRConnectionFormData,
  EMRConnectionFilter,
  ConnectionStatus,
  EMRMessage,
  IntegrationLog,
  SyncStatus
} from '@/types/emr.types';

class EMRConnectionService {
  // Connection CRUD operations
  async createConnection(
    tenantId: string,
    userId: string,
    data: EMRConnectionFormData
  ): Promise<string> {
    const now = serverTimestamp() as Timestamp;
    
    const connectionData: Omit<EMRConnection, 'id'> = {
      tenantId,
      name: data.name,
      systemType: data.systemType,
      protocol: data.protocol,
      status: 'pending',
      config: data.config as Record<string, unknown>,
      isActive: true,
      createdAt: now,
      createdBy: userId,
      updatedAt: now,
      updatedBy: userId,
    };

    const connectionsRef = collection(db, `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_CONNECTIONS}`);
    const docRef = doc(connectionsRef);
    await setDoc(docRef, connectionData);

    // Test connection
    await this.testConnection(tenantId, docRef.id);

    return docRef.id;
  }

  async updateConnection(
    tenantId: string,
    userId: string,
    connectionId: string,
    data: Partial<EMRConnectionFormData>
  ): Promise<void> {
    const connectionRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_CONNECTIONS}`,
      connectionId
    );

    await updateDoc(connectionRef, {
      ...data,
      updatedAt: serverTimestamp(),
      updatedBy: userId,
    });

    // Re-test connection if config changed
    if (data.config) {
      await this.testConnection(tenantId, connectionId);
    }
  }

  async deleteConnection(tenantId: string, connectionId: string): Promise<void> {
    const connectionRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_CONNECTIONS}`,
      connectionId
    );
    await deleteDoc(connectionRef);
  }

  async getConnection(tenantId: string, connectionId: string): Promise<EMRConnection | null> {
    const connectionRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_CONNECTIONS}`,
      connectionId
    );
    const snapshot = await getDoc(connectionRef);
    
    if (!snapshot.exists()) return null;
    
    return {
      id: snapshot.id,
      ...snapshot.data(),
    } as EMRConnection;
  }

  async getConnections(
    tenantId: string,
    filter?: EMRConnectionFilter
  ): Promise<EMRConnection[]> {
    const connectionsRef = collection(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_CONNECTIONS}`
    );
    
    let q = query(connectionsRef, orderBy('createdAt', 'desc'));

    if (filter?.systemType) {
      q = query(q, where('systemType', '==', filter.systemType));
    }
    if (filter?.protocol) {
      q = query(q, where('protocol', '==', filter.protocol));
    }
    if (filter?.status) {
      q = query(q, where('status', '==', filter.status));
    }
    if (filter?.isActive !== undefined) {
      q = query(q, where('isActive', '==', filter.isActive));
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    } as EMRConnection));
  }

  // Connection testing
  async testConnection(tenantId: string, connectionId: string): Promise<void> {
    const connection = await this.getConnection(tenantId, connectionId);
    if (!connection) throw new Error('Connection not found');

    let status: ConnectionStatus = 'error';
    let error: string | undefined;

    try {
      switch (connection.protocol) {
        case 'fhir': {
          const result = await fhirService.testConnection(connection);
          status = result.success ? 'connected' : 'error';
          if (!result.success) error = result.message;
          break;
        }

        case 'hl7v2': {
          // For HL7v2, we would test TCP connection
          // This is a placeholder - actual implementation would use a TCP client
          status = 'connected';
          break;
        }

        case 'api': {
          // Test API endpoint
          const response = await fetch(connection.config.apiBaseUrl || '', {
            method: 'GET',
            headers: this.getAPIHeaders(connection),
          });
          status = response.ok ? 'connected' : 'error';
          if (!response.ok) error = `HTTP ${response.status}: ${response.statusText}`;
          break;
        }

        case 'webhook': {
          // Webhooks are passive, so we just mark as connected
          status = 'connected';
          break;
        }

        default: {
          status = 'error';
          error = 'Unsupported protocol';
        }
      }
    } catch (err) {
      status = 'error';
      error = err instanceof Error ? err.message : 'Connection test failed';
    }

    // Update connection status
    await updateDoc(
      doc(db, `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_CONNECTIONS}`, connectionId),
      {
        status,
        lastError: error,
        lastErrorAt: error ? serverTimestamp() : null,
        updatedAt: serverTimestamp(),
      }
    );

    // Log the test
    await this.logIntegration(tenantId, connectionId, 'info', 'Connection test', {
      status,
      error,
    });
  }

  // Message processing
  async processMessage(tenantId: string, messageId: string): Promise<void> {
    const messageRef = doc(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_MESSAGES}`,
      messageId
    );
    const messageDoc = await getDoc(messageRef);
    
    if (!messageDoc.exists()) throw new Error('Message not found');
    
    const message = { id: messageDoc.id, ...messageDoc.data() } as EMRMessage;
    const connection = await this.getConnection(tenantId, message.connectionId);
    
    if (!connection) throw new Error('Connection not found');

    try {
      // Update message status to processing
      await updateDoc(messageRef, {
        status: 'processing',
        lastAttemptAt: serverTimestamp(),
        attempts: message.attempts + 1,
      });

      // Process based on protocol
      switch (connection.protocol) {
        case 'fhir': {
          await this.processFHIRMessage(connection, message, tenantId);
          break;
        }
        case 'hl7v2': {
          await this.processHL7Message(connection, message, tenantId);
          break;
        }
        case 'api': {
          await this.processAPIMessage(connection, message, tenantId);
          break;
        }
        default: {
          throw new Error(`Unsupported protocol: ${connection.protocol}`);
        }
      }

      // Update message status to completed
      await updateDoc(messageRef, {
        status: 'completed',
        completedAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Processing failed';
      
      // Update message with error
      await updateDoc(messageRef, {
        status: message.attempts >= (connection.config.retryAttempts || 3) ? 'failed' : 'retry',
        error: errorMessage,
        updatedAt: serverTimestamp(),
      });

      // Log error
      await this.logIntegration(tenantId, connection.id, 'error', 'Message processing failed', {
        messageId,
        error: errorMessage,
      });

      throw error;
    }
  }

  private async processFHIRMessage(
    connection: EMRConnection,
    message: EMRMessage,
    tenantId: string
  ): Promise<void> {
    // Implementation would process FHIR resources
    console.log('Processing FHIR message', message);
    console.log('Connection:', connection.id, 'Tenant:', tenantId);
  }

  private async processHL7Message(
    connection: EMRConnection,
    message: EMRMessage,
    tenantId: string
  ): Promise<void> {
    if (typeof message.content === 'string') {
      const parsed = hl7Parser.parseMessage(message.content);
      
      // Update message with parsed content
      await updateDoc(
        doc(db, `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_MESSAGES}`, message.id),
        { parsedContent: parsed }
      );
    }
  }

  private async processAPIMessage(
    connection: EMRConnection,
    message: EMRMessage,
    tenantId: string
  ): Promise<void> {
    // Implementation would process API messages
    console.log('Processing API message', message);
    console.log('Connection:', connection.id, 'Tenant:', tenantId);
  }

  // Helper methods
  private getAPIHeaders(connection: EMRConnection): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...connection.config.apiHeaders,
    };

    const auth = connection.config.apiAuth;
    if (auth) {
      switch (auth.type) {
        case 'apiKey': {
          if (auth.apiKeyHeader && auth.apiKey) {
            headers[auth.apiKeyHeader] = auth.apiKey;
          }
          break;
        }
        case 'basic': {
          if (auth.username && auth.password) {
            headers['Authorization'] = 'Basic ' + btoa(`${auth.username}:${auth.password}`);
          }
          break;
        }
        case 'bearer': {
          if (auth.token) {
            headers['Authorization'] = `Bearer ${auth.token}`;
          }
          break;
        }
      }
    }

    return headers;
  }

  // Logging
  async logIntegration(
    tenantId: string,
    connectionId: string,
    level: 'info' | 'warning' | 'error' | 'debug',
    event: string,
    details: unknown
  ): Promise<void> {
    const log: Omit<IntegrationLog, 'id'> = {
      tenantId,
      connectionId,
      level,
      event,
      details: JSON.stringify(details),
      metadata: details,
      timestamp: serverTimestamp() as Timestamp,
    };

    const logsRef = collection(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_INTEGRATION_LOGS}`
    );
    await setDoc(doc(logsRef), log);
  }

  // Get sync status
  async getSyncStatus(tenantId: string, connectionId: string): Promise<SyncStatus> {
    const connection = await this.getConnection(tenantId, connectionId);
    if (!connection) throw new Error('Connection not found');

    // Get message stats
    const messagesRef = collection(
      db,
      `${COLLECTIONS.TENANTS}/${tenantId}/${COLLECTIONS.EMR_MESSAGES}`
    );
    
    const pendingQuery = query(
      messagesRef,
      where('connectionId', '==', connectionId),
      where('status', 'in', ['pending', 'processing', 'retry'])
    );
    const pendingSnapshot = await getDocs(pendingQuery);

    const failedQuery = query(
      messagesRef,
      where('connectionId', '==', connectionId),
      where('status', '==', 'failed'),
      where('createdAt', '>=', new Date(Date.now() - 24 * 60 * 60 * 1000)) // Last 24 hours
    );
    const failedSnapshot = await getDocs(failedQuery);

    return {
      connectionId,
      lastSyncAt: connection.lastSyncAt,
      status: pendingSnapshot.size > 0 ? 'syncing' : 'idle',
      totalRecords: pendingSnapshot.size,
      processedRecords: 0,
      failedRecords: failedSnapshot.size,
    };
  }
}

export const emrConnectionService = new EMRConnectionService();