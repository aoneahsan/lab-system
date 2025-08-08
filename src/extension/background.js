// LabFlow Chrome Extension Background Service Worker

// API Configuration
const LABFLOW_API_URL = 'https://api.labflow.com';
// const LOCAL_API_URL = 'http://localhost:3000/api'; // Commented out - not currently used

// State management
let authToken = null;
let currentUser = null;
let isConnected = false;

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('LabFlow EMR Integration installed');
  
  // Set default settings
  chrome.storage.sync.set({
    apiUrl: LABFLOW_API_URL,
    autoImport: true,
    notificationsEnabled: true,
    hl7Format: 'v2.5.1'
  });
});

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'authenticate':
      handleAuthentication(request.credentials)
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep channel open for async response

    case 'createOrder':
      createLabOrder(request.orderData)
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'importResults':
      importLabResults(request.patientId)
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'getPatientData':
      extractPatientData(sender.tab.id)
        .then(sendResponse)
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;

    case 'checkConnection':
      sendResponse({ isConnected, currentUser });
      break;

    case 'logout':
      handleLogout();
      sendResponse({ success: true });
      break;

    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Authentication handler
async function handleAuthentication(credentials) {
  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials)
    });

    if (!response.ok) {
      throw new Error('Authentication failed');
    }

    const data = await response.json();
    authToken = data.token;
    currentUser = data.user;
    isConnected = true;

    // Store auth data
    await chrome.storage.local.set({ 
      authToken, 
      currentUser,
      lastLogin: new Date().toISOString()
    });

    return { success: true, user: currentUser };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Create lab order
async function createLabOrder(orderData) {
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({
        ...orderData,
        source: 'chrome-extension',
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error('Failed to create order');
    }

    const order = await response.json();
    
    // Show notification
    const settings = await chrome.storage.sync.get('notificationsEnabled');
    if (settings.notificationsEnabled) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon-128.png',
        title: 'Lab Order Created',
        message: `Order ${order.id} created for ${orderData.patientName}`
      });
    }

    return { success: true, order };
  } catch (error) {
    console.error('Create order error:', error);
    throw error;
  }
}

// Import lab results
async function importLabResults(patientId) {
  if (!authToken) {
    throw new Error('Not authenticated');
  }

  try {
    const apiUrl = await getApiUrl();
    const response = await fetch(`${apiUrl}/results/patient/${patientId}`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });

    if (!response.ok) {
      throw new Error('Failed to fetch results');
    }

    const results = await response.json();
    
    // Inject results into current page
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: injectLabResults,
      args: [results]
    });

    return { success: true, count: results.length };
  } catch (error) {
    console.error('Import results error:', error);
    throw error;
  }
}

// Extract patient data from EMR page
async function extractPatientData(tabId) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId },
      func: () => {
        // This function runs in the context of the web page
        // Extract patient data based on common EMR patterns
        const extractors = {
          // Epic
          epic: () => {
            const name = document.querySelector('.patient-name')?.textContent;
            const mrn = document.querySelector('.patient-mrn')?.textContent;
            const dob = document.querySelector('.patient-dob')?.textContent;
            return { name, mrn, dob };
          },
          
          // Cerner
          cerner: () => {
            const name = document.querySelector('[data-patient-name]')?.textContent;
            const mrn = document.querySelector('[data-patient-id]')?.textContent;
            const dob = document.querySelector('[data-patient-dob]')?.textContent;
            return { name, mrn, dob };
          },
          
          // Generic fallback
          generic: () => {
            // Look for common patterns
            const possibleNameElements = document.querySelectorAll('h1, h2, .patient, .name');
            let name = null;
            let mrn = null;
            
            for (const el of possibleNameElements) {
              const text = el.textContent;
              if (text && text.match(/^[A-Za-z\s,]+$/)) {
                name = text.trim();
                break;
              }
            }
            
            // Look for MRN patterns
            const pageText = document.body.textContent;
            const mrnMatch = pageText.match(/MRN[:\s]+(\d+)/i);
            if (mrnMatch) {
              mrn = mrnMatch[1];
            }
            
            return { name, mrn };
          }
        };

        // Try different extractors
        let patientData = null;
        for (const [system, extractor] of Object.entries(extractors)) {
          try {
            patientData = extractor();
            if (patientData && patientData.name) {
              patientData.system = system;
              break;
            }
          } catch (e) {
            console.error(`${system} extractor failed:`, e);
          }
        }

        return patientData || { error: 'Could not extract patient data' };
      }
    });

    return results[0].result;
  } catch (error) {
    console.error('Extract patient data error:', error);
    throw error;
  }
}

// Inject lab results into page
function injectLabResults(results) {
  // This function is injected into the page
  console.log('Injecting lab results:', results);
  
  // Create results container
  const container = document.createElement('div');
  container.id = 'labflow-results';
  container.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    width: 400px;
    max-height: 80vh;
    background: white;
    border: 1px solid #ddd;
    border-radius: 8px;
    box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    z-index: 10000;
    overflow: hidden;
  `;
  
  // Add header
  const header = document.createElement('div');
  header.style.cssText = `
    padding: 16px;
    background: #4f46e5;
    color: white;
    font-weight: bold;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;
  header.innerHTML = `
    <span>LabFlow Results (${results.length})</span>
    <button onclick="this.parentElement.parentElement.remove()" style="
      background: none;
      border: none;
      color: white;
      cursor: pointer;
      font-size: 20px;
    ">&times;</button>
  `;
  
  // Add results list
  const resultsList = document.createElement('div');
  resultsList.style.cssText = `
    max-height: calc(80vh - 60px);
    overflow-y: auto;
    padding: 16px;
  `;
  
  results.forEach(result => {
    const resultItem = document.createElement('div');
    resultItem.style.cssText = `
      margin-bottom: 12px;
      padding: 12px;
      background: #f9fafb;
      border-radius: 4px;
    `;
    resultItem.innerHTML = `
      <div style="font-weight: bold; margin-bottom: 4px;">${result.testName}</div>
      <div style="font-size: 14px; color: #666;">
        ${result.value} ${result.unit} 
        ${result.flag ? `<span style="color: red;">[${result.flag}]</span>` : ''}
      </div>
      <div style="font-size: 12px; color: #999; margin-top: 4px;">
        ${new Date(result.date).toLocaleDateString()}
      </div>
    `;
    resultsList.appendChild(resultItem);
  });
  
  container.appendChild(header);
  container.appendChild(resultsList);
  document.body.appendChild(container);
}

// Handle logout
function handleLogout() {
  authToken = null;
  currentUser = null;
  isConnected = false;
  chrome.storage.local.remove(['authToken', 'currentUser']);
}

// Get API URL from settings
async function getApiUrl() {
  const settings = await chrome.storage.sync.get('apiUrl');
  return settings.apiUrl || LABFLOW_API_URL;
}

// Listen for tab updates to inject content script if needed
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    // Check if this is an EMR page we should enhance
    const emrPatterns = [
      /epic\.com/i,
      /cerner\.com/i,
      /athenahealth\.com/i,
      /allscripts\.com/i,
      /nextgen\.com/i
    ];
    
    if (emrPatterns.some(pattern => pattern.test(tab.url))) {
      // Inject enhancement script
      chrome.scripting.executeScript({
        target: { tabId },
        files: ['inject.js']
      });
    }
  }
});

// Keep service worker alive
chrome.alarms.create('keepAlive', { periodInMinutes: 1 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'keepAlive') {
    // Perform any necessary background tasks
    console.log('LabFlow extension alive');
  }
});