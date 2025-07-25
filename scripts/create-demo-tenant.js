// Simple script to create DEMO tenant
// Run this in Firebase Console > Firestore > Create Document

const demoTenant = {
  id: "demo",
  code: "DEMO",
  name: "Demo Laboratory",
  type: "demo",
  address: {
    street: "123 Demo Street",
    city: "Demo City",
    state: "DC",
    zipCode: "12345",
    country: "USA"
  },
  contact: {
    email: "demo@labflow.com",
    phone: "(555) 123-4567",
    fax: "(555) 123-4568"
  },
  settings: {
    timezone: "America/New_York",
    currency: "USD",
    resultFormat: "standard",
    criticalValueNotification: true
  },
  features: {
    billing: true,
    inventory: true,
    qualityControl: true,
    emrIntegration: true,
    mobileApps: true
  },
  subscription: {
    plan: "demo",
    status: "active",
    validUntil: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
  },
  createdAt: new Date(),
  updatedAt: new Date()
};

console.log("Create a document in the 'tenants' collection with ID 'demo' and this data:");
console.log(JSON.stringify(demoTenant, null, 2));