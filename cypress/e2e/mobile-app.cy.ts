describe('Mobile App Experience', () => {
  beforeEach(() => {
    cy.interceptAPI();
    cy.setMobileViewport();
  });

  describe('Patient Mobile App', () => {
    beforeEach(() => {
      cy.login('patient@example.com', 'PatientPass123!');
      cy.visit('/patient');
    });

    it('should display patient dashboard', () => {
      cy.contains('My Health').should('be.visible');
      cy.get('[data-cy=upcoming-tests]').should('be.visible');
      cy.get('[data-cy=recent-results]').should('be.visible');
      cy.get('[data-cy=health-summary]').should('be.visible');
    });

    it('should view test results', () => {
      cy.get('[data-cy=bottom-nav-results]').click();
      cy.url().should('include', '/patient/results');

      // View specific result
      cy.get('[data-cy=result-card]').first().click();
      cy.contains('Test Details').should('be.visible');
      cy.get('[data-cy=result-values]').should('be.visible');
      cy.get('[data-cy=reference-ranges]').should('be.visible');
    });

    it('should download result PDF', () => {
      cy.get('[data-cy=bottom-nav-results]').click();
      cy.get('[data-cy=result-card]').first().click();
      cy.get('[data-cy=download-pdf]').click();
      
      // Verify download started
      cy.readFile('cypress/downloads/lab-result.pdf').should('exist');
    });

    it('should book appointment', () => {
      cy.get('[data-cy=bottom-nav-appointments]').click();
      cy.get('[data-cy=book-appointment]').click();

      // Select test type
      cy.get('[data-cy=test-category]').select('Routine Blood Work');
      cy.get('[data-cy=preferred-date]').type('2024-02-01');
      cy.get('[data-cy=preferred-time]').select('09:00 AM');
      cy.get('[data-cy=location]').select('Main Lab');

      cy.get('[data-cy=submit-appointment]').click();
      cy.expectSuccessToast('Appointment requested');
    });

    it('should update profile and preferences', () => {
      cy.get('[data-cy=bottom-nav-profile]').click();
      cy.get('[data-cy=notification-preferences]').click();

      // Update preferences
      cy.get('[data-cy=email-notifications]').check();
      cy.get('[data-cy=sms-notifications]').uncheck();
      cy.get('[data-cy=result-notifications]').check();

      cy.get('[data-cy=save-preferences]').click();
      cy.expectSuccessToast('Preferences updated');
    });
  });

  describe('Phlebotomist Mobile App', () => {
    beforeEach(() => {
      cy.login('phlebotomist@labflow.com', 'PhlebPass123!');
      cy.visit('/phlebotomist');
    });

    it('should view daily schedule', () => {
      cy.contains('Today\'s Schedule').should('be.visible');
      cy.get('[data-cy=collection-list]').should('be.visible');
      cy.get('[data-cy=pending-count]').should('be.visible');
    });

    it('should perform sample collection', () => {
      cy.get('[data-cy=collection-card]').first().click();
      
      // Verify patient identity
      cy.get('[data-cy=verify-patient]').click();
      cy.get('[data-cy=patient-id-check]').check();
      cy.get('[data-cy=patient-dob-check]').check();
      cy.get('[data-cy=confirm-identity]').click();

      // Scan barcode
      cy.get('[data-cy=scan-barcode]').click();
      cy.get('[data-cy=barcode-input]').type('LAB-2024-001234{enter}');

      // Complete collection
      cy.get('[data-cy=collection-notes]').type('No issues, patient cooperative');
      cy.get('[data-cy=complete-collection]').click();
      
      cy.expectSuccessToast('Collection completed');
    });

    it('should handle home collection', () => {
      cy.get('[data-cy=bottom-nav-routes]').click();
      cy.get('[data-cy=route-map]').should('be.visible');
      
      // Start navigation
      cy.get('[data-cy=collection-stop]').first().click();
      cy.get('[data-cy=navigate]').click();
      
      // Arrive at location
      cy.get('[data-cy=mark-arrived]').click();
      cy.get('[data-cy=arrival-time]').should('be.visible');

      // Complete collection
      cy.get('[data-cy=start-collection]').click();
      // ... collection steps
      cy.get('[data-cy=mark-completed]').click();
    });

    it('should manage sample storage', () => {
      cy.get('[data-cy=collection-card]').first().click();
      cy.get('[data-cy=complete-collection]').click();
      
      // Add to cooler
      cy.get('[data-cy=add-to-cooler]').click();
      cy.get('[data-cy=cooler-id]').select('Cooler-01');
      cy.get('[data-cy=temperature-check]').type('4.5');
      cy.get('[data-cy=confirm-storage]').click();

      cy.expectSuccessToast('Sample added to cooler');
    });
  });

  describe('Lab Staff Mobile App', () => {
    beforeEach(() => {
      cy.login('labtech@labflow.com', 'LabTech123!');
      cy.visit('/lab-staff');
    });

    it('should process incoming samples', () => {
      cy.get('[data-cy=bottom-nav-samples]').click();
      
      // Scan sample
      cy.get('[data-cy=scan-sample]').click();
      cy.get('[data-cy=barcode-scanner]').type('LAB-2024-001234{enter}');

      // Verify sample details
      cy.contains('Sample Details').should('be.visible');
      cy.get('[data-cy=accept-sample]').click();
      
      // Assign to analyzer
      cy.get('[data-cy=analyzer-select]').select('Analyzer-01');
      cy.get('[data-cy=load-position]').type('A12');
      cy.get('[data-cy=confirm-load]').click();

      cy.expectSuccessToast('Sample loaded');
    });

    it('should handle QC runs', () => {
      cy.get('[data-cy=bottom-nav-qc]').click();
      cy.get('[data-cy=start-qc]').click();

      // Select QC material
      cy.get('[data-cy=qc-material]').select('Level 1 Control');
      cy.get('[data-cy=lot-number]').type('QC-2024-001');
      
      // Enter QC results
      cy.fillForm({
        'glucose': '95.5',
        'cholesterol': '185',
        'triglycerides': '142'
      });

      cy.get('[data-cy=submit-qc]').click();
      cy.expectSuccessToast('QC results recorded');

      // Check if within range
      cy.get('[data-cy=qc-status]').should('contain', 'Pass');
    });

    it('should view workload dashboard', () => {
      cy.contains('Workload Overview').should('be.visible');
      cy.get('[data-cy=pending-samples]').should('be.visible');
      cy.get('[data-cy=in-progress]').should('be.visible');
      cy.get('[data-cy=completed-today]').should('be.visible');
    });
  });

  describe('Clinician Mobile App', () => {
    beforeEach(() => {
      cy.login('doctor@labflow.com', 'Doctor123!');
      cy.visit('/clinician');
    });

    it('should view patient results', () => {
      cy.get('[data-cy=bottom-nav-patients]').click();
      cy.get('[data-cy=patient-search]').type('John Doe');
      cy.get('[data-cy=patient-card]').first().click();

      // View lab results
      cy.get('[data-cy=lab-results-tab]').click();
      cy.get('[data-cy=result-timeline]').should('be.visible');
      cy.get('[data-cy=result-entry]').first().click();

      // View detailed results
      cy.contains('Test Results').should('be.visible');
      cy.get('[data-cy=result-chart]').should('be.visible');
    });

    it('should order new tests', () => {
      cy.get('[data-cy=bottom-nav-orders]').click();
      cy.get('[data-cy=new-order]').click();

      // Select patient
      cy.get('[data-cy=patient-search]').type('Jane');
      cy.get('[data-cy=patient-option]').first().click();

      // Select tests
      cy.get('[data-cy=test-search]').type('CBC');
      cy.get('[data-cy=test-checkbox]').first().check();
      
      // Add clinical notes
      cy.get('[data-cy=clinical-notes]').type('Annual checkup, patient reports fatigue');
      cy.get('[data-cy=priority]').select('Routine');

      cy.get('[data-cy=submit-order]').click();
      cy.expectSuccessToast('Order submitted');
    });

    it('should handle critical results', () => {
      cy.get('[data-cy=critical-alert]').should('be.visible');
      cy.get('[data-cy=critical-alert]').click();

      // View critical result
      cy.contains('Critical Result').should('be.visible');
      cy.contains('Immediate attention required').should('be.visible');

      // Acknowledge result
      cy.get('[data-cy=acknowledge-critical]').click();
      cy.get('[data-cy=action-taken]').type('Patient contacted, admitted for treatment');
      cy.get('[data-cy=submit-acknowledgment]').click();

      cy.expectSuccessToast('Critical result acknowledged');
    });
  });

  it('should handle offline mode', () => {
    // Simulate offline
    cy.window().then(win => {
      cy.stub(win.navigator, 'onLine').value(false);
    });

    cy.visit('/patient');
    cy.get('[data-cy=offline-indicator]').should('be.visible');
    cy.contains('Offline Mode').should('be.visible');

    // Verify cached data available
    cy.get('[data-cy=cached-results]').should('be.visible');
    
    // Try to perform action
    cy.get('[data-cy=book-appointment]').click();
    cy.contains('This action will be synced when online').should('be.visible');
  });

  it('should support biometric authentication', () => {
    cy.visit('/login');
    cy.setMobileViewport();

    // Check for biometric option
    cy.get('[data-cy=biometric-login]').should('be.visible');
    cy.get('[data-cy=biometric-login]').click();

    // Mock biometric success
    cy.window().then(win => {
      win.mockBiometricAuth = { success: true };
    });

    cy.expectSuccessToast('Authenticated successfully');
    cy.url().should('include', '/patient');
  });
});