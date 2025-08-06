import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { startOfMonth, endOfMonth } from 'date-fns';

const db = admin.firestore();

export const createInvoice = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth || !['ADMIN', 'BILLING_STAFF'].includes(request.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { patientId, items, insuranceClaimId } = request.data;

  try {
    // Get patient details
    const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
    const patient = patientDoc.data();

    if (!patient) {
      throw new functions.https.HttpsError('not-found', 'Patient not found');
    }

    // Calculate totals
    let subtotal = 0;
    const processedItems = items.map((item: any) => {
      const itemTotal = item.quantity * item.unitPrice;
      subtotal += itemTotal;
      return {
        ...item,
        total: itemTotal,
      };
    });

    // Apply insurance if applicable
    let insuranceAmount = 0;
    let patientResponsibility = subtotal;

    if (insuranceClaimId) {
      const claimDoc = await db.collection('labflow_insurance_claims').doc(insuranceClaimId).get();
      const claim = claimDoc.data();
      
      if (claim && claim.status === 'approved') {
        insuranceAmount = claim.approvedAmount || 0;
        patientResponsibility = subtotal - insuranceAmount;
      }
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber(patient.tenantId);

    // Create invoice
    const invoiceRef = await db.collection('labflow_invoices').add({
      invoiceNumber,
      patientId,
      patientName: patient.displayName,
      patientMRN: patient.mrn,
      items: processedItems,
      subtotal,
      insuranceAmount,
      patientResponsibility,
      totalDue: patientResponsibility,
      status: 'pending',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      insuranceClaimId,
      tenantId: patient.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: request.auth.uid,
    });

    return { 
      success: true, 
      invoiceId: invoiceRef.id,
      invoiceNumber,
      totalDue: patientResponsibility,
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create invoice');
  }
});

export const processPayment = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { invoiceId, amount, paymentMethod, referenceNumber } = request.data;

  try {
    // Get invoice
    const invoiceDoc = await db.collection('labflow_invoices').doc(invoiceId).get();
    const invoice = invoiceDoc.data();

    if (!invoice) {
      throw new functions.https.HttpsError('not-found', 'Invoice not found');
    }

    // Verify payment amount
    if (amount > invoice.totalDue) {
      throw new functions.https.HttpsError('invalid-argument', 'Payment amount exceeds total due');
    }

    // Create payment record
    const paymentRef = await db.collection('labflow_payments').add({
      invoiceId,
      amount,
      paymentMethod,
      referenceNumber,
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: request.auth.uid,
      tenantId: invoice.tenantId,
    });

    // Update invoice
    const newBalance = invoice.totalDue - amount;
    await db.collection('labflow_invoices').doc(invoiceId).update({
      totalDue: newBalance,
      status: newBalance === 0 ? 'paid' : 'partial',
      lastPaymentDate: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // Add to transaction log
    await db.collection('labflow_transactions').add({
      type: 'payment',
      invoiceId,
      paymentId: paymentRef.id,
      amount,
      balance: newBalance,
      tenantId: invoice.tenantId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true, 
      paymentId: paymentRef.id,
      remainingBalance: newBalance,
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process payment');
  }
});

export const submitInsuranceClaim = functions.https.onCall(async (request: functions.https.CallableRequest<any>) => {
  if (!request.auth || !['ADMIN', 'BILLING_STAFF'].includes(request.auth.token.role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { patientId, services, diagnosisCodes, authorizationNumber } = request.data;

  try {
    // Get patient and insurance details
    const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
    const patient = patientDoc.data();

    if (!patient || !patient.insuranceInfo) {
      throw new functions.https.HttpsError('not-found', 'Patient or insurance information not found');
    }

    // Calculate claim amount
    const claimAmount = services.reduce((total: number, service: any) => {
      return total + (service.quantity * service.unitPrice);
    }, 0);

    // Create claim
    const claimRef = await db.collection('labflow_insurance_claims').add({
      patientId,
      patientName: patient.displayName,
      patientMRN: patient.mrn,
      insuranceProvider: patient.insuranceInfo.provider,
      policyNumber: patient.insuranceInfo.policyNumber,
      groupNumber: patient.insuranceInfo.groupNumber,
      services,
      diagnosisCodes,
      authorizationNumber,
      claimAmount,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: request.auth.uid,
      tenantId: patient.tenantId,
    });

    // Simulate claim submission to insurance provider
    // In real implementation, this would integrate with insurance APIs
    await simulateClaimSubmission(claimRef.id);

    return { 
      success: true, 
      claimId: claimRef.id,
      claimAmount,
    };
  } catch (error) {
    console.error('Error submitting insurance claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit claim');
  }
});

// This scheduled function is now exported from index.ts using onSchedule
export const reconcilePaymentsHandler = async () => {
    console.log('Running payment reconciliation');

    try {
      // Get all pending payments from yesterday
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const paymentsQuery = await db.collection('labflow_payments')
        .where('status', '==', 'pending')
        .where('processedAt', '>=', yesterday)
        .where('processedAt', '<', today)
        .get();

      const reconciledPayments: any[] = [];
      const failedPayments: any[] = [];

      // Process each payment
      for (const doc of paymentsQuery.docs) {
        const payment = doc.data();
        
        try {
          // Verify payment with payment processor
          const verified = await verifyPaymentWithProcessor(payment);
          
          if (verified) {
            await doc.ref.update({
              status: 'reconciled',
              reconciledAt: admin.firestore.FieldValue.serverTimestamp(),
            });
            reconciledPayments.push({ id: doc.id, ...payment });
          } else {
            await doc.ref.update({
              status: 'failed',
              failureReason: 'Reconciliation failed',
            });
            failedPayments.push({ id: doc.id, ...payment });
          }
        } catch (error) {
          console.error('Error reconciling payment:', doc.id, error);
          failedPayments.push({ id: doc.id, ...payment });
        }
      }

      // Create reconciliation report
      await db.collection('labflow_reconciliation_reports').add({
        date: yesterday,
        totalPayments: paymentsQuery.size,
        reconciledCount: reconciledPayments.length,
        failedCount: failedPayments.length,
        reconciledAmount: reconciledPayments.reduce((sum, p) => sum + p.amount, 0),
        failedAmount: failedPayments.reduce((sum, p) => sum + p.amount, 0),
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      console.log(`Reconciliation complete: ${reconciledPayments.length} reconciled, ${failedPayments.length} failed`);
    } catch (error) {
      console.error('Error in payment reconciliation:', error);
    }

    return null;
  });

async function generateInvoiceNumber(tenantId: string): Promise<string> {
  // Get tenant's invoice counter
  const counterRef = db.collection('labflow_counters').doc(`${tenantId}_invoice`);
  
  const newNumber = await db.runTransaction(async (transaction) => {
    const counterDoc = await transaction.get(counterRef);
    
    let currentNumber = 1;
    if (counterDoc.exists) {
      currentNumber = (counterDoc.data()?.current || 0) + 1;
    }
    
    transaction.set(counterRef, { current: currentNumber }, { merge: true });
    
    return currentNumber;
  });

  // Format: INV-YYYY-MM-00001
  const date = new Date();
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const number = newNumber.toString().padStart(5, '0');
  
  return `INV-${year}-${month}-${number}`;
}

async function simulateClaimSubmission(claimId: string): Promise<void> {
  // Simulate async claim processing
  setTimeout(async () => {
    try {
      // Random approval simulation (80% approval rate)
      const approved = Math.random() > 0.2;
      const status = approved ? 'approved' : 'denied';
      const approvedAmount = approved ? Math.random() * 0.8 + 0.2 : 0; // 20-100% coverage

      await db.collection('labflow_insurance_claims').doc(claimId).update({
        status,
        processedAt: admin.firestore.FieldValue.serverTimestamp(),
        approvedAmount: approved ? approvedAmount : 0,
        denialReason: approved ? null : 'Service not covered',
      });
    } catch (error) {
      console.error('Error processing claim:', error);
    }
  }, 5000); // 5 second delay
}

async function verifyPaymentWithProcessor(payment: any): Promise<boolean> {
  // In real implementation, this would call payment processor API
  // For now, simulate verification
  return Math.random() > 0.05; // 95% success rate
}