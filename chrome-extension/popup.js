// Popup Script

const elements = {
  statusIndicator: document.getElementById('statusIndicator'),
  statusText: document.getElementById('statusText'),
  userInfo: document.getElementById('userInfo'),
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),
  userRole: document.getElementById('userRole'),
  quickOrderBtn: document.getElementById('quickOrderBtn'),
  viewResultsBtn: document.getElementById('viewResultsBtn'),
  syncPatientBtn: document.getElementById('syncPatientBtn'),
  settingsBtn: document.getElementById('settingsBtn'),
  loginBtn: document.getElementById('loginBtn'),
  logoutBtn: document.getElementById('logoutBtn')
};

// Check authentication status on load
checkAuthStatus();

// Event listeners
elements.quickOrderBtn.addEventListener('click', handleQuickOrder);
elements.viewResultsBtn.addEventListener('click', handleViewResults);
elements.syncPatientBtn.addEventListener('click', handleSyncPatient);
elements.settingsBtn.addEventListener('click', handleSettings);
elements.loginBtn.addEventListener('click', handleLogin);
elements.logoutBtn.addEventListener('click', handleLogout);

async function checkAuthStatus() {
  try {
    const { labflow_auth_token, labflow_user_info } = await chrome.storage.local.get([
      'labflow_auth_token',
      'labflow_user_info'
    ]);
    
    if (labflow_auth_token && labflow_user_info) {
      updateUI('connected', labflow_user_info);
    } else {
      updateUI('disconnected');
    }
  } catch (error) {
    console.error('Error checking auth status:', error);
    updateUI('error');
  }
}

function updateUI(status, userInfo = null) {
  // Update status indicator
  elements.statusIndicator.className = `status-indicator ${status}`;
  
  switch (status) {
    case 'connected':
      elements.statusText.textContent = 'Connected to LabFlow';
      elements.loginBtn.style.display = 'none';
      elements.logoutBtn.style.display = 'flex';
      enableActionButtons(true);
      
      if (userInfo) {
        elements.userInfo.style.display = 'flex';
        elements.userAvatar.textContent = userInfo.name ? userInfo.name.charAt(0).toUpperCase() : '?';
        elements.userName.textContent = userInfo.name || 'Unknown User';
        elements.userRole.textContent = userInfo.role || 'User';
      }
      break;
      
    case 'disconnected':
      elements.statusText.textContent = 'Not connected';
      elements.loginBtn.style.display = 'flex';
      elements.logoutBtn.style.display = 'none';
      elements.userInfo.style.display = 'none';
      enableActionButtons(false);
      break;
      
    case 'error':
      elements.statusText.textContent = 'Connection error';
      elements.loginBtn.style.display = 'flex';
      elements.logoutBtn.style.display = 'none';
      elements.userInfo.style.display = 'none';
      enableActionButtons(false);
      break;
  }
}

function enableActionButtons(enabled) {
  elements.quickOrderBtn.disabled = !enabled;
  elements.viewResultsBtn.disabled = !enabled;
  elements.syncPatientBtn.disabled = !enabled;
}

async function handleQuickOrder() {
  try {
    // Get current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Send message to content script
    await chrome.tabs.sendMessage(tab.id, { action: 'showOrderDialog' });
    
    // Close popup
    window.close();
  } catch (error) {
    console.error('Error handling quick order:', error);
    alert('Failed to open order dialog. Make sure you are on an EMR page.');
  }
}

async function handleViewResults() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    await chrome.tabs.sendMessage(tab.id, { action: 'showResultsDialog' });
    window.close();
  } catch (error) {
    console.error('Error handling view results:', error);
    alert('Failed to open results dialog. Make sure you are on an EMR page.');
  }
}

async function handleSyncPatient() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    // Show loading state
    elements.syncPatientBtn.disabled = true;
    elements.syncPatientBtn.textContent = 'Syncing...';
    
    // Send sync request
    const response = await chrome.tabs.sendMessage(tab.id, { action: 'syncCurrentPatient' });
    
    if (response && response.success) {
      // Show success
      elements.syncPatientBtn.textContent = 'Synced!';
      setTimeout(() => {
        elements.syncPatientBtn.textContent = 'Sync Patient';
        elements.syncPatientBtn.disabled = false;
      }, 2000);
    } else {
      throw new Error(response?.error || 'Sync failed');
    }
  } catch (error) {
    console.error('Error syncing patient:', error);
    alert('Failed to sync patient. Make sure you are on an EMR page with a patient selected.');
    elements.syncPatientBtn.textContent = 'Sync Patient';
    elements.syncPatientBtn.disabled = false;
  }
}

function handleSettings() {
  chrome.tabs.create({ url: chrome.runtime.getURL('settings.html') });
}

function handleLogin() {
  chrome.tabs.create({ url: 'https://labsystem-a1.web.app/login?extension=true' });
}

async function handleLogout() {
  if (confirm('Are you sure you want to logout?')) {
    await chrome.storage.local.remove(['labflow_auth_token', 'labflow_user_info']);
    updateUI('disconnected');
  }
}

// Listen for storage changes (auth state changes)
chrome.storage.onChanged.addListener((changes, namespace) => {
  if (namespace === 'local') {
    if (changes.labflow_auth_token || changes.labflow_user_info) {
      checkAuthStatus();
    }
  }
});