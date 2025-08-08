// LabFlow Chrome Extension Popup Script

document.addEventListener('DOMContentLoaded', init);

// State
// let isConnected = false; // Commented out - not currently used
// let currentUser = null; // Commented out - not currently used

// DOM Elements
const statusIndicator = document.getElementById('statusIndicator');
const statusText = document.getElementById('statusText');
const loginSection = document.getElementById('loginSection');
const mainSection = document.getElementById('mainSection');
const loginForm = document.getElementById('loginForm');
const logoutBtn = document.getElementById('logoutBtn');
const settingsBtn = document.getElementById('settingsBtn');
const settingsPanel = document.getElementById('settingsPanel');
const closeSettingsBtn = document.getElementById('closeSettingsBtn');
const saveSettingsBtn = document.getElementById('saveSettingsBtn');

// Initialize popup
async function init() {
  // Check connection status
  await checkConnection();
  
  // Set up event listeners
  loginForm.addEventListener('submit', handleLogin);
  logoutBtn.addEventListener('click', handleLogout);
  settingsBtn.addEventListener('click', showSettings);
  closeSettingsBtn.addEventListener('click', hideSettings);
  saveSettingsBtn.addEventListener('click', saveSettings);
  
  // Action buttons
  document.getElementById('quickOrderBtn').addEventListener('click', handleQuickOrder);
  document.getElementById('viewResultsBtn').addEventListener('click', handleViewResults);
  document.getElementById('syncDataBtn').addEventListener('click', handleSyncData);
  
  // Load settings
  loadSettings();
}

// Check connection status
async function checkConnection() {
  try {
    const response = await chrome.runtime.sendMessage({ action: 'checkConnection' });
    updateUI(response.isConnected, response.currentUser);
    
    if (response.isConnected) {
      // Load stats
      loadStats();
    }
  } catch (error) {
    console.error('Connection check failed:', error);
    updateUI(false);
  }
}

// Update UI based on connection status
function updateUI(connected, user) {
  // isConnected = connected; // Commented out - not currently used
  // currentUser = user; // Commented out - not currently used
  
  if (connected && user) {
    statusIndicator.className = 'status-indicator connected';
    statusText.textContent = 'Connected to LabFlow';
    loginSection.style.display = 'none';
    mainSection.style.display = 'block';
    logoutBtn.style.display = 'flex';
    
    // Update user info
    document.getElementById('userName').textContent = `${user.firstName} ${user.lastName}`;
    document.getElementById('userRole').textContent = user.role;
    document.getElementById('userInitials').textContent = 
      `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  } else {
    statusIndicator.className = 'status-indicator disconnected';
    statusText.textContent = 'Not connected';
    loginSection.style.display = 'block';
    mainSection.style.display = 'none';
    logoutBtn.style.display = 'none';
  }
}

// Handle login
async function handleLogin(e) {
  e.preventDefault();
  
  const email = document.getElementById('email').value;
  const password = document.getElementById('password').value;
  const submitBtn = loginForm.querySelector('button[type="submit"]');
  
  // Show loading state
  submitBtn.disabled = true;
  submitBtn.textContent = 'Connecting...';
  submitBtn.innerHTML = '<span class="spinner"></span> Connecting...';
  
  try {
    const response = await chrome.runtime.sendMessage({
      action: 'authenticate',
      credentials: { email, password }
    });
    
    if (response.success) {
      updateUI(true, response.user);
      showMessage('Connected successfully!', 'success');
      
      // Clear form
      loginForm.reset();
    } else {
      throw new Error(response.error || 'Authentication failed');
    }
  } catch (error) {
    console.error('Login error:', error);
    showMessage(error.message, 'error');
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = 'Connect';
  }
}

// Handle logout
async function handleLogout() {
  try {
    await chrome.runtime.sendMessage({ action: 'logout' });
    updateUI(false);
    showMessage('Logged out successfully', 'success');
  } catch (error) {
    console.error('Logout error:', error);
    showMessage('Logout failed', 'error');
  }
}

// Handle quick order
async function handleQuickOrder() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    chrome.tabs.sendMessage(tab.id, { action: 'showQuickOrder' });
    
    // Close popup
    window.close();
  } catch (error) {
    console.error('Quick order error:', error);
    showMessage('Failed to open quick order', 'error');
  }
}

// Handle view results
async function handleViewResults() {
  try {
    // Open LabFlow results page in new tab
    chrome.tabs.create({
      url: 'https://app.labflow.com/results'
    });
  } catch (error) {
    console.error('View results error:', error);
    showMessage('Failed to open results', 'error');
  }
}

// Handle sync data
async function handleSyncData() {
  const btn = document.getElementById('syncDataBtn');
  const originalContent = btn.innerHTML;
  
  try {
    // Show loading state
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner"></span> Syncing...';
    
    // Simulate sync (in real app, this would call an API)
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Success
    btn.innerHTML = '<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M5 13l4 4L19 7"></path></svg> Synced';
    
    // Reload stats
    await loadStats();
    
    setTimeout(() => {
      btn.innerHTML = originalContent;
      btn.disabled = false;
    }, 2000);
  } catch (error) {
    console.error('Sync error:', error);
    btn.innerHTML = originalContent;
    btn.disabled = false;
    showMessage('Sync failed', 'error');
  }
}

// Load stats
async function loadStats() {
  try {
    // In a real app, this would fetch from API
    // For demo, using random values
    document.getElementById('ordersToday').textContent = 
      Math.floor(Math.random() * 20) + 5;
    document.getElementById('pendingResults').textContent = 
      Math.floor(Math.random() * 10) + 2;
  } catch (error) {
    console.error('Load stats error:', error);
  }
}

// Settings management
function showSettings() {
  settingsPanel.style.display = 'flex';
}

function hideSettings() {
  settingsPanel.style.display = 'none';
}

async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'autoImport',
      'notificationsEnabled',
      'apiUrl',
      'hl7Format'
    ]);
    
    document.getElementById('autoImport').checked = 
      settings.autoImport !== false;
    document.getElementById('notifications').checked = 
      settings.notificationsEnabled !== false;
    document.getElementById('apiUrl').value = 
      settings.apiUrl || 'https://api.labflow.com';
    document.getElementById('hl7Format').value = 
      settings.hl7Format || 'v2.5.1';
  } catch (error) {
    console.error('Load settings error:', error);
  }
}

async function saveSettings() {
  try {
    const settings = {
      autoImport: document.getElementById('autoImport').checked,
      notificationsEnabled: document.getElementById('notifications').checked,
      apiUrl: document.getElementById('apiUrl').value,
      hl7Format: document.getElementById('hl7Format').value
    };
    
    await chrome.storage.sync.set(settings);
    showMessage('Settings saved', 'success');
    hideSettings();
  } catch (error) {
    console.error('Save settings error:', error);
    showMessage('Failed to save settings', 'error');
  }
}

// Show message
function showMessage(text, type = 'info') {
  const messageEl = document.createElement('div');
  messageEl.className = `${type}-message`;
  messageEl.textContent = text;
  
  // Insert at the beginning of the current section
  const currentSection = loginSection.style.display !== 'none' 
    ? loginSection 
    : mainSection;
  currentSection.insertBefore(messageEl, currentSection.firstChild);
  
  // Remove after 3 seconds
  setTimeout(() => {
    messageEl.remove();
  }, 3000);
}

// Listen for updates from background script
chrome.runtime.onMessage.addListener((request, _sender, _sendResponse) => {
  if (request.action === 'updateStatus') {
    updateUI(request.isConnected, request.user);
  }
});