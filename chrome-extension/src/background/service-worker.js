// LabFlow EMR Integration - Background Service Worker

// API Configuration
const LABFLOW_API_BASE = 'https://labsystem-a1.web.app/api';
const STORAGE_KEYS = {
  AUTH_TOKEN: 'labflow_auth_token',
  USER_INFO: 'labflow_user_info',
  EMR_MAPPINGS: 'emr_field_mappings',
  SYNC_QUEUE: 'sync_queue'
};

// Initialize extension on install
chrome.runtime.onInstalled.addListener(() => {
  console.log('LabFlow EMR Extension installed');
  
  // Create context menu items
  chrome.contextMenus.create({
    id: 'labflow-order-test',
    title: 'Order Lab Test with LabFlow',
    contexts: ['selection']
  });
  
  chrome.contextMenus.create({
    id: 'labflow-view-results',
    title: 'View Lab Results in LabFlow',
    contexts: ['selection']
  });
});

// Handle messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'authenticate':
      handleAuthentication(request.credentials)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'getPatientData':
      extractPatientData(request.emrType, request.data)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'orderTest':
      createLabOrder(request.orderData)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'syncResults':
      syncLabResults(request.patientId)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
      
    case 'pushToEMR':
      pushResultsToEMR(request.results, request.emrType)
        .then(sendResponse)
        .catch(error => sendResponse({ error: error.message }));
      return true;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'labflow-order-test') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showOrderDialog',
      selectedText: info.selectionText
    });
  } else if (info.menuItemId === 'labflow-view-results') {
    chrome.tabs.sendMessage(tab.id, {
      action: 'showResultsDialog',
      selectedText: info.selectionText
    });
  }
});

// Authentication handler
async function handleAuthentication(credentials) {
  const response = await fetch(`${LABFLOW_API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  
  if (!response.ok) {
    throw new Error('Authentication failed');
  }
  
  const data = await response.json();
  await chrome.storage.local.set({
    [STORAGE_KEYS.AUTH_TOKEN]: data.token,
    [STORAGE_KEYS.USER_INFO]: data.user
  });
  
  return { success: true, user: data.user };
}

// Extract patient data based on EMR type
async function extractPatientData(emrType, rawData) {
  const mappings = await getEMRMappings(emrType);
  const patientData = {};
  
  // Map EMR fields to LabFlow fields
  for (const [labflowField, emrField] of Object.entries(mappings)) {
    if (rawData[emrField]) {
      patientData[labflowField] = rawData[emrField];
    }
  }
  
  // Validate required fields
  const requiredFields = ['firstName', 'lastName', 'dateOfBirth', 'mrn'];
  const missingFields = requiredFields.filter(field => !patientData[field]);
  
  if (missingFields.length > 0) {
    throw new Error(`Missing required fields: ${missingFields.join(', ')}`);
  }
  
  return patientData;
}

// Get EMR field mappings
async function getEMRMappings(emrType) {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.EMR_MAPPINGS);
  const mappings = stored[STORAGE_KEYS.EMR_MAPPINGS] || {};
  
  // Default mappings for common EMRs
  const defaults = {
    epic: {
      firstName: 'patient.name.first',
      lastName: 'patient.name.last',
      dateOfBirth: 'patient.birthDate',
      mrn: 'patient.identifier.mrn',
      gender: 'patient.gender',
      phone: 'patient.telecom.phone',
      email: 'patient.telecom.email',
      address: 'patient.address'
    },
    cerner: {
      firstName: 'patient.given_name',
      lastName: 'patient.family_name',
      dateOfBirth: 'patient.dob',
      mrn: 'patient.medical_record_number',
      gender: 'patient.sex',
      phone: 'patient.phone_number',
      email: 'patient.email_address',
      address: 'patient.street_address'
    }
  };
  
  return mappings[emrType] || defaults[emrType] || {};
}

// Create lab order in LabFlow
async function createLabOrder(orderData) {
  const token = await getAuthToken();
  
  const response = await fetch(`${LABFLOW_API_BASE}/orders`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      ...orderData,
      source: 'emr_extension',
      timestamp: new Date().toISOString()
    })
  });
  
  if (!response.ok) {
    throw new Error('Failed to create lab order');
  }
  
  const order = await response.json();
  
  // Show notification
  chrome.notifications.create({
    type: 'basic',
    iconUrl: '/icons/icon-48.png',
    title: 'Lab Order Created',
    message: `Order #${order.id} created successfully`
  });
  
  return order;
}

// Sync lab results from LabFlow
async function syncLabResults(patientId) {
  const token = await getAuthToken();
  
  const response = await fetch(`${LABFLOW_API_BASE}/results?patientId=${patientId}&status=released`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  if (!response.ok) {
    throw new Error('Failed to fetch lab results');
  }
  
  const results = await response.json();
  
  // Store results for offline access
  await chrome.storage.local.set({
    [`results_${patientId}`]: {
      data: results,
      lastSync: new Date().toISOString()
    }
  });
  
  return results;
}

// Push results back to EMR
async function pushResultsToEMR(results, emrType) {
  // Queue for push if offline
  const queue = await getSyncQueue();
  queue.push({
    type: 'results_push',
    emrType,
    results,
    timestamp: new Date().toISOString()
  });
  
  await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_QUEUE]: queue });
  
  // Attempt immediate push
  try {
    const token = await getAuthToken();
    const response = await fetch(`${LABFLOW_API_BASE}/emr/push`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        emrType,
        results,
        mappings: await getEMRMappings(emrType)
      })
    });
    
    if (response.ok) {
      // Remove from queue on success
      const updatedQueue = queue.filter(item => 
        item.timestamp !== queue[queue.length - 1].timestamp
      );
      await chrome.storage.local.set({ [STORAGE_KEYS.SYNC_QUEUE]: updatedQueue });
      
      return { success: true };
    }
  } catch (error) {
    console.error('Failed to push results:', error);
  }
  
  return { success: false, queued: true };
}

// Helper functions
async function getAuthToken() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.AUTH_TOKEN);
  const token = stored[STORAGE_KEYS.AUTH_TOKEN];
  
  if (!token) {
    throw new Error('Not authenticated. Please log in to LabFlow.');
  }
  
  return token;
}

async function getSyncQueue() {
  const stored = await chrome.storage.local.get(STORAGE_KEYS.SYNC_QUEUE);
  return stored[STORAGE_KEYS.SYNC_QUEUE] || [];
}

// Process sync queue periodically
setInterval(async () => {
  const queue = await getSyncQueue();
  if (queue.length === 0) return;
  
  console.log(`Processing sync queue: ${queue.length} items`);
  
  for (const item of queue) {
    if (item.type === 'results_push') {
      await pushResultsToEMR(item.results, item.emrType);
    }
  }
}, 5 * 60 * 1000); // Every 5 minutes

// Listen for tab updates to inject scripts when needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is an EMR page
    const emrDomains = [
      'epic.com', 'cerner.com', 'allscripts.com', 
      'athenahealth.com', 'nextgen.com', 'eclinicalworks.com'
    ];
    
    const isEMRPage = emrDomains.some(domain => tab.url.includes(domain));
    
    if (isEMRPage) {
      // Inject LabFlow widget
      chrome.tabs.sendMessage(tabId, { action: 'initializeWidget' });
    }
  }
});