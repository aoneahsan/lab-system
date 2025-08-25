import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { startOfMonth, endOfMonth } from 'date-fns';

const db = admin.firestore();

export const createInvoice = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth || !['ADMIN', 'BILLING_STAFF'].includes((context.auth.token as any).role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { patientId, items, insuranceClaimId } = data;

  try {
    // Get patient details
    const patientDoc = await db.collection('labflow_patients').doc(patientId).get();
    const patient = patientDoc.data();

    if (!patient) {
      throw new functions.https.HttpsError('not-found', 'Patient not found');
    }

    // Calculate total
    const subtotal = items.reduce((acc: number, item: any) => acc + (item.quantity * item.price), 0);
    const tax = subtotal * 0.1; // 10% tax
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = `INV-${Date.now()}`;

    // Create invoice
    const invoice = {
      invoiceNumber,
      patientId,
      patientName: patient.name,
      patientEmail: patient.email,
      items,
      subtotal,
      tax,
      total,
      status: 'pending',
      insuranceClaimId,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      createdBy: context.auth.uid,
    };

    const docRef = await db.collection('labflow_invoices').add(invoice);

    // If insurance claim exists, update it
    if (insuranceClaimId) {
      await db.collection('labflow_insurance_claims').doc(insuranceClaimId).update({
        invoiceId: docRef.id,
        invoiceNumber,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    }

    return { 
      success: true, 
      invoiceId: docRef.id,
      invoiceNumber,
      total
    };
  } catch (error) {
    console.error('Error creating invoice:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create invoice');
  }
});

export const processPayment = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth || !['ADMIN', 'BILLING_STAFF'].includes((context.auth.token as any).role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { invoiceId, paymentMethod, amount, transactionId } = data;

  try {
    // Get invoice
    const invoiceDoc = await db.collection('labflow_invoices').doc(invoiceId).get();
    const invoice = invoiceDoc.data();

    if (!invoice) {
      throw new functions.https.HttpsError('not-found', 'Invoice not found');
    }

    // Create payment record
    const payment = {
      invoiceId,
      invoiceNumber: invoice.invoiceNumber,
      amount,
      paymentMethod,
      transactionId,
      status: 'completed',
      processedAt: admin.firestore.FieldValue.serverTimestamp(),
      processedBy: context.auth.uid,
    };

    await db.collection('labflow_payments').add(payment);

    // Update invoice status
    const paidAmount = invoice.paidAmount || 0;
    const newPaidAmount = paidAmount + amount;
    const status = newPaidAmount >= invoice.total ? 'paid' : 'partial';

    await db.collection('labflow_invoices').doc(invoiceId).update({
      paidAmount: newPaidAmount,
      status,
      lastPaymentAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { 
      success: true,
      remainingBalance: invoice.total - newPaidAmount
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process payment');
  }
});

export const submitInsuranceClaim = functions.https.onCall(async (data: any, context: functions.https.CallableContext) => {
  if (!context.auth || !['ADMIN', 'BILLING_STAFF'].includes((context.auth.token as any).role)) {
    throw new functions.https.HttpsError('permission-denied', 'Unauthorized');
  }

  const { patientId, insuranceProvider, policyNumber, services, diagnosis } = data;

  try {
    // Generate claim number
    const claimNumber = `CLM-${Date.now()}`;

    // Calculate claim amount
    const totalAmount = services.reduce((acc: number, service: any) => acc + service.amount, 0);

    // Create insurance claim
    const claim = {
      claimNumber,
      patientId,
      insuranceProvider,
      policyNumber,
      services,
      diagnosis,
      totalAmount,
      status: 'submitted',
      submittedAt: admin.firestore.FieldValue.serverTimestamp(),
      submittedBy: context.auth.uid,
    };

    const docRef = await db.collection('labflow_insurance_claims').add(claim);

    return { 
      success: true,
      claimId: docRef.id,
      claimNumber
    };
  } catch (error) {
    console.error('Error submitting insurance claim:', error);
    throw new functions.https.HttpsError('internal', 'Failed to submit insurance claim');
  }
});

// Monthly billing report generation
export const generateMonthlyBillingReport = functions.pubsub
  .schedule('0 0 1 * *') // Run at midnight on the first day of each month
  .timeZone('America/New_York')
  .onRun(async (context) => {
    const previousMonth = new Date();
    previousMonth.setMonth(previousMonth.getMonth() - 1);
    
    const startDate = startOfMonth(previousMonth);
    const endDate = endOfMonth(previousMonth);

    try {
      // Get all invoices for the previous month
      const invoicesSnapshot = await db.collection('labflow_invoices')
        .where('createdAt', '>=', startDate)
        .where('createdAt', '<=', endDate)
        .get();

      const invoices = invoicesSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const totalRevenue = invoices.reduce((acc, inv) => acc + (inv.paidAmount || 0), 0);
      const totalOutstanding = invoices.reduce((acc, inv) => acc + (inv.total - (inv.paidAmount || 0)), 0);
      const totalInvoices = invoices.length;
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;

      // Create report
      const report = {
        month: previousMonth.toISOString().substring(0, 7),
        totalRevenue,
        totalOutstanding,
        totalInvoices,
        paidInvoices,
        unpaidInvoices: totalInvoices - paidInvoices,
        generatedAt: admin.firestore.FieldValue.serverTimestamp(),
      };

      await db.collection('labflow_billing_reports').add(report);

      console.log('Monthly billing report generated successfully');
    } catch (error) {
      console.error('Error generating monthly billing report:', error);
    }
  });