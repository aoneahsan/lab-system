import * as admin from 'firebase-admin';

export const sampleExpirationChecker = async () => {
  console.log('Checking for expiring samples...');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const expiringSamples = await admin.firestore()
    .collection('labflow_samples')
    .where('expirationDate', '<=', tomorrow)
    .where('status', 'in', ['collected', 'in_transit', 'received'])
    .get();
  
  console.log(`Found ${expiringSamples.size} expiring samples`);
  
  // Process and notify about expiring samples
  for (const doc of expiringSamples.docs) {
    const sample = doc.data();
    console.log(`Sample ${sample.sampleNumber} expires on ${sample.expirationDate.toDate()}`);
  }
};