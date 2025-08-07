// EMR Injector - Injects LabFlow UI into EMR pages

class LabFlowInjector {
  constructor() {
    this.widget = null;
    this.isInitialized = false;
  }

  async initialize() {
    if (this.isInitialized) return;
    
    // Detect EMR type
    const emrType = window.LabFlowEMRDetector.detect();
    if (!emrType) return;

    // Inject styles
    this.injectStyles();
    
    // Create widget
    this.createWidget();
    
    // Set up listeners
    this.setupListeners();
    
    this.isInitialized = true;
  }

  injectStyles() {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = chrome.runtime.getURL('src/content/emr-styles.css');
    document.head.appendChild(link);
  }

  createWidget() {
    // Create widget container
    this.widget = document.createElement('div');
    this.widget.className = 'labflow-widget';
    this.widget.innerHTML = `
      <div class="labflow-widget-header">
        <img src="${chrome.runtime.getURL('icons/icon-32.png')}" alt="LabFlow">
        <span>LabFlow Integration</span>
        <button class="labflow-close" aria-label="Close">×</button>
      </div>
      <div class="labflow-widget-content">
        <div class="labflow-status">
          <span class="status-indicator"></span>
          <span class="status-text">Connecting...</span>
        </div>
        <div class="labflow-actions">
          <button class="labflow-btn labflow-btn-primary" id="labflow-quick-order">
            Quick Order
          </button>
          <button class="labflow-btn" id="labflow-view-results">
            View Results
          </button>
          <button class="labflow-btn" id="labflow-sync-patient">
            Sync Patient
          </button>
        </div>
        <div class="labflow-patient-info" style="display: none;">
          <h4>Current Patient</h4>
          <div class="patient-details"></div>
        </div>
      </div>
    `;

    document.body.appendChild(this.widget);
  }

  setupListeners() {
    // Close button
    this.widget.querySelector('.labflow-close').addEventListener('click', () => {
      this.hide();
    });

    // Quick order button
    this.widget.querySelector('#labflow-quick-order').addEventListener('click', () => {
      this.handleQuickOrder();
    });

    // View results button
    this.widget.querySelector('#labflow-view-results').addEventListener('click', () => {
      this.handleViewResults();
    });

    // Sync patient button
    this.widget.querySelector('#labflow-sync-patient').addEventListener('click', () => {
      this.handleSyncPatient();
    });

    // Listen for patient changes
    window.LabFlowEMRDetector.observePatientChange((patientData) => {
      this.updatePatientInfo(patientData);
    });

    // Listen for messages from background script
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      switch (request.action) {
        case 'initializeWidget':
          this.show();
          break;
        case 'showOrderDialog':
          this.showOrderDialog(request.selectedText);
          break;
        case 'showResultsDialog':
          this.showResultsDialog(request.selectedText);
          break;
      }
    });

    // Check authentication status
    this.checkAuthStatus();
  }

  async checkAuthStatus() {
    try {
      const response = await chrome.runtime.sendMessage({ action: 'checkAuth' });
      if (response.authenticated) {
        this.updateStatus('connected', 'Connected to LabFlow');
      } else {
        this.updateStatus('disconnected', 'Click to authenticate');
        this.widget.querySelector('.labflow-status').addEventListener('click', () => {
          this.showAuthDialog();
        });
      }
    } catch (error) {
      this.updateStatus('error', 'Connection error');
    }
  }

  updateStatus(status, text) {
    const indicator = this.widget.querySelector('.status-indicator');
    const statusText = this.widget.querySelector('.status-text');
    
    indicator.className = `status-indicator status-${status}`;
    statusText.textContent = text;
  }

  updatePatientInfo(patientData) {
    if (!patientData || !patientData.firstName) {
      this.widget.querySelector('.labflow-patient-info').style.display = 'none';
      return;
    }

    const patientInfo = this.widget.querySelector('.labflow-patient-info');
    const details = patientInfo.querySelector('.patient-details');
    
    details.innerHTML = `
      <div><strong>Name:</strong> ${patientData.firstName} ${patientData.lastName}</div>
      <div><strong>MRN:</strong> ${patientData.mrn}</div>
      <div><strong>DOB:</strong> ${patientData.dateOfBirth}</div>
      ${patientData.gender ? `<div><strong>Gender:</strong> ${patientData.gender}</div>` : ''}
    `;
    
    patientInfo.style.display = 'block';
  }

  async handleQuickOrder() {
    const patientData = window.LabFlowEMRDetector.getPatientData();
    if (!patientData || !patientData.mrn) {
      alert('Please select a patient first');
      return;
    }

    this.showOrderDialog();
  }

  async handleViewResults() {
    const patientData = window.LabFlowEMRDetector.getPatientData();
    if (!patientData || !patientData.mrn) {
      alert('Please select a patient first');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'syncResults',
        patientId: patientData.mrn
      });

      if (response.error) {
        alert(`Error: ${response.error}`);
        return;
      }

      this.showResultsDialog(response);
    } catch (error) {
      alert('Failed to fetch results');
    }
  }

  async handleSyncPatient() {
    const patientData = window.LabFlowEMRDetector.getPatientData();
    if (!patientData || !patientData.mrn) {
      alert('No patient data found');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'syncPatient',
        patientData,
        emrType: window.LabFlowEMRDetector.emrType
      });

      if (response.success) {
        this.updateStatus('connected', 'Patient synced');
        setTimeout(() => {
          this.updateStatus('connected', 'Connected to LabFlow');
        }, 3000);
      } else {
        alert(`Sync failed: ${response.error}`);
      }
    } catch (error) {
      alert('Failed to sync patient');
    }
  }

  showOrderDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'labflow-dialog';
    dialog.innerHTML = `
      <div class="labflow-dialog-content">
        <h3>Quick Lab Order</h3>
        <iframe src="${chrome.runtime.getURL('order.html')}" frameborder="0"></iframe>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  showResultsDialog(results) {
    const dialog = document.createElement('div');
    dialog.className = 'labflow-dialog';
    dialog.innerHTML = `
      <div class="labflow-dialog-content">
        <h3>Lab Results</h3>
        <iframe src="${chrome.runtime.getURL('results.html')}" frameborder="0"></iframe>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  showAuthDialog() {
    const dialog = document.createElement('div');
    dialog.className = 'labflow-dialog';
    dialog.innerHTML = `
      <div class="labflow-dialog-content">
        <h3>LabFlow Authentication</h3>
        <iframe src="${chrome.runtime.getURL('auth.html')}" frameborder="0"></iframe>
      </div>
    `;
    document.body.appendChild(dialog);
  }

  show() {
    this.widget.style.display = 'block';
  }

  hide() {
    this.widget.style.display = 'none';
  }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    window.labflowInjector = new LabFlowInjector();
    window.labflowInjector.initialize();
  });
} else {
  window.labflowInjector = new LabFlowInjector();
  window.labflowInjector.initialize();
}