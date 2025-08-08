// LabFlow Chrome Extension Content Script

// Initialize extension interface
(function() {
  'use strict';

  // State
  let isInitialized = false;
  let floatingWidget = null;
  let patientData = null;

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  function init() {
    if (isInitialized) return;
    isInitialized = true;

    console.log('LabFlow EMR Integration initialized');

    // Check if we're on a supported EMR page
    detectEMRSystem();
    
    // Create floating widget
    createFloatingWidget();
    
    // Set up observers for dynamic content
    observePageChanges();
    
    // Listen for messages from popup/background
    chrome.runtime.onMessage.addListener(handleMessage);
  }

  function detectEMRSystem() {
    const url = window.location.href;
    const title = document.title;
    
    // Detect EMR systems
    const systems = {
      epic: /epic|mychart/i,
      cerner: /cerner|powerchart/i,
      allscripts: /allscripts/i,
      athena: /athenahealth|athenanet/i,
      nextgen: /nextgen/i
    };

    for (const [system, pattern] of Object.entries(systems)) {
      if (pattern.test(url) || pattern.test(title)) {
        console.log(`Detected EMR system: ${system}`);
        document.body.dataset.labflowEmr = system;
        return system;
      }
    }

    return 'generic';
  }

  function createFloatingWidget() {
    // Create container
    floatingWidget = document.createElement('div');
    floatingWidget.id = 'labflow-widget';
    floatingWidget.innerHTML = `
      <div class="labflow-widget-header">
        <img src="${chrome.runtime.getURL('icons/icon-32.png')}" alt="LabFlow" />
        <span>LabFlow</span>
        <button class="labflow-minimize" title="Minimize"></button>
      </div>
      <div class="labflow-widget-content">
        <div class="labflow-status">
          <span class="status-indicator"></span>
          <span class="status-text">Checking connection...</span>
        </div>
        <div class="labflow-actions">
          <button class="labflow-btn labflow-btn-primary" data-action="extract">
            Extract Patient Data
          </button>
          <button class="labflow-btn" data-action="order">
            Create Lab Order
          </button>
          <button class="labflow-btn" data-action="results">
            Import Results
          </button>
        </div>
        <div class="labflow-patient-info" style="display: none;">
          <h4>Current Patient</h4>
          <div class="patient-details"></div>
        </div>
      </div>
    `;

    document.body.appendChild(floatingWidget);

    // Set up event handlers
    setupWidgetHandlers();
    
    // Check connection status
    checkConnection();
  }

  function setupWidgetHandlers() {
    // Minimize/expand
    const minimizeBtn = floatingWidget.querySelector('.labflow-minimize');
    minimizeBtn.addEventListener('click', () => {
      floatingWidget.classList.toggle('minimized');
      minimizeBtn.textContent = floatingWidget.classList.contains('minimized') ? '+' : '';
    });

    // Action buttons
    floatingWidget.addEventListener('click', (e) => {
      if (e.target.matches('[data-action]')) {
        const action = e.target.dataset.action;
        handleAction(action);
      }
    });

    // Make widget draggable
    makeWidgetDraggable();
  }

  function makeWidgetDraggable() {
    const header = floatingWidget.querySelector('.labflow-widget-header');
    let isDragging = false;
    let currentX;
    let currentY;
    let initialX;
    let initialY;
    let xOffset = 0;
    let yOffset = 0;

    header.addEventListener('mousedown', dragStart);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd);

    function dragStart(e) {
      if (e.target.matches('button')) return;
      
      initialX = e.clientX - xOffset;
      initialY = e.clientY - yOffset;

      if (e.target === header || header.contains(e.target)) {
        isDragging = true;
      }
    }

    function drag(e) {
      if (!isDragging) return;

      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;

      xOffset = currentX;
      yOffset = currentY;

      floatingWidget.style.transform = `translate(${currentX}px, ${currentY}px)`;
    }

    function dragEnd() {
      initialX = currentX;
      initialY = currentY;
      isDragging = false;
    }
  }

  async function checkConnection() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkConnection' });
      updateConnectionStatus(response.isConnected, response.currentUser);
    } catch (error) {
      console.error('Connection check failed:', error);
      updateConnectionStatus(false);
    }
  }

  function updateConnectionStatus(isConnected, user) {
    const statusIndicator = floatingWidget.querySelector('.status-indicator');
    const statusText = floatingWidget.querySelector('.status-text');
    
    if (isConnected && user) {
      statusIndicator.className = 'status-indicator connected';
      statusText.textContent = `Connected as ${user.firstName}`;
      enableActions(true);
    } else {
      statusIndicator.className = 'status-indicator disconnected';
      statusText.textContent = 'Not connected';
      enableActions(false);
    }
  }

  function enableActions(enabled) {
    const buttons = floatingWidget.querySelectorAll('.labflow-btn');
    buttons.forEach(btn => {
      btn.disabled = !enabled;
    });
  }

  async function handleAction(action) {
    switch (action) {
      case 'extract':
        await extractPatientData();
        break;
      case 'order':
        await createLabOrder();
        break;
      case 'results':
        await importResults();
        break;
    }
  }

  async function extractPatientData() {
    try {
      const button = floatingWidget.querySelector('[data-action="extract"]');
      button.disabled = true;
      button.textContent = 'Extracting...';

      const response = await chrome.runtime.sendMessage({ action: 'getPatientData' });
      
      if (response.success === false) {
        throw new Error(response.error || 'Failed to extract patient data');
      }

      patientData = response;
      displayPatientData(patientData);
      
      button.textContent = 'Extract Patient Data';
      button.disabled = false;
    } catch (error) {
      console.error('Extract patient data error:', error);
      alert('Failed to extract patient data: ' + error.message);
    }
  }

  function displayPatientData(data) {
    const patientInfo = floatingWidget.querySelector('.labflow-patient-info');
    const patientDetails = patientInfo.querySelector('.patient-details');
    
    if (data && data.name) {
      patientDetails.innerHTML = `
        <div><strong>Name:</strong> ${data.name}</div>
        <div><strong>MRN:</strong> ${data.mrn || 'N/A'}</div>
        <div><strong>DOB:</strong> ${data.dob || 'N/A'}</div>
        <div><strong>System:</strong> ${data.system || 'Unknown'}</div>
      `;
      patientInfo.style.display = 'block';
    } else {
      patientDetails.innerHTML = '<div class="error">No patient data found</div>';
      patientInfo.style.display = 'block';
    }
  }

  async function createLabOrder() {
    if (!patientData || !patientData.name) {
      alert('Please extract patient data first');
      return;
    }

    // Show order dialog
    const orderDialog = createOrderDialog();
    document.body.appendChild(orderDialog);
  }

  function createOrderDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'labflow-dialog-overlay';
    dialog.innerHTML = `
      <div class="labflow-dialog">
        <div class="labflow-dialog-header">
          <h3>Create Lab Order</h3>
          <button class="labflow-dialog-close">&times;</button>
        </div>
        <div class="labflow-dialog-content">
          <div class="labflow-form-group">
            <label>Patient: ${patientData.name}</label>
          </div>
          <div class="labflow-form-group">
            <label>Select Tests:</label>
            <div class="labflow-test-list">
              <label><input type="checkbox" value="CBC"> Complete Blood Count (CBC)</label>
              <label><input type="checkbox" value="CMP"> Comprehensive Metabolic Panel</label>
              <label><input type="checkbox" value="LIPID"> Lipid Panel</label>
              <label><input type="checkbox" value="TSH"> Thyroid Stimulating Hormone</label>
              <label><input type="checkbox" value="HBA1C"> Hemoglobin A1c</label>
              <label><input type="checkbox" value="UA"> Urinalysis</label>
              <label><input type="checkbox" value="CULTURE"> Blood Culture</label>
            </div>
          </div>
          <div class="labflow-form-group">
            <label>Priority:</label>
            <select class="labflow-priority">
              <option value="routine">Routine</option>
              <option value="urgent">Urgent</option>
              <option value="stat">STAT</option>
            </select>
          </div>
          <div class="labflow-form-group">
            <label>Clinical Notes:</label>
            <textarea class="labflow-notes" rows="3"></textarea>
          </div>
        </div>
        <div class="labflow-dialog-footer">
          <button class="labflow-btn" onclick="this.closest('.labflow-dialog-overlay').remove()">
            Cancel
          </button>
          <button class="labflow-btn labflow-btn-primary" data-action="submit-order">
            Create Order
          </button>
        </div>
      </div>
    `;

    // Handle close button
    dialog.querySelector('.labflow-dialog-close').addEventListener('click', () => {
      dialog.remove();
    });

    // Handle submit
    dialog.querySelector('[data-action="submit-order"]').addEventListener('click', async () => {
      const selectedTests = Array.from(dialog.querySelectorAll('input[type="checkbox"]:checked'))
        .map(cb => cb.value);
      
      if (selectedTests.length === 0) {
        alert('Please select at least one test');
        return;
      }

      const orderData = {
        patientName: patientData.name,
        patientMrn: patientData.mrn,
        tests: selectedTests,
        priority: dialog.querySelector('.labflow-priority').value,
        notes: dialog.querySelector('.labflow-notes').value,
        sourceEmr: document.body.dataset.labflowEmr || 'unknown'
      };

      try {
        const response = await chrome.runtime.sendMessage({ 
          action: 'createOrder',
          orderData 
        });
        
        if (response.success) {
          alert(`Lab order ${response.order.id} created successfully!`);
          dialog.remove();
        } else {
          throw new Error(response.error);
        }
      } catch (error) {
        alert('Failed to create order: ' + error.message);
      }
    });

    return dialog;
  }

  async function importResults() {
    if (!patientData || !patientData.mrn) {
      alert('Please extract patient data first');
      return;
    }

    try {
      const button = floatingWidget.querySelector('[data-action="results"]');
      button.disabled = true;
      button.textContent = 'Importing...';

      const response = await chrome.runtime.sendMessage({ 
        action: 'importResults',
        patientId: patientData.mrn 
      });
      
      if (response.success) {
        button.textContent = `Imported ${response.count} results`;
        setTimeout(() => {
          button.textContent = 'Import Results';
          button.disabled = false;
        }, 3000);
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Import results error:', error);
      alert('Failed to import results: ' + error.message);
    }
  }

  function observePageChanges() {
    // Watch for page changes in SPAs
    const observer = new MutationObserver((_mutations) => {
      // Check if patient context changed
      const currentUrl = window.location.href;
      if (currentUrl !== lastUrl) {
        lastUrl = currentUrl;
        // Reset patient data when navigating
        patientData = null;
        const patientInfo = floatingWidget.querySelector('.labflow-patient-info');
        if (patientInfo) {
          patientInfo.style.display = 'none';
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  }

  function handleMessage(request, _sender, _sendResponse) {
    switch (request.action) {
      case 'updateStatus':
        updateConnectionStatus(request.isConnected, request.user);
        break;
      case 'showResults':
        // Results are injected by background script
        break;
    }
  }

  let lastUrl = window.location.href;
})();