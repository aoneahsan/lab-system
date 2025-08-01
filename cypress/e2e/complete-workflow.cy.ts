describe('Complete Lab Workflow', () => {
  // Test data
  const patient = {
    firstName: 'John',
    lastName: 'Doe',
    dateOfBirth: '1980-01-15',
    gender: 'male',
    email: 'john.doe@example.com',
    phone: '+1234567890',
    address: {
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
    },
    insuranceProvider: 'Blue Cross',
    insurancePolicyNumber: 'BC123456',
  };

  const testOrder = {
    tests: ['Complete Blood Count', 'Basic Metabolic Panel', 'Lipid Panel'],
    priority: 'routine',
    clinicalNotes: 'Annual checkup',
    fastingRequired: true,
  };

  beforeEach(() => {
    // Login as lab technician
    cy.visit('/');
    cy.get('input[name="email"]').type(Cypress.env('TEST_EMAIL'));
    cy.get('input[name="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').click();
    cy.url().should('include', '/dashboard');
  });

  describe('Patient Registration', () => {
    it('should register a new patient', () => {
      // Navigate to patients
      cy.get('[data-testid="nav-patients"]').click();
      cy.get('[data-testid="add-patient-button"]').click();

      // Fill patient form
      cy.get('input[name="firstName"]').type(patient.firstName);
      cy.get('input[name="lastName"]').type(patient.lastName);
      cy.get('input[name="dateOfBirth"]').type(patient.dateOfBirth);
      cy.get('select[name="gender"]').select(patient.gender);
      cy.get('input[name="email"]').type(patient.email);
      cy.get('input[name="phone"]').type(patient.phone);
      
      // Address
      cy.get('input[name="address.street"]').type(patient.address.street);
      cy.get('input[name="address.city"]').type(patient.address.city);
      cy.get('input[name="address.state"]').type(patient.address.state);
      cy.get('input[name="address.zipCode"]').type(patient.address.zipCode);
      
      // Insurance
      cy.get('input[name="insuranceProvider"]').type(patient.insuranceProvider);
      cy.get('input[name="insurancePolicyNumber"]').type(patient.insurancePolicyNumber);

      // Submit
      cy.get('button[type="submit"]').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Patient registered successfully');
      cy.get('[data-testid="patient-list"]').should('contain', patient.firstName);
      cy.get('[data-testid="patient-list"]').should('contain', patient.lastName);
    });
  });

  describe('Test Order Creation', () => {
    it('should create a test order for the patient', () => {
      // Navigate to patients and find the created patient
      cy.get('[data-testid="nav-patients"]').click();
      cy.get('[data-testid="patient-list"]')
        .contains(`${patient.firstName} ${patient.lastName}`)
        .parent()
        .find('[data-testid="view-patient-button"]')
        .click();

      // Create new order
      cy.get('[data-testid="create-order-button"]').click();

      // Select tests
      testOrder.tests.forEach(test => {
        cy.get('[data-testid="test-search"]').type(test);
        cy.get('[data-testid="test-results"]')
          .contains(test)
          .parent()
          .find('[data-testid="add-test-button"]')
          .click();
      });

      // Set priority and notes
      cy.get('select[name="priority"]').select(testOrder.priority);
      cy.get('textarea[name="clinicalNotes"]').type(testOrder.clinicalNotes);
      cy.get('input[name="fastingRequired"]').check();

      // Submit order
      cy.get('[data-testid="submit-order-button"]').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Order created successfully');
      cy.get('[data-testid="order-number"]').should('be.visible');
    });
  });

  describe('Sample Collection', () => {
    it('should collect samples for the order', () => {
      // Navigate to samples
      cy.get('[data-testid="nav-samples"]').click();
      cy.get('[data-testid="pending-collections"]').should('be.visible');

      // Find the order
      cy.get('[data-testid="pending-collection-list"]')
        .contains(patient.lastName)
        .parent()
        .find('[data-testid="collect-sample-button"]')
        .click();

      // Sample collection form
      cy.get('[data-testid="collection-modal"]').should('be.visible');
      
      // Scan/enter barcode
      cy.get('input[name="barcode"]').type('BC123456789');
      
      // Select collection site
      cy.get('select[name="collectionSite"]').select('Antecubital vein');
      
      // Add collection notes
      cy.get('textarea[name="collectionNotes"]').type('Patient fasted for 12 hours');

      // Submit collection
      cy.get('[data-testid="confirm-collection-button"]').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Sample collected successfully');
      cy.get('[data-testid="collected-samples"]').should('contain', 'BC123456789');
    });
  });

  describe('Result Entry', () => {
    it('should enter test results', () => {
      // Navigate to results
      cy.get('[data-testid="nav-results"]').click();
      cy.get('[data-testid="pending-results"]').should('be.visible');

      // Find the sample
      cy.get('[data-testid="pending-results-list"]')
        .contains('BC123456789')
        .parent()
        .find('[data-testid="enter-results-button"]')
        .click();

      // Enter results for each test
      cy.get('[data-testid="result-entry-form"]').should('be.visible');

      // CBC results
      cy.get('[data-testid="test-section-cbc"]').within(() => {
        cy.get('input[name="wbc"]').type('7.5');
        cy.get('input[name="rbc"]').type('4.8');
        cy.get('input[name="hemoglobin"]').type('14.5');
        cy.get('input[name="hematocrit"]').type('42');
        cy.get('input[name="platelets"]').type('250');
      });

      // BMP results
      cy.get('[data-testid="test-section-bmp"]').within(() => {
        cy.get('input[name="glucose"]').type('95');
        cy.get('input[name="sodium"]').type('140');
        cy.get('input[name="potassium"]').type('4.0');
        cy.get('input[name="chloride"]').type('102');
        cy.get('input[name="co2"]').type('24');
        cy.get('input[name="bun"]').type('15');
        cy.get('input[name="creatinine"]').type('1.0');
      });

      // Lipid Panel results
      cy.get('[data-testid="test-section-lipid"]').within(() => {
        cy.get('input[name="totalCholesterol"]').type('180');
        cy.get('input[name="ldl"]').type('100');
        cy.get('input[name="hdl"]').type('60');
        cy.get('input[name="triglycerides"]').type('100');
      });

      // Submit results
      cy.get('[data-testid="submit-results-button"]').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Results entered successfully');
    });
  });

  describe('Result Verification', () => {
    it('should verify entered results', () => {
      // Navigate to results for verification
      cy.get('[data-testid="nav-results"]').click();
      cy.get('[data-testid="pending-verification"]').click();

      // Find the results
      cy.get('[data-testid="verification-list"]')
        .contains('BC123456789')
        .parent()
        .find('[data-testid="verify-results-button"]')
        .click();

      // Review results
      cy.get('[data-testid="result-review-modal"]').should('be.visible');
      
      // Check for any flags
      cy.get('[data-testid="result-flags"]').should('not.exist');
      
      // Add verification comment
      cy.get('textarea[name="verificationComment"]').type('All results within normal limits');

      // Verify results
      cy.get('[data-testid="confirm-verification-button"]').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Results verified successfully');
    });
  });

  describe('Report Generation', () => {
    it('should generate patient report', () => {
      // Navigate to reports
      cy.get('[data-testid="nav-reports"]').click();
      cy.get('[data-testid="generate-report-button"]').click();

      // Select report type
      cy.get('select[name="reportType"]').select('Patient Results Report');
      
      // Search for patient
      cy.get('input[name="patientSearch"]').type(patient.lastName);
      cy.get('[data-testid="patient-suggestions"]')
        .contains(`${patient.firstName} ${patient.lastName}`)
        .click();

      // Select date range
      cy.get('input[name="startDate"]').type('2025-01-01');
      cy.get('input[name="endDate"]').type('2025-01-31');

      // Generate report
      cy.get('[data-testid="generate-button"]').click();

      // Wait for report generation
      cy.get('[data-testid="report-status"]').should('contain', 'Generating...');
      cy.get('[data-testid="report-status"]', { timeout: 30000 }).should('contain', 'Complete');

      // Download report
      cy.get('[data-testid="download-report-button"]').click();
      
      // Verify download
      cy.readFile('cypress/downloads/patient-report.pdf').should('exist');
    });
  });

  describe('Billing Process', () => {
    it('should create and process invoice', () => {
      // Navigate to billing
      cy.get('[data-testid="nav-billing"]').click();
      cy.get('[data-testid="create-invoice-button"]').click();

      // Search for patient
      cy.get('input[name="patientSearch"]').type(patient.lastName);
      cy.get('[data-testid="patient-suggestions"]')
        .contains(`${patient.firstName} ${patient.lastName}`)
        .click();

      // Select order
      cy.get('[data-testid="order-list"]')
        .first()
        .find('[data-testid="select-order-checkbox"]')
        .check();

      // Review invoice details
      cy.get('[data-testid="invoice-subtotal"]').should('be.visible');
      cy.get('[data-testid="invoice-tax"]').should('be.visible');
      cy.get('[data-testid="invoice-total"]').should('be.visible');

      // Apply insurance
      cy.get('input[name="applyInsurance"]').check();
      cy.get('[data-testid="insurance-coverage"]').should('contain', '80%');

      // Generate invoice
      cy.get('[data-testid="generate-invoice-button"]').click();

      // Verify success
      cy.get('[role="alert"]').should('contain', 'Invoice created successfully');
      cy.get('[data-testid="invoice-number"]').should('be.visible');

      // Process payment
      cy.get('[data-testid="process-payment-button"]').click();
      cy.get('select[name="paymentMethod"]').select('credit_card');
      cy.get('input[name="amount"]').should('have.value', cy.get('[data-testid="patient-responsibility"]').text());
      cy.get('[data-testid="submit-payment-button"]').click();

      // Verify payment success
      cy.get('[role="alert"]').should('contain', 'Payment processed successfully');
      cy.get('[data-testid="invoice-status"]').should('contain', 'Paid');
    });
  });

  describe('Quality Control', () => {
    it('should run QC tests', () => {
      // Navigate to QC
      cy.get('[data-testid="nav-quality-control"]').click();
      cy.get('[data-testid="run-qc-button"]').click();

      // Select instrument and tests
      cy.get('select[name="instrument"]').select('Chemistry Analyzer 1');
      cy.get('input[name="qcTests"][value="glucose"]').check();
      cy.get('input[name="qcTests"][value="creatinine"]').check();

      // Enter QC values
      cy.get('[data-testid="qc-level-1"]').within(() => {
        cy.get('input[name="glucose"]').type('95');
        cy.get('input[name="creatinine"]').type('1.0');
      });

      cy.get('[data-testid="qc-level-2"]').within(() => {
        cy.get('input[name="glucose"]').type('250');
        cy.get('input[name="creatinine"]').type('5.0');
      });

      // Submit QC
      cy.get('[data-testid="submit-qc-button"]').click();

      // Verify QC results
      cy.get('[data-testid="qc-status"]').should('contain', 'Passed');
      cy.get('[role="alert"]').should('contain', 'QC run completed successfully');
    });
  });
});