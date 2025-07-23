// Popup script for LabFlow EMR Integration

// DOM elements
const statusDot = document.getElementById('status-dot');
const statusTitle = document.getElementById('status-title');
const statusInfo = document.getElementById('status-info');
const patientContext = document.getElementById('patient-context');
const patientInfo = document.getElementById('patient-info');
const apiKeyInput = document.getElementById('api-key');
const serverUrlInput = document.getElementById('server-url');
const saveConfigBtn = document.getElementById('save-config');
const extractPatientBtn = document.getElementById('extract-patient');
const extractOrderBtn = document.getElementById('extract-order');
const testConnectionBtn = document.getElementById('test-connection');

// Initialize popup
document.addEventListener('DOMContentLoaded', initialize);

async function initialize() {
  // Load saved configuration
  await loadConfiguration();
  
  // Get current status
  await updateStatus();
  
  // Set up event listeners
  saveConfigBtn.addEventListener('click', saveConfiguration);
  extractPatientBtn.addEventListener('click', extractPatient);
  extractOrderBtn.addEventListener('click', extractOrder);
  testConnectionBtn.addEventListener('click', testConnection);
  
  // Listen for status updates
  chrome.runtime.onMessage.addListener((request) => {
    if (request.action === 'statusUpdate') {
      updateStatus();
    }
  });
}

// Load saved configuration
async function loadConfiguration() {
  const result = await chrome.storage.local.get(['apiKey', 'serverUrl']);
  
  if (result.apiKey) {
    apiKeyInput.value = result.apiKey;
  }
  
  if (result.serverUrl) {
    serverUrlInput.value = result.serverUrl;
  } else {
    serverUrlInput.value = 'http://localhost:5173';
  }
}

// Save configuration
async function saveConfiguration() {
  const apiKey = apiKeyInput.value.trim();
  const serverUrl = serverUrlInput.value.trim() || 'http://localhost:5173';
  
  if (!apiKey) {
    alert('Please enter an API key');
    return;
  }
  
  // Save to storage
  await chrome.storage.local.set({ apiKey, serverUrl });
  
  // Update button state
  saveConfigBtn.textContent = 'Saved!';
  saveConfigBtn.style.backgroundColor = '#10B981';
  
  setTimeout(() => {
    saveConfigBtn.textContent = 'Save Configuration';
    saveConfigBtn.style.backgroundColor = '#3B82F6';
  }, 2000);
  
  // Test connection automatically
  await testConnection();
}

// Update status display
async function updateStatus() {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response) {
      updateStatusDisplay(response);
    }
  });
}

// Update status display elements
function updateStatusDisplay(status) {
  const { connectionStatus, activeEMRSystem, patientContext: patient } = status;
  
  // Update connection status
  if (connectionStatus === 'connected') {
    statusDot.className = 'status-dot connected';
    statusTitle.textContent = 'Connected to LabFlow';
    statusInfo.textContent = activeEMRSystem 
      ? `Detected EMR: ${activeEMRSystem}` 
      : 'Ready to extract data';
    
    // Enable action buttons
    extractPatientBtn.disabled = false;
    extractOrderBtn.disabled = false;
    testConnectionBtn.disabled = false;
  } else if (connectionStatus === 'pending') {
    statusDot.className = 'status-dot pending';
    statusTitle.textContent = 'Connecting...';
    statusInfo.textContent = 'Testing connection to LabFlow';
  } else {
    statusDot.className = 'status-dot disconnected';
    statusTitle.textContent = 'Not Connected';
    statusInfo.textContent = 'Configure your API key to connect to LabFlow';
    
    // Disable action buttons
    extractPatientBtn.disabled = true;
    extractOrderBtn.disabled = true;
    testConnectionBtn.disabled = !apiKeyInput.value;
  }
  
  // Update patient context
  if (patient && patient.mrn) {
    patientContext.style.display = 'block';
    patientInfo.textContent = `${patient.firstName || ''} ${patient.lastName || ''} (MRN: ${patient.mrn})`;
  } else {
    patientContext.style.display = 'none';
  }
}

// Extract patient from current page
async function extractPatient() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'extractPatientFromSelection' }, (response) => {
    if (response?.success) {
      showNotification('Patient data extracted successfully', 'success');
    } else {
      showNotification('Failed to extract patient data', 'error');
    }
  });
}

// Extract order from current page
async function extractOrder() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  chrome.tabs.sendMessage(tab.id, { action: 'extractOrderFromSelection' }, (response) => {
    if (response?.success) {
      showNotification('Order data extracted successfully', 'success');
    } else {
      showNotification('Failed to extract order data', 'error');
    }
  });
}

// Test connection
async function testConnection() {
  const apiKey = apiKeyInput.value.trim();
  const serverUrl = serverUrlInput.value.trim() || 'http://localhost:5173';
  
  if (!apiKey) {
    alert('Please enter an API key first');
    return;
  }
  
  testConnectionBtn.disabled = true;
  testConnectionBtn.textContent = 'Testing...';
  
  try {
    const response = await fetch(`${serverUrl}/api/emr-integration/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      }
    });
    
    if (response.ok) {
      chrome.runtime.sendMessage({ action: 'updateStatus', status: 'connected' });
      showNotification('Connection successful!', 'success');
    } else {
      throw new Error(`HTTP ${response.status}`);
    }
  } catch (error) {
    showNotification('Connection failed: ' + error.message, 'error');
    chrome.runtime.sendMessage({ action: 'updateStatus', status: 'disconnected' });
  } finally {
    testConnectionBtn.disabled = false;
    testConnectionBtn.textContent = 'Test Connection';
  }
}

// Show notification
function showNotification(message, type = 'info') {
  // Create notification element
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    left: 10px;
    background-color: ${type === 'success' ? '#10B981' : type === 'error' ? '#EF4444' : '#3B82F6'};
    color: white;
    padding: 12px;
    border-radius: 6px;
    font-size: 13px;
    text-align: center;
    z-index: 1000;
    animation: slideDown 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideDown {
      from { transform: translateY(-100%); opacity: 0; }
      to { transform: translateY(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideUp 0.3s ease-in';
    notification.style.animationFillMode = 'forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}