describe('Sample Workflow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
  });

  describe('Sample Collection', () => {
    beforeEach(() => {
      cy.navigateToModule('Samples');
      cy.findByRole('button', { name: /new sample/i }).click();
    });

    it('creates a new sample with barcode generation', () => {
      // Select patient
      cy.findByLabelText(/patient/i).type('John Doe');
      cy.findByRole('option', { name: /john doe/i }).click();
      
      // Select test
      cy.findByLabelText(/test/i).select('Complete Blood Count');
      
      // Select sample type
      cy.findByLabelText(/sample type/i).select('Blood');
      
      // Select container
      cy.findByLabelText(/container/i).select('EDTA Tube');
      
      // Add collection notes
      cy.findByLabelText(/collection notes/i).type('Fasting sample');
      
      // Create sample
      cy.findByRole('button', { name: /create sample/i }).click();
      cy.wait('@createSample');
      
      // Verify barcode generated
      cy.findByTestId('sample-barcode').should('be.visible');
      cy.findByText(/sample created successfully/i).should('be.visible');
      
      // Print label
      cy.window().then((win) => {
        cy.stub(win, 'print');
      });
      cy.findByRole('button', { name: /print label/i }).click();
      cy.window().its('print').should('be.called');
    });

    it('validates sample creation requirements', () => {
      cy.findByRole('button', { name: /create sample/i }).click();
      
      cy.findByText(/patient is required/i).should('be.visible');
      cy.findByText(/test is required/i).should('be.visible');
      cy.findByText(/sample type is required/i).should('be.visible');
    });

    it('handles batch sample creation', () => {
      cy.findByRole('button', { name: /batch mode/i }).click();
      
      // Add multiple samples
      for (let i = 0; i < 3; i++) {
        cy.findByLabelText(/patient/i).type('Patient ' + i);
        cy.findByRole('option').first().click();
        cy.findByLabelText(/test/i).select('Complete Blood Count');
        cy.findByRole('button', { name: /add to batch/i }).click();
      }
      
      // Create all samples
      cy.findByRole('button', { name: /create all samples/i }).click();
      cy.wait('@createBatchSamples');
      
      cy.findByText(/3 samples created successfully/i).should('be.visible');
    });
  });

  describe('Sample Tracking', () => {
    beforeEach(() => {
      cy.navigateToModule('Sample Tracking');
    });

    it('tracks sample through workflow stages', () => {
      // Search for sample
      cy.findByPlaceholderText(/scan or enter barcode/i).type('S123456');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      // View sample details
      cy.findByTestId('sample-status').should('contain.text', 'Collected');
      
      // Update status
      cy.findByRole('button', { name: /update status/i }).click();
      cy.findByRole('combobox', { name: /new status/i }).select('In Transit');
      cy.findByRole('button', { name: /save/i }).click();
      cy.wait('@updateSampleStatus');
      
      cy.findByText(/status updated successfully/i).should('be.visible');
      cy.findByTestId('sample-status').should('contain.text', 'In Transit');
    });

    it('displays sample chain of custody', () => {
      cy.findByPlaceholderText(/scan or enter barcode/i).type('S123456');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      cy.findByRole('tab', { name: /chain of custody/i }).click();
      
      // Verify custody entries
      cy.findAllByTestId('custody-entry').should('have.length.at.least', 2);
      cy.findByText(/collected by/i).should('be.visible');
      cy.findByText(/received by/i).should('be.visible');
    });

    it('handles sample rejection', () => {
      cy.findByPlaceholderText(/scan or enter barcode/i).type('S123456');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      cy.findByRole('button', { name: /reject sample/i }).click();
      
      // Fill rejection form
      cy.findByRole('combobox', { name: /rejection reason/i }).select('Hemolyzed');
      cy.findByLabelText(/comments/i).type('Severe hemolysis observed');
      cy.findByRole('button', { name: /confirm rejection/i }).click();
      
      cy.wait('@rejectSample');
      cy.findByText(/sample rejected/i).should('be.visible');
      cy.findByTestId('sample-status').should('contain.text', 'Rejected');
    });
  });

  describe('Batch Processing', () => {
    beforeEach(() => {
      cy.navigateToModule('Sample Processing');
    });

    it('processes multiple samples in batch', () => {
      // Scan multiple samples
      const barcodes = ['S123456', 'S123457', 'S123458'];
      
      barcodes.forEach((barcode) => {
        cy.findByPlaceholderText(/scan barcode/i).type(barcode);
        cy.findByRole('button', { name: /add to batch/i }).click();
      });
      
      // Verify batch count
      cy.findByTestId('batch-count').should('contain.text', '3');
      
      // Process batch
      cy.findByRole('button', { name: /process batch/i }).click();
      cy.findByRole('combobox', { name: /action/i }).select('Mark as Received');
      cy.findByRole('button', { name: /apply to all/i }).click();
      
      cy.wait('@processBatch');
      cy.findByText(/3 samples processed successfully/i).should('be.visible');
    });

    it('routes samples to appropriate departments', () => {
      // Load samples for routing
      cy.findByRole('button', { name: /load pending samples/i }).click();
      cy.wait('@getPendingSamples');
      
      // Auto-route based on test type
      cy.findByRole('checkbox', { name: /auto-route/i }).check();
      cy.findByRole('button', { name: /route samples/i }).click();
      
      cy.wait('@routeSamples');
      
      // Verify routing
      cy.findByText(/chemistry: 5 samples/i).should('be.visible');
      cy.findByText(/hematology: 3 samples/i).should('be.visible');
      cy.findByText(/microbiology: 2 samples/i).should('be.visible');
    });
  });

  describe('Sample Storage', () => {
    beforeEach(() => {
      cy.navigateToModule('Sample Storage');
    });

    it('assigns storage location to sample', () => {
      cy.findByPlaceholderText(/scan sample barcode/i).type('S123456');
      cy.wait('@getSample');
      
      // Assign location
      cy.findByLabelText(/storage unit/i).select('Freezer A');
      cy.findByLabelText(/rack/i).select('R1');
      cy.findByLabelText(/box/i).select('B1');
      cy.findByLabelText(/position/i).type('A1');
      
      cy.findByRole('button', { name: /assign location/i }).click();
      cy.wait('@assignStorage');
      
      cy.findByText(/storage location assigned/i).should('be.visible');
      cy.findByText(/freezer a.*r1.*b1.*a1/i).should('be.visible');
    });

    it('tracks sample temperature', () => {
      cy.findByRole('tab', { name: /temperature log/i }).click();
      
      // Add temperature reading
      cy.findByRole('button', { name: /add reading/i }).click();
      cy.findByLabelText(/temperature/i).type('-20');
      cy.findByLabelText(/unit/i).select('Celsius');
      cy.findByRole('button', { name: /save/i }).click();
      
      cy.wait('@saveTemperature');
      cy.findByText(/temperature recorded/i).should('be.visible');
    });

    it('alerts on sample expiration', () => {
      cy.findByRole('tab', { name: /expiring samples/i }).click();
      cy.wait('@getExpiringSamples');
      
      // Should show samples expiring soon
      cy.findAllByTestId('expiring-sample').should('have.length.at.least', 1);
      cy.findByText(/expires in \d+ days/i).should('be.visible');
      
      // Dispose expired sample
      cy.findAllByRole('button', { name: /dispose/i }).first().click();
      cy.findByRole('combobox', { name: /disposal reason/i }).select('Expired');
      cy.findByRole('button', { name: /confirm disposal/i }).click();
      
      cy.wait('@disposeSample');
      cy.findByText(/sample disposed/i).should('be.visible');
    });
  });
});