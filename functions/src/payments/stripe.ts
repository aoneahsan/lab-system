import * as functions from 'firebase-functions';
import Stripe from 'stripe';
import { db } from '../config/firebase';

const stripe = new Stripe(functions.config().stripe.secret_key, {
  apiVersion: '2023-10-16',
});

const PROJECT_PREFIX = 'labflow_';

// Create payment intent
export const createPaymentIntent = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { amount, currency, metadata } = data;

  try {
    // Create or get customer
    let customerId = await getOrCreateCustomer(context.auth.uid);

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: currency || 'usd',
      customer: customerId,
      metadata: {
        userId: context.auth.uid,
        ...metadata,
      },
    });

    // Save to database
    await db.collection(`${PROJECT_PREFIX}payments`).doc(paymentIntent.id).set({
      userId: context.auth.uid,
      amount,
      currency: currency || 'usd',
      status: 'pending',
      stripePaymentIntentId: paymentIntent.id,
      metadata,
      createdAt: new Date(),
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    };
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw new functions.https.HttpsError('internal', 'Failed to create payment');
  }
});

// Process refund
export const processRefund = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { paymentIntentId, amount, reason } = data;

  try {
    // Create refund
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: amount ? Math.round(amount * 100) : undefined,
      reason: reason || 'requested_by_customer',
    });

    // Update payment status
    await db.collection(`${PROJECT_PREFIX}payments`).doc(paymentIntentId).update({
      status: amount ? 'partially_refunded' : 'refunded',
      refundId: refund.id,
      refundAmount: amount || refund.amount / 100,
      refundedAt: new Date(),
    });

    return { refundId: refund.id, status: refund.status };
  } catch (error) {
    console.error('Error processing refund:', error);
    throw new functions.https.HttpsError('internal', 'Failed to process refund');
  }
});

// Webhook handler
export const handleStripeWebhook = functions.https.onRequest(async (req, res) => {
  const sig = req.headers['stripe-signature'] as string;
  const webhookSecret = functions.config().stripe.webhook_secret;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(req.rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err);
    res.status(400).send(`Webhook Error: ${err.message}`);
    return;
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
      break;
    case 'charge.dispute.created':
      await handleDispute(event.data.object as Stripe.Dispute);
      break;
  }

  res.status(200).json({ received: true });
});

// Helper functions
async function getOrCreateCustomer(userId: string): Promise<string> {
  const userDoc = await db.collection(`${PROJECT_PREFIX}users`).doc(userId).get();
  const userData = userDoc.data();

  if (userData?.stripeCustomerId) {
    return userData.stripeCustomerId;
  }

  // Create new customer
  const customer = await stripe.customers.create({
    metadata: { userId },
  });

  // Save customer ID
  await userDoc.ref.update({ stripeCustomerId: customer.id });

  return customer.id;
}

async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  await db.collection(`${PROJECT_PREFIX}payments`).doc(paymentIntent.id).update({
    status: 'succeeded',
    succeededAt: new Date(),
  });
}

async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  await db.collection(`${PROJECT_PREFIX}payments`).doc(paymentIntent.id).update({
    status: 'failed',
    failureMessage: paymentIntent.last_payment_error?.message,
    failedAt: new Date(),
  });
}

async function handleDispute(dispute: Stripe.Dispute) {
  await db.collection(`${PROJECT_PREFIX}disputes`).doc(dispute.id).set({
    paymentIntentId: dispute.payment_intent,
    amount: dispute.amount / 100,
    reason: dispute.reason,
    status: dispute.status,
    createdAt: new Date(),
  });
}