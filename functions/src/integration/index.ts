import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { parseHL7Message, createHL7Message } from '../utils/hl7Parser';
import { convertToFHIR, parseFHIR } from '../utils/fhirConverter';

const db = admin.firestore();

export const receiveHL7Message = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).send('Method Not Allowed');
    return;
  }

  const { body, headers } = req;
  const apiKey = headers['x-api-key'];

  try {
    // Validate API key
    const integration = await validateAPIKey(apiKey as string);
    if (!integration) {
      res.status(401).send('Unauthorized');
      return;
    }

    // Parse HL7 message
    const parsedMessage = parseHL7Message(body);
    const messageType = parsedMessage.header.messageType;

    // Process based on message type
    switch (messageType) {
      case 'ORM': // Order message
        await processOrderMessage(parsedMessage, integration.tenantId);
        break;
      case 'ADT': // Admit/Discharge/Transfer
        await processADTMessage(parsedMessage, integration.tenantId);
        break;
      case 'QRY': // Query
        const response = await processQueryMessage(parsedMessage, integration.tenantId);
        res.status(200).send(createHL7Message('RSP', response));
        return;
      default:
        res.status(400).send('Unsupported message type');
        return;
    }

    // Send ACK
    const ack = createHL7Message('ACK', {
      messageId: parsedMessage.header.messageId,
      status: 'AA', // Application Accept
    });

    res.status(200).send(ack);
  } catch (error) {
    console.error('Error processing HL7 message:', error);
    
    // Send NACK
    const nack = createHL7Message('ACK', {
      messageId: body.messageId || 'UNKNOWN',
      status: 'AE', // Application Error
      errorMessage: 'Failed to process message',
    });
    
    res.status(500).send(nack);
  }
});

export const receiveFHIRResource = functions.https.onRequest(async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { body, headers } = req;
  const apiKey = headers['x-api-key'];

  try {
    // Validate API key
    const integration = await validateAPIKey(apiKey as string);
    if (!integration) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    // Parse FHIR resource
    const resource = parseFHIR(body);
    const resourceType = resource.resourceType;

    // Process based on resource type
    switch (resourceType) {
      case 'ServiceRequest':
        await processFHIRServiceRequest(resource, integration.tenantId);
        break;
      case 'Patient':
        await processFHIRPatient(resource, integration.tenantId);
        break;
      case 'DiagnosticReport':
        await processFHIRDiagnosticReport(resource, integration.tenantId);
        break;
      default:
        res.status(400).json({ error: 'Unsupported resource type' });
        return;
    }

    res.status(201).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'information',
        code: 'informational',
        details: { text: 'Resource processed successfully' },
      }],
    });
  } catch (error) {
    console.error('Error processing FHIR resource:', error);
    res.status(500).json({
      resourceType: 'OperationOutcome',
      issue: [{
        severity: 'error',
        code: 'processing',
        details: { text: 'Failed to process resource' },
      }],
    });
  }
});

export const sendResultToEMR = functions.firestore
  .document('labflow_results/{resultId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    // Check if result was just completed
    if (before.status !== 'completed' && after.status === 'completed') {
      const { resultId } = context.params;

      try {
        // Get integration settings
        const integrations = await db.collection('labflow_integrations')
          .where('tenantId', '==', after.tenantId)
          .where('active', '==', true)
          .where('type', 'in', ['HL7', 'FHIR'])
          .get();

        // Send to each integration endpoint
        for (const doc of integrations.docs) {
          const integration = doc.data();
          
          try {
            if (integration.type === 'HL7') {
              await sendHL7Result(resultId, after, integration);
            } else if (integration.type === 'FHIR') {
              await sendFHIRResult(resultId, after, integration);
            }
          } catch (error) {
            console.error(`Failed to send result to ${integration.name}:`, error);
            
            // Log failed transmission
            await db.collection('labflow_integration_logs').add({
              integrationId: doc.id,
              type: 'result_transmission',
              status: 'failed',
              resultId,
              error: error.message,
              timestamp: admin.firestore.FieldValue.serverTimestamp(),
            });
          }
        }
      } catch (error) {
        console.error('Error sending result to EMR:', error);
      }
    }
  });

export const syncPatientData = functions.https.onCall(async (data, context) => {
  if (!context.auth || !['ADMIN', 'INTEGRATION_MANAGER'].includes(context.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { integrationId, startDate, endDate } = data;

  try {
    // Get integration details
    const integrationDoc = await db.collection('labflow_integrations').doc(integrationId).get();
    const integration = integrationDoc.data();

    if (!integration) {
      throw new functions.https.HttpsError('not-found', 'Integration not found');
    }

    // Get patients to sync
    const patientsQuery = await db.collection('labflow_patients')
      .where('tenantId', '==', integration.tenantId)
      .where('lastModified', '>=', new Date(startDate))
      .where('lastModified', '<=', new Date(endDate))
      .get();

    let syncedCount = 0;
    let errorCount = 0;

    // Sync each patient
    for (const doc of patientsQuery.docs) {
      try {
        const patient = { id: doc.id, ...doc.data() };
        
        if (integration.type === 'HL7') {
          await syncPatientHL7(patient, integration);
        } else if (integration.type === 'FHIR') {
          await syncPatientFHIR(patient, integration);
        }
        
        syncedCount++;
      } catch (error) {
        console.error(`Failed to sync patient ${doc.id}:`, error);
        errorCount++;
      }
    }

    // Log sync operation
    await db.collection('labflow_sync_logs').add({
      integrationId,
      type: 'patient_sync',
      totalRecords: patientsQuery.size,
      syncedCount,
      errorCount,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      performedBy: context.auth.uid,
      timestamp: admin.firestore.FieldValue.serverTimestamp(),
    });

    return {
      success: true,
      totalRecords: patientsQuery.size,
      syncedCount,
      errorCount,
    };
  } catch (error) {
    console.error('Error syncing patient data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync data');
  }
});

async function validateAPIKey(apiKey: string): Promise<any> {
  if (!apiKey) return null;

  const integrationQuery = await db.collection('labflow_integrations')
    .where('apiKey', '==', apiKey)
    .where('active', '==', true)
    .limit(1)
    .get();

  if (integrationQuery.empty) return null;

  return integrationQuery.docs[0].data();
}

async function processOrderMessage(message: any, tenantId: string): Promise<void> {
  // Extract order details from HL7 message
  const order = {
    externalId: message.order.placerOrderNumber,
    patientId: message.patient.id,
    clinicianId: message.order.orderingProvider,
    tests: message.order.tests,
    priority: message.order.priority,
    clinicalInfo: message.order.clinicalInfo,
  };

  // Create order in system
  await db.collection('labflow_orders').add({
    ...order,
    source: 'HL7',
    status: 'pending',
    tenantId,
    receivedAt: admin.firestore.FieldValue.serverTimestamp(),
  });
}

async function processADTMessage(message: any, tenantId: string): Promise<void> {
  // Update patient information based on ADT message
  const patientData = {
    externalId: message.patient.id,
    mrn: message.patient.mrn,
    firstName: message.patient.firstName,
    lastName: message.patient.lastName,
    dateOfBirth: message.patient.dateOfBirth,
    gender: message.patient.gender,
    lastUpdated: admin.firestore.FieldValue.serverTimestamp(),
  };

  // Upsert patient
  const patientQuery = await db.collection('labflow_patients')
    .where('externalId', '==', patientData.externalId)
    .where('tenantId', '==', tenantId)
    .limit(1)
    .get();

  if (patientQuery.empty) {
    await db.collection('labflow_patients').add({
      ...patientData,
      tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await patientQuery.docs[0].ref.update(patientData);
  }
}

async function processQueryMessage(message: any, tenantId: string): Promise<any> {
  // Process query and return results
  const queryType = message.query.type;
  const parameters = message.query.parameters;

  switch (queryType) {
    case 'RESULT_STATUS':
      return await queryResultStatus(parameters.orderId, tenantId);
    case 'PATIENT_RESULTS':
      return await queryPatientResults(parameters.patientId, parameters.dateRange, tenantId);
    default:
      throw new Error('Unsupported query type');
  }
}

async function sendHL7Result(resultId: string, result: any, integration: any): Promise<void> {
  // Convert result to HL7 format
  const hl7Message = createHL7Message('ORU', {
    result,
    timestamp: new Date(),
    sendingApplication: 'LABFLOW',
    receivingApplication: integration.receivingApplication,
  });

  // Send to integration endpoint
  const response = await fetch(integration.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'x-api-key': integration.outboundApiKey,
    },
    body: hl7Message,
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

async function sendFHIRResult(resultId: string, result: any, integration: any): Promise<void> {
  // Convert result to FHIR DiagnosticReport
  const diagnosticReport = convertToFHIR('DiagnosticReport', result);

  // Send to integration endpoint
  const response = await fetch(integration.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${integration.outboundApiKey}`,
    },
    body: JSON.stringify(diagnosticReport),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
}

async function syncPatientHL7(patient: any, integration: any): Promise<void> {
  const hl7Message = createHL7Message('ADT', {
    eventType: 'A08', // Update patient information
    patient,
    timestamp: new Date(),
  });

  await fetch(integration.endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'text/plain',
      'x-api-key': integration.outboundApiKey,
    },
    body: hl7Message,
  });
}

async function syncPatientFHIR(patient: any, integration: any): Promise<void> {
  const fhirPatient = convertToFHIR('Patient', patient);

  await fetch(`${integration.endpoint}/Patient/${patient.externalId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/fhir+json',
      'Authorization': `Bearer ${integration.outboundApiKey}`,
    },
    body: JSON.stringify(fhirPatient),
  });
}