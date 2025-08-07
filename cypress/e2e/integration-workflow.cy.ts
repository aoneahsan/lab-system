describe('End-to-End Integration Workflow', () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.seedDatabase({
      patients: 5,
      tests: 20,
      orders: 10
    });
  });

  describe('Complete Patient Journey', () => {
    it('should complete full workflow from registration to report delivery', () => {
      // Step 1: Patient Registration
      cy.loginAsAdmin();
      cy.visit('/patients/new');
      
      const patientData = {
        firstName: 'Integration',
        lastName: 'Test Patient',
        dateOfBirth: '1985-06-15',
        gender: 'female',
        email: 'integration@test.com',
        phone: '(555) 123-4567',
        mrn: 'INT-TEST-001'
      };
      
      cy.createPatient(patientData);
      cy.url().should('match', /\/patients\/[a-zA-Z0-9]+$/);
      cy.location('pathname').then((pathname) => {
        const patientId = pathname.split('/').pop();
        cy.wrap(patientId).as('patientId');
      });

      // Step 2: Order Tests
      cy.get('@patientId').then((patientId) => {
        cy.visit(`/patients/${patientId}`);
        cy.get('[data-testid="order-tests-button"]').click();
        
        // Order comprehensive metabolic panel
        cy.get('[data-testid="panels-tab"]').click();
        cy.get('[data-testid="panel-cmp"]').click();
        cy.get('[data-testid="priority-stat"]').check();
        cy.get('[data-testid="clinical-notes"]').type('Annual checkup - STAT due to symptoms');
        cy.get('[data-testid="submit-order"]').click();
        
        cy.contains('Order created successfully').should('be.visible');
        cy.url().should('match', /\/orders\/[a-zA-Z0-9]+$/);
        cy.location('pathname').then((pathname) => {
          const orderId = pathname.split('/').pop();
          cy.wrap(orderId).as('orderId');
        });
      });

      // Step 3: Sample Collection
      cy.logout();
      cy.loginAsPhlebotomist();
      
      cy.get('@orderId').then((orderId) => {
        cy.visit(`/orders/${orderId}`);
        cy.get('[data-testid="collect-sample"]').click();
        
        // Barcode generation
        cy.get('[data-testid="generate-barcode"]').click();
        cy.get('[data-testid="barcode-display"]').should('be.visible');
        
        // Collection details
        cy.get('[data-testid="collection-time"]').type('08:30');
        cy.get('[data-testid="fasting-confirmed"]').check();
        cy.get('[data-testid="collection-notes"]').type('Patient fasted for 12 hours');
        cy.get('[data-testid="confirm-collection"]').click();
        
        cy.contains('Sample collected successfully').should('be.visible');
      });

      // Step 4: Sample Processing
      cy.logout();
      cy.loginAsLabTech();
      
      cy.visit('/samples/pending');
      cy.get('[data-testid="sample-row"]').first().click();
      cy.get('[data-testid="receive-sample"]').click();
      cy.get('[data-testid="sample-condition"]').select('Acceptable');
      cy.get('[data-testid="confirm-receipt"]').click();

      // Step 5: Result Entry
      cy.get('[data-testid="enter-results"]').click();
      
      // Enter all CMP results
      const cmpResults = {
        'Glucose': '92',
        'BUN': '15',
        'Creatinine': '0.9',
        'eGFR': '95',
        'Sodium': '140',
        'Potassium': '4.0',
        'Chloride': '102',
        'CO2': '24',
        'Calcium': '9.8',
        'Total_Protein': '7.2',
        'Albumin': '4.5',
        'Total_Bilirubin': '0.8',
        'ALT': '25',
        'AST': '22'
      };
      
      Object.entries(cmpResults).forEach(([test, value]) => {
        cy.get(`[data-testid="result-${test}"]`).type(value);
      });
      
      cy.get('[data-testid="save-results"]').click();
      cy.contains('Results saved successfully').should('be.visible');

      // Step 6: Result Verification
      cy.get('[data-testid="submit-for-verification"]').click();
      cy.logout();
      cy.loginAsLabTech(); // Senior tech for verification
      
      cy.visit('/results/pending-verification');
      cy.get('[data-testid="result-row"]').first().click();
      
      // Verify results
      cy.get('[data-testid="review-results"]').click();
      cy.get('[data-testid="verify-checklist"]').within(() => {
        cy.get('input[type="checkbox"]').each(($checkbox) => {
          cy.wrap($checkbox).check();
        });
      });
      cy.get('[data-testid="approve-results"]').click();
      
      // Step 7: Report Generation and Delivery
      cy.get('[data-testid="generate-report"]').click();
      cy.waitForSpinners();
      
      // Preview report
      cy.get('[data-testid="report-preview"]').should('be.visible');
      cy.get('[data-testid="approve-report"]').click();
      
      // Send to physician
      cy.get('[data-testid="send-report"]').click();
      cy.get('[data-testid="delivery-method"]').select('Secure Portal');
      cy.get('[data-testid="confirm-send"]').click();
      
      cy.contains('Report sent successfully').should('be.visible');

      // Step 8: Billing
      cy.logout();
      cy.loginAsAdmin();
      
      cy.visit('/billing/unbilled');
      cy.get('[data-testid="order-row"]').first().within(() => {
        cy.contains('INT-TEST-001').should('be.visible');
        cy.get('[data-testid="create-bill"]').click();
      });
      
      // Review charges
      cy.get('[data-testid="charge-review"]').should('be.visible');
      cy.get('[data-testid="total-charges"]').should('contain', '$125.00');
      
      // Apply insurance
      cy.get('[data-testid="apply-insurance"]').check();
      cy.get('[data-testid="insurance-portion"]').should('contain', '$100.00');
      cy.get('[data-testid="patient-portion"]').should('contain', '$25.00');
      
      // Generate invoice
      cy.get('[data-testid="generate-invoice"]').click();
      cy.contains('Invoice generated').should('be.visible');

      // Verify complete workflow
      cy.visit('/dashboard');
      cy.get('[data-testid="workflow-status"]').within(() => {
        cy.contains('Completed Orders Today').parent().should('contain', '1');
        cy.contains('Reports Sent').parent().should('contain', '1');
        cy.contains('Pending Billing').parent().should('contain', '0');
      });
    });
  });

  describe('Multi-Tenant Workflow', () => {
    it('should handle multiple tenants independently', () => {
      // Tenant 1 Operations
      cy.login('admin@tenant1.com', 'password');
      cy.visit('/dashboard');
      cy.get('[data-testid="tenant-name"]').should('contain', 'Tenant 1 Lab');
      
      // Create patient in Tenant 1
      cy.createPatient({
        firstName: 'Tenant1',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        email: 't1patient@test.com',
        phone: '(555) 111-1111'
      });
      
      // Logout and switch to Tenant 2
      cy.logout();
      cy.login('admin@tenant2.com', 'password');
      cy.visit('/dashboard');
      cy.get('[data-testid="tenant-name"]').should('contain', 'Tenant 2 Lab');
      
      // Verify Tenant 1 patient not visible
      cy.visit('/patients');
      cy.searchPatient('Tenant1 Patient');
      cy.get('[data-testid="no-results"]').should('be.visible');
      
      // Create patient in Tenant 2
      cy.createPatient({
        firstName: 'Tenant2',
        lastName: 'Patient',
        dateOfBirth: '1995-05-15',
        gender: 'female',
        email: 't2patient@test.com',
        phone: '(555) 222-2222'
      });
      
      // Verify data isolation
      cy.visit('/patients');
      cy.get('[data-testid="patient-count"]').should('contain', '1');
    });
  });

  describe('Emergency Workflow', () => {
    it('should handle emergency STAT orders', () => {
      // Emergency patient admission
      cy.loginAsDoctor();
      cy.visit('/emergency/quick-order');
      
      // Quick patient registration
      cy.get('[data-testid="emergency-registration"]').click();
      cy.get('[data-testid="patient-name"]').type('John Emergency');
      cy.get('[data-testid="dob"]').type('1970-01-01');
      cy.get('[data-testid="save-continue"]').click();
      
      // STAT order entry
      cy.get('[data-testid="stat-panels"]').within(() => {
        cy.get('[data-testid="cardiac-panel"]').click();
        cy.get('[data-testid="basic-metabolic"]').click();
      });
      
      cy.get('[data-testid="critical-notes"]').type('Chest pain, SOB, diaphoretic');
      cy.get('[data-testid="submit-stat-order"]').click();
      
      // Verify priority indicators
      cy.get('[data-testid="order-confirmation"]').within(() => {
        cy.get('[data-testid="stat-indicator"]').should('be.visible');
        cy.contains('STAT').should('have.class', 'text-red-600');
        cy.contains('Notify Lab Immediately').should('be.visible');
      });
      
      // Lab notification
      cy.get('[data-testid="lab-notification"]').should('contain', 'Lab notified of STAT order');
    });
  });

  describe('Offline Capability', () => {
    it('should work offline and sync when online', () => {
      cy.loginAsPhlebotomist();
      
      // Go offline
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(false);
        win.dispatchEvent(new Event('offline'));
      });
      
      // Verify offline indicator
      cy.get('[data-testid="offline-indicator"]').should('be.visible');
      
      // Create offline order
      cy.visit('/offline/orders');
      cy.get('[data-testid="offline-order"]').click();
      cy.createPatient({
        firstName: 'Offline',
        lastName: 'Patient',
        dateOfBirth: '1980-01-01',
        gender: 'male',
        email: 'offline@test.com',
        phone: '(555) 999-9999'
      });
      
      // Verify saved locally
      cy.get('[data-testid="local-queue"]').should('contain', '1 pending sync');
      
      // Go back online
      cy.window().then((win) => {
        cy.stub(win.navigator, 'onLine').value(true);
        win.dispatchEvent(new Event('online'));
      });
      
      // Verify sync
      cy.get('[data-testid="sync-indicator"]').should('be.visible');
      cy.get('[data-testid="sync-status"]').should('contain', 'Syncing...');
      cy.get('[data-testid="sync-complete"]', { timeout: 10000 }).should('contain', 'All data synced');
    });
  });
});