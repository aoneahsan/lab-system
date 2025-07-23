// Content script for LabFlow EMR Integration

let isInitialized = false;
let emrSystem = null;
let observer = null;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initialize);
} else {
  initialize();
}

function initialize() {
  if (isInitialized) return;
  isInitialized = true;
  
  console.log('LabFlow EMR Integration: Content script loaded');
  
  // Detect EMR system
  detectEMRSystem();
  
  // Set up mutation observer for dynamic content
  setupMutationObserver();
  
  // Listen for messages from background script
  chrome.runtime.onMessage.addListener(handleMessage);
  
  // Inject UI elements
  injectLabFlowUI();
}

// Detect EMR system
async function detectEMRSystem() {
  const data = {
    url: window.location.href,
    title: document.title,
    content: document.body.innerText.substring(0, 1000) // First 1000 chars
  };
  
  chrome.runtime.sendMessage(
    { action: 'detectEMR', data },
    (response) => {
      if (response?.detected) {
        emrSystem = response.system;
        console.log(`LabFlow: Detected ${emrSystem} EMR system`);
        setupEMRSpecificHandlers();
      }
    }
  );
}

// Set up EMR-specific handlers
function setupEMRSpecificHandlers() {
  switch (emrSystem) {
    case 'epic':
      setupEpicHandlers();
      break;
    case 'cerner':
      setupCernerHandlers();
      break;
    case 'allscripts':
      setupAllscriptsHandlers();
      break;
    // Add other EMR systems as needed
    default:
      setupGenericHandlers();
  }
}

// Epic-specific handlers
function setupEpicHandlers() {
  // Look for patient header
  const patientHeader = document.querySelector('.patient-header, .pt-header, [class*="patient"]');
  if (patientHeader) {
    addLabFlowButton(patientHeader, 'Send to LabFlow', () => {
      extractAndSendPatientData();
    });
  }
  
  // Look for order panels
  const orderPanels = document.querySelectorAll('.order-panel, .orders-list, [class*="order"]');
  orderPanels.forEach(panel => {
    addLabFlowButton(panel, 'Send Order to LabFlow', () => {
      extractAndSendOrderData(panel);
    });
  });
}

// Cerner-specific handlers
function setupCernerHandlers() {
  // Similar to Epic but with Cerner-specific selectors
  const patientBanner = document.querySelector('#patient-banner, .patient-banner');
  if (patientBanner) {
    addLabFlowButton(patientBanner, 'Send to LabFlow', () => {
      extractAndSendPatientData();
    });
  }
}

// Allscripts-specific handlers
function setupAllscriptsHandlers() {
  // Allscripts-specific implementation
  const patientInfo = document.querySelector('.patient-info, #patientInfo');
  if (patientInfo) {
    addLabFlowButton(patientInfo, 'Send to LabFlow', () => {
      extractAndSendPatientData();
    });
  }
}

// Generic handlers for unknown EMR systems
function setupGenericHandlers() {
  // Try to find patient information generically
  const possiblePatientElements = document.querySelectorAll(
    '[class*="patient"], [id*="patient"], [data-patient]'
  );
  
  possiblePatientElements.forEach(element => {
    if (element.textContent.includes('MRN') || element.textContent.includes('DOB')) {
      addLabFlowButton(element, 'Send to LabFlow', () => {
        extractAndSendPatientData();
      });
    }
  });
}

// Extract patient data
function extractAndSendPatientData() {
  const patientData = extractPatientFromPage();
  
  if (patientData) {
    chrome.runtime.sendMessage(
      { action: 'extractPatient', data: patientData },
      (response) => {
        if (response?.success) {
          showNotification('Patient data extracted successfully');
          // Send to LabFlow
          sendToLabFlow('patient', response.patient);
        } else {
          showNotification('Failed to extract patient data', 'error');
        }
      }
    );
  }
}

// Extract order data
function extractAndSendOrderData(orderElement) {
  const orderData = extractOrderFromElement(orderElement);
  
  if (orderData) {
    chrome.runtime.sendMessage(
      { action: 'extractOrder', data: orderData },
      (response) => {
        if (response?.success) {
          showNotification('Order data extracted successfully');
          // Send to LabFlow
          sendToLabFlow('order', response.order);
        } else {
          showNotification('Failed to extract order data', 'error');
        }
      }
    );
  }
}

// Extract patient data from page
function extractPatientFromPage() {
  const data = {
    content: document.body.innerText
  };
  
  // Try to extract structured data based on EMR system
  if (emrSystem === 'epic') {
    const mrnElement = document.querySelector('[data-mrn], .mrn, [class*="mrn"]');
    if (mrnElement) data.mrn = mrnElement.textContent.trim();
    
    const nameElement = document.querySelector('[data-patient-name], .patient-name');
    if (nameElement) {
      const nameParts = nameElement.textContent.trim().split(',');
      if (nameParts.length >= 2) {
        data.lastName = nameParts[0].trim();
        data.firstName = nameParts[1].trim();
      }
    }
  }
  
  return data;
}

// Extract order data from element
function extractOrderFromElement(element) {
  const data = {
    content: element.innerText
  };
  
  // Extract order number
  const orderNumElement = element.querySelector('[data-order-id], .order-number');
  if (orderNumElement) data.orderNumber = orderNumElement.textContent.trim();
  
  // Extract tests
  const testElements = element.querySelectorAll('.test-name, .order-item');
  data.tests = Array.from(testElements).map(el => ({
    name: el.textContent.trim()
  }));
  
  return data;
}

// Send data to LabFlow
function sendToLabFlow(type, payload) {
  chrome.runtime.sendMessage(
    { action: 'sendToLabFlow', data: { type, payload } },
    (response) => {
      if (response?.success) {
        showNotification(`${type} sent to LabFlow successfully`);
      } else {
        showNotification(`Failed to send ${type} to LabFlow: ${response.error}`, 'error');
      }
    }
  );
}

// Add LabFlow button to element
function addLabFlowButton(element, text, onClick) {
  // Check if button already exists
  if (element.querySelector('.labflow-button')) return;
  
  const button = document.createElement('button');
  button.className = 'labflow-button';
  button.textContent = text;
  button.style.cssText = `
    background-color: #3B82F6;
    color: white;
    border: none;
    padding: 6px 12px;
    border-radius: 4px;
    font-size: 14px;
    cursor: pointer;
    margin-left: 10px;
    font-family: inherit;
  `;
  
  button.addEventListener('click', onClick);
  button.addEventListener('mouseenter', () => {
    button.style.backgroundColor = '#2563EB';
  });
  button.addEventListener('mouseleave', () => {
    button.style.backgroundColor = '#3B82F6';
  });
  
  element.appendChild(button);
}

// Inject LabFlow UI elements
function injectLabFlowUI() {
  // Create floating status indicator
  const statusIndicator = document.createElement('div');
  statusIndicator.id = 'labflow-status';
  statusIndicator.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background-color: white;
    border: 1px solid #E5E7EB;
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    display: none;
  `;
  
  statusIndicator.innerHTML = `
    <div style="display: flex; align-items: center; gap: 8px;">
      <div id="labflow-status-dot" style="width: 8px; height: 8px; border-radius: 50%; background-color: #EF4444;"></div>
      <span id="labflow-status-text">LabFlow: Disconnected</span>
    </div>
  `;
  
  document.body.appendChild(statusIndicator);
  
  // Update status
  updateStatus();
}

// Update connection status
function updateStatus() {
  chrome.runtime.sendMessage({ action: 'getStatus' }, (response) => {
    if (response) {
      const statusDot = document.getElementById('labflow-status-dot');
      const statusText = document.getElementById('labflow-status-text');
      const statusIndicator = document.getElementById('labflow-status');
      
      if (statusDot && statusText) {
        if (response.connectionStatus === 'connected') {
          statusDot.style.backgroundColor = '#10B981';
          statusText.textContent = `LabFlow: Connected${response.activeEMRSystem ? ` (${response.activeEMRSystem})` : ''}`;
        } else {
          statusDot.style.backgroundColor = '#EF4444';
          statusText.textContent = 'LabFlow: Disconnected';
        }
        
        // Show indicator if EMR is detected
        if (response.activeEMRSystem && statusIndicator) {
          statusIndicator.style.display = 'block';
        }
      }
    }
  });
}

// Show notification
function showNotification(message, type = 'success') {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background-color: ${type === 'success' ? '#10B981' : '#EF4444'};
    color: white;
    padding: 12px 24px;
    border-radius: 6px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    z-index: 10001;
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    font-size: 14px;
    animation: slideIn 0.3s ease-out;
  `;
  notification.textContent = message;
  
  // Add animation
  const style = document.createElement('style');
  style.textContent = `
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
  
  document.body.appendChild(notification);
  
  // Remove after 3 seconds
  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    notification.style.animationFillMode = 'forwards';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Set up mutation observer for dynamic content
function setupMutationObserver() {
  observer = new MutationObserver((mutations) => {
    // Re-run EMR-specific handlers when DOM changes
    if (emrSystem) {
      setupEMRSpecificHandlers();
    }
  });
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
}

// Handle messages from background script
function handleMessage(request, sender, sendResponse) {
  switch (request.action) {
    case 'statusUpdate':
      updateStatus();
      break;
      
    case 'extractPatientFromSelection':
      const selectedText = window.getSelection().toString();
      if (selectedText) {
        extractAndSendPatientData();
      }
      break;
      
    case 'extractOrderFromSelection':
      const selection = window.getSelection();
      if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        const container = range.commonAncestorContainer.parentElement;
        extractAndSendOrderData(container);
      }
      break;
  }
}

// Clean up on unload
window.addEventListener('unload', () => {
  if (observer) {
    observer.disconnect();
  }
});