// Background service worker for LabFlow EMR Integration

// API Configuration
const LABFLOW_API_URL = 'http://localhost:5173'; // Change to production URL
const API_KEY = ''; // Will be set by user

// Extension state
let connectionStatus = 'disconnected';
let activeEMRSystem = null;
let patientContext = null;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('LabFlow EMR Integration installed');
  
  // Set up context menu
  chrome.contextMenus.create({
    id: 'labflow-send-patient',
    title: 'Send Patient to LabFlow',
    contexts: ['page', 'selection']
  });
  
  chrome.contextMenus.create({
    id: 'labflow-send-order',
    title: 'Send Lab Order to LabFlow',
    contexts: ['page', 'selection']
  });
});

// Handle messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'detectEMR':
      handleEMRDetection(request.data, sender, sendResponse);
      return true;
      
    case 'extractPatient':
      handlePatientExtraction(request.data, sender, sendResponse);
      return true;
      
    case 'extractOrder':
      handleOrderExtraction(request.data, sender, sendResponse);
      return true;
      
    case 'sendToLabFlow':
      handleSendToLabFlow(request.data, sender, sendResponse);
      return true;
      
    case 'updateStatus':
      connectionStatus = request.status;
      broadcastStatus();
      break;
      
    case 'getStatus':
      sendResponse({
        connectionStatus,
        activeEMRSystem,
        patientContext
      });
      break;
  }
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  switch (info.menuItemId) {
    case 'labflow-send-patient':
      chrome.tabs.sendMessage(tab.id, { action: 'extractPatientFromSelection' });
      break;
      
    case 'labflow-send-order':
      chrome.tabs.sendMessage(tab.id, { action: 'extractOrderFromSelection' });
      break;
  }
});

// EMR Detection
async function handleEMRDetection(data, sender, sendResponse) {
  const { url, title, content } = data;
  
  // Detect EMR system based on URL patterns
  const emrPatterns = {
    epic: /epic\.com|mychart/i,
    cerner: /cerner\.com|powerchart/i,
    allscripts: /allscripts\.com/i,
    athenahealth: /athenahealth\.com|athenanet/i,
    nextgen: /nextgen\.com/i,
    eclinicalworks: /eclinicalworks\.com/i,
    practicefusion: /practicefusion\.com/i
  };
  
  for (const [system, pattern] of Object.entries(emrPatterns)) {
    if (pattern.test(url) || pattern.test(title)) {
      activeEMRSystem = system;
      sendResponse({ detected: true, system });
      return;
    }
  }
  
  sendResponse({ detected: false });
}

// Patient extraction
async function handlePatientExtraction(data, sender, sendResponse) {
  try {
    // Parse patient data based on EMR system
    const patient = parsePatientData(data, activeEMRSystem);
    
    if (patient) {
      patientContext = patient;
      sendResponse({ success: true, patient });
    } else {
      sendResponse({ success: false, error: 'Could not extract patient data' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Order extraction
async function handleOrderExtraction(data, sender, sendResponse) {
  try {
    // Parse order data based on EMR system
    const order = parseOrderData(data, activeEMRSystem);
    
    if (order) {
      sendResponse({ success: true, order });
    } else {
      sendResponse({ success: false, error: 'Could not extract order data' });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Send data to LabFlow
async function handleSendToLabFlow(data, sender, sendResponse) {
  try {
    const { type, payload } = data;
    const apiKey = await getStoredApiKey();
    
    if (!apiKey) {
      sendResponse({ success: false, error: 'API key not configured' });
      return;
    }
    
    const response = await fetch(`${LABFLOW_API_URL}/api/emr-integration/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
        'X-EMR-System': activeEMRSystem || 'unknown'
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      sendResponse({ success: true, result });
    } else {
      const error = await response.text();
      sendResponse({ success: false, error });
    }
  } catch (error) {
    sendResponse({ success: false, error: error.message });
  }
}

// Parse patient data based on EMR system
function parsePatientData(data, emrSystem) {
  // This would contain EMR-specific parsing logic
  // For now, return a generic structure
  return {
    mrn: data.mrn || extractMRN(data.content),
    firstName: data.firstName || extractFirstName(data.content),
    lastName: data.lastName || extractLastName(data.content),
    dateOfBirth: data.dateOfBirth || extractDOB(data.content),
    gender: data.gender || extractGender(data.content),
    phone: data.phone || extractPhone(data.content),
    email: data.email || extractEmail(data.content),
    address: data.address || extractAddress(data.content)
  };
}

// Parse order data based on EMR system
function parseOrderData(data, emrSystem) {
  // This would contain EMR-specific parsing logic
  return {
    orderNumber: data.orderNumber || extractOrderNumber(data.content),
    patientMRN: data.patientMRN || patientContext?.mrn,
    tests: data.tests || extractTests(data.content),
    priority: data.priority || 'routine',
    orderingProvider: data.orderingProvider || extractProvider(data.content),
    diagnosis: data.diagnosis || extractDiagnosis(data.content),
    notes: data.notes || ''
  };
}

// Helper extraction functions
function extractMRN(content) {
  const mrnMatch = content.match(/MRN[:\s]+([A-Z0-9]+)/i);
  return mrnMatch ? mrnMatch[1] : null;
}

function extractFirstName(content) {
  // Basic extraction - would be more sophisticated in production
  const nameMatch = content.match(/First Name[:\s]+([A-Za-z]+)/i);
  return nameMatch ? nameMatch[1] : null;
}

function extractLastName(content) {
  const nameMatch = content.match(/Last Name[:\s]+([A-Za-z]+)/i);
  return nameMatch ? nameMatch[1] : null;
}

function extractDOB(content) {
  const dobMatch = content.match(/DOB[:\s]+(\d{1,2}\/\d{1,2}\/\d{4})/i);
  return dobMatch ? dobMatch[1] : null;
}

function extractGender(content) {
  const genderMatch = content.match(/Gender[:\s]+(Male|Female|M|F)/i);
  if (genderMatch) {
    const gender = genderMatch[1].toUpperCase();
    return gender === 'M' ? 'Male' : gender === 'F' ? 'Female' : gender;
  }
  return null;
}

function extractPhone(content) {
  const phoneMatch = content.match(/Phone[:\s]+\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/i);
  return phoneMatch ? phoneMatch[0].replace(/Phone[:\s]+/i, '') : null;
}

function extractEmail(content) {
  const emailMatch = content.match(/Email[:\s]+([^\s]+@[^\s]+\.[^\s]+)/i);
  return emailMatch ? emailMatch[1] : null;
}

function extractAddress(content) {
  // Basic extraction - would need EMR-specific parsing
  return null;
}

function extractOrderNumber(content) {
  const orderMatch = content.match(/Order[#\s]+([A-Z0-9-]+)/i);
  return orderMatch ? orderMatch[1] : null;
}

function extractTests(content) {
  // Would parse test codes and names
  const tests = [];
  const testMatches = content.match(/Test[:\s]+([^\n]+)/gi);
  if (testMatches) {
    testMatches.forEach(match => {
      tests.push({
        code: '',
        name: match.replace(/Test[:\s]+/i, '')
      });
    });
  }
  return tests;
}

function extractProvider(content) {
  const providerMatch = content.match(/Provider[:\s]+Dr\.?\s*([^\n]+)/i);
  return providerMatch ? providerMatch[1].trim() : null;
}

function extractDiagnosis(content) {
  const diagnosisMatch = content.match(/Diagnosis[:\s]+([^\n]+)/i);
  return diagnosisMatch ? diagnosisMatch[1].trim() : null;
}

// Storage helpers
async function getStoredApiKey() {
  const result = await chrome.storage.local.get(['apiKey']);
  return result.apiKey;
}

// Broadcast status to all tabs
function broadcastStatus() {
  chrome.tabs.query({}, (tabs) => {
    tabs.forEach(tab => {
      chrome.tabs.sendMessage(tab.id, {
        action: 'statusUpdate',
        status: {
          connectionStatus,
          activeEMRSystem,
          patientContext
        }
      }).catch(() => {
        // Tab might not have content script
      });
    });
  });
}