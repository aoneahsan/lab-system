describe('Test Ordering', () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAsDoctor();
  });

  describe('Test Catalog', () => {
    it('should display test catalog', () => {
      cy.visit('/tests');
      cy.get('[data-testid="test-catalog"]').should('be.visible');
      cy.get('[data-testid="test-search"]').should('be.visible');
      cy.get('[data-testid="test-categories"]').should('be.visible');
    });

    it('should search for tests', () => {
      cy.visit('/tests');
      cy.get('[data-testid="test-search"]').type('CBC');
      cy.waitForSpinners();
      
      cy.get('[data-testid="test-results"]').within(() => {
        cy.contains('Complete Blood Count').should('be.visible');
        cy.contains('CBC with Differential').should('be.visible');
      });
    });

    it('should filter tests by category', () => {
      cy.visit('/tests');
      cy.get('[data-testid="category-hematology"]').click();
      cy.waitForSpinners();
      
      cy.get('[data-testid="test-results"]').within(() => {
        cy.get('[data-testid="test-item"]').should('have.length.greaterThan', 0);
        cy.contains('Hematology').should('be.visible');
      });
    });

    it('should view test details', () => {
      cy.visit('/tests');
      cy.get('[data-testid="test-item"]').first().click();
      
      cy.get('[data-testid="test-details-modal"]').should('be.visible');
      cy.contains('Test Information').should('be.visible');
      cy.contains('LOINC Code').should('be.visible');
      cy.contains('Specimen Requirements').should('be.visible');
      cy.contains('Turnaround Time').should('be.visible');
    });
  });

  describe('Creating Test Orders', () => {
    beforeEach(() => {
      // Create a test patient
      cy.createPatient({
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        email: 'test@example.com',
        phone: '(555) 123-4567'
      }).as('patientId');
    });

    it('should create a single test order', () => {
      cy.get('@patientId').then((patientId) => {
        cy.visit(`/patients/${patientId}`);
        cy.get('[data-testid="order-tests-button"]').click();
        
        // Search and select test
        cy.get('[data-testid="test-search"]').type('Glucose');
        cy.get('[data-testid="test-option-glucose"]').click();
        
        // Add clinical notes
        cy.get('[data-testid="clinical-notes"]').type('Routine checkup');
        
        // Set priority
        cy.get('[data-testid="priority-select"]').click();
        cy.get('[data-value="routine"]').click();
        
        // Submit order
        cy.get('[data-testid="submit-order"]').click();
        
        cy.contains('Test order created successfully').should('be.visible');
        cy.url().should('match', /\/orders\/[a-zA-Z0-9]+$/);
      });
    });

    it('should create a panel test order', () => {
      cy.get('@patientId').then((patientId) => {
        cy.visit(`/patients/${patientId}`);
        cy.get('[data-testid="order-tests-button"]').click();
        
        // Select panel
        cy.get('[data-testid="panels-tab"]').click();
        cy.get('[data-testid="panel-basic-metabolic"]').click();
        
        // Verify all tests in panel are selected
        cy.get('[data-testid="selected-tests"]').within(() => {
          cy.contains('Glucose').should('be.visible');
          cy.contains('Sodium').should('be.visible');
          cy.contains('Potassium').should('be.visible');
          cy.contains('Chloride').should('be.visible');
        });
        
        // Submit order
        cy.get('[data-testid="submit-order"]').click();
        
        cy.contains('Test order created successfully').should('be.visible');
      });
    });

    it('should create STAT order', () => {
      cy.get('@patientId').then((patientId) => {
        cy.visit(`/patients/${patientId}`);
        cy.get('[data-testid="order-tests-button"]').click();
        
        // Select test
        cy.get('[data-testid="test-search"]').type('Troponin');
        cy.get('[data-testid="test-option-troponin"]').click();
        
        // Set STAT priority
        cy.get('[data-testid="priority-select"]').click();
        cy.get('[data-value="stat"]').click();
        
        // Add critical notes
        cy.get('[data-testid="clinical-notes"]').type('Chest pain, rule out MI');
        
        // Submit order
        cy.get('[data-testid="submit-order"]').click();
        
        // Verify STAT indicator
        cy.get('[data-testid="order-priority"]').should('have.class', 'stat');
        cy.contains('STAT').should('be.visible');
      });
    });

    it('should handle fasting requirements', () => {
      cy.get('@patientId').then((patientId) => {
        cy.visit(`/patients/${patientId}`);
        cy.get('[data-testid="order-tests-button"]').click();
        
        // Select fasting test
        cy.get('[data-testid="test-search"]').type('Lipid Panel');
        cy.get('[data-testid="test-option-lipid-panel"]').click();
        
        // Verify fasting requirement warning
        cy.contains('Requires 12-hour fasting').should('be.visible');
        
        // Confirm fasting status
        cy.get('[data-testid="confirm-fasting"]').check();
        
        // Submit order
        cy.get('[data-testid="submit-order"]').click();
        
        cy.contains('Test order created successfully').should('be.visible');
      });
    });
  });

  describe('Managing Test Orders', () => {
    it('should view order list', () => {
      cy.visit('/orders');
      cy.get('[data-testid="orders-table"]').should('be.visible');
      cy.get('[data-testid="order-filters"]').should('be.visible');
    });

    it('should filter orders by status', () => {
      cy.visit('/orders');
      cy.get('[data-testid="status-filter"]').click();
      cy.get('[data-value="pending"]').click();
      
      cy.waitForSpinners();
      cy.get('[data-testid="order-status"]').each(($el) => {
        cy.wrap($el).should('contain', 'Pending');
      });
    });

    it('should view order details', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().click();
      
      cy.get('[data-testid="order-details"]').should('be.visible');
      cy.contains('Order Information').should('be.visible');
      cy.contains('Patient Information').should('be.visible');
      cy.contains('Ordered Tests').should('be.visible');
    });

    it('should cancel an order', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().within(() => {
        cy.get('[data-testid="order-actions"]').click();
      });
      cy.get('[data-testid="cancel-order"]').click();
      
      // Confirm cancellation
      cy.get('[data-testid="cancel-reason"]').type('Patient request');
      cy.get('[data-testid="confirm-cancel"]').click();
      
      cy.contains('Order cancelled successfully').should('be.visible');
    });

    it('should print order requisition', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="print-requisition"]').click();
      
      // Verify print dialog
      cy.window().its('print').should('be.called');
    });
  });

  describe('Sample Collection', () => {
    it('should generate barcode for order', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="generate-barcode"]').click();
      
      cy.get('[data-testid="barcode-display"]').should('be.visible');
      cy.get('[data-testid="print-barcode"]').should('be.visible');
    });

    it('should mark sample as collected', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="collect-sample"]').click();
      
      // Enter collection details
      cy.get('[data-testid="collected-by"]').type('John Doe');
      cy.get('[data-testid="collection-time"]').type('09:30');
      cy.get('[data-testid="collection-notes"]').type('No issues');
      
      cy.get('[data-testid="confirm-collection"]').click();
      
      cy.contains('Sample collected successfully').should('be.visible');
      cy.get('[data-testid="order-status"]').should('contain', 'Collected');
    });
  });

  describe('Order Tracking', () => {
    it('should track order status changes', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().click();
      cy.get('[data-testid="order-timeline"]').should('be.visible');
      
      // Verify timeline entries
      cy.get('[data-testid="timeline-entry"]').should('have.length.greaterThan', 0);
      cy.contains('Order Created').should('be.visible');
    });

    it('should show turnaround time', () => {
      cy.visit('/orders');
      cy.get('[data-testid="order-row"]').first().within(() => {
        cy.get('[data-testid="tat-indicator"]').should('be.visible');
      });
    });
  });
});