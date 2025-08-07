describe('Billing and Insurance Workflow', () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAsAdmin();
  });

  describe('Insurance Verification', () => {
    it('should verify insurance eligibility', () => {
      cy.visit('/billing/insurance-verification');
      
      // Enter patient information
      cy.get('[data-testid="patient-search"]').type('John Doe');
      cy.get('[data-testid="patient-option"]').first().click();
      
      // Verify insurance
      cy.get('[data-testid="verify-insurance"]').click();
      cy.waitForSpinners();
      
      // Check verification results
      cy.get('[data-testid="insurance-status"]').should('contain', 'Active');
      cy.get('[data-testid="coverage-details"]').should('be.visible');
      cy.contains('Deductible').should('be.visible');
      cy.contains('Co-pay').should('be.visible');
    });

    it('should handle insurance pre-authorization', () => {
      cy.visit('/billing/pre-authorization');
      
      // Select patient and tests
      cy.searchPatient('Jane Smith');
      cy.get('[data-testid="test-select"]').click();
      cy.get('[data-value="mri-brain"]').click();
      
      // Submit pre-auth request
      cy.get('[data-testid="diagnosis-code"]').type('G43.909');
      cy.get('[data-testid="clinical-notes"]').type('Chronic migraines');
      cy.get('[data-testid="submit-preauth"]').click();
      
      cy.contains('Pre-authorization submitted').should('be.visible');
      cy.get('[data-testid="auth-number"]').should('be.visible');
    });
  });

  describe('Billing Creation', () => {
    it('should create bill from completed tests', () => {
      cy.visit('/billing/create');
      
      // Select completed tests
      cy.get('[data-testid="unbilled-tests"]').within(() => {
        cy.get('[data-testid="test-checkbox"]').first().check();
        cy.get('[data-testid="test-checkbox"]').eq(1).check();
      });
      
      // Review charges
      cy.get('[data-testid="review-charges"]').click();
      cy.get('[data-testid="charge-summary"]').should('be.visible');
      
      // Apply insurance
      cy.get('[data-testid="apply-insurance"]').check();
      cy.get('[data-testid="insurance-select"]').select('Blue Cross');
      
      // Generate bill
      cy.get('[data-testid="generate-bill"]').click();
      cy.contains('Bill generated successfully').should('be.visible');
    });

    it('should handle manual charge entry', () => {
      cy.visit('/billing/manual-entry');
      
      // Add manual charges
      cy.get('[data-testid="add-charge"]').click();
      cy.get('[data-testid="cpt-code"]').type('80053');
      cy.get('[data-testid="charge-description"]').should('have.value', 'Comprehensive Metabolic Panel');
      cy.get('[data-testid="charge-amount"]').should('have.value', '45.00');
      
      // Add modifier if needed
      cy.get('[data-testid="add-modifier"]').click();
      cy.get('[data-testid="modifier-code"]').type('91');
      
      cy.get('[data-testid="save-charge"]').click();
      cy.contains('Charge added').should('be.visible');
    });
  });

  describe('Payment Processing', () => {
    it('should process patient payment', () => {
      cy.visit('/billing/payments');
      
      // Search for bill
      cy.get('[data-testid="bill-search"]').type('INV-2024-001');
      cy.get('[data-testid="bill-result"]').first().click();
      
      // Enter payment
      cy.get('[data-testid="payment-amount"]').type('150.00');
      cy.get('[data-testid="payment-method"]').select('Credit Card');
      cy.get('[data-testid="card-last-four"]').type('1234');
      
      // Process payment
      cy.get('[data-testid="process-payment"]').click();
      cy.contains('Payment processed successfully').should('be.visible');
      
      // Verify balance
      cy.get('[data-testid="remaining-balance"]').should('contain', '$0.00');
    });

    it('should handle insurance claim submission', () => {
      cy.visit('/billing/claims');
      
      // Select bills for claim
      cy.get('[data-testid="claimable-bills"]').within(() => {
        cy.get('[data-testid="bill-checkbox"]').first().check();
      });
      
      // Verify claim information
      cy.get('[data-testid="create-claim"]').click();
      cy.get('[data-testid="claim-form"]').should('be.visible');
      
      // Submit claim
      cy.get('[data-testid="submit-claim"]').click();
      cy.contains('Claim submitted to insurance').should('be.visible');
      cy.get('[data-testid="claim-number"]').should('be.visible');
    });

    it('should track claim status', () => {
      cy.visit('/billing/claims/tracking');
      
      // Filter by status
      cy.get('[data-testid="status-filter"]').select('Pending');
      cy.waitForSpinners();
      
      // Update claim status
      cy.get('[data-testid="claim-row"]').first().click();
      cy.get('[data-testid="update-status"]').click();
      cy.get('[data-testid="new-status"]').select('Paid');
      cy.get('[data-testid="payment-amount"]').type('380.00');
      cy.get('[data-testid="check-number"]').type('CHK123456');
      
      cy.get('[data-testid="save-status"]').click();
      cy.contains('Claim status updated').should('be.visible');
    });
  });

  describe('Financial Reports', () => {
    it('should generate daily revenue report', () => {
      cy.visit('/billing/reports');
      
      // Select report type
      cy.get('[data-testid="report-type"]').select('Daily Revenue');
      cy.get('[data-testid="report-date"]').type('2024-01-15');
      
      // Generate report
      cy.get('[data-testid="generate-report"]').click();
      cy.waitForSpinners();
      
      // Verify report content
      cy.get('[data-testid="report-content"]').within(() => {
        cy.contains('Total Revenue').should('be.visible');
        cy.contains('Cash Payments').should('be.visible');
        cy.contains('Insurance Payments').should('be.visible');
        cy.contains('Outstanding Balance').should('be.visible');
      });
    });

    it('should export billing data', () => {
      cy.visit('/billing/export');
      
      // Configure export
      cy.get('[data-testid="date-range-start"]').type('2024-01-01');
      cy.get('[data-testid="date-range-end"]').type('2024-01-31');
      cy.get('[data-testid="export-format"]').select('CSV');
      
      // Export data
      cy.get('[data-testid="export-billing"]').click();
      
      // Verify download
      cy.readFile('cypress/downloads/billing-export-2024-01.csv').should('exist');
    });
  });

  describe('Patient Statements', () => {
    it('should generate patient statement', () => {
      cy.visit('/billing/statements');
      
      // Select patient
      cy.searchPatient('John Doe');
      
      // Configure statement
      cy.get('[data-testid="statement-period"]').select('Last 30 days');
      cy.get('[data-testid="include-paid"]').check();
      
      // Generate statement
      cy.get('[data-testid="generate-statement"]').click();
      cy.get('[data-testid="statement-preview"]').should('be.visible');
      
      // Send statement
      cy.get('[data-testid="send-method"]').select('Email');
      cy.get('[data-testid="send-statement"]').click();
      cy.contains('Statement sent successfully').should('be.visible');
    });
  });
});