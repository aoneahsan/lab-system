describe('Sample Collection and Tracking', () => {
  beforeEach(() => {
    cy.interceptAPI();
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
  });

  it('should complete full sample workflow', () => {
    // Step 1: Navigate to sample collection
    cy.visit('/samples/new');
    cy.contains('New Sample Collection').should('be.visible');

    // Step 2: Select patient
    cy.get('[data-cy=patient-search]').type('John Doe');
    cy.get('[data-cy=patient-suggestion]').first().click();
    cy.get('[data-cy=selected-patient]').should('contain', 'John Doe');

    // Step 3: Select tests
    cy.get('[data-cy=test-search]').type('CBC');
    cy.get('[data-cy=test-option]').contains('Complete Blood Count').click();
    cy.get('[data-cy=selected-tests]').should('contain', 'Complete Blood Count');

    // Add another test
    cy.get('[data-cy=test-search]').clear().type('Lipid');
    cy.get('[data-cy=test-option]').contains('Lipid Panel').click();
    cy.get('[data-cy=selected-tests]').should('contain', 'Lipid Panel');

    // Step 4: Fill collection details
    cy.fillForm({
      collectionDate: '2024-01-20',
      collectionTime: '09:00',
      sampleType: 'Blood',
      priority: 'routine',
      fastingStatus: 'fasting',
      notes: 'Patient fasted for 12 hours'
    });

    // Step 5: Generate barcode
    cy.get('[data-cy=generate-barcode]').click();
    cy.get('[data-cy=barcode-display]').should('be.visible');
    cy.get('[data-cy=barcode-number]').should('match', /LAB-\d{4}-\d{6}/);

    // Step 6: Submit sample
    cy.get('[data-cy=submit-sample]').click();
    cy.wait('@createSample');
    cy.expectSuccessToast('Sample created successfully');

    // Step 7: Verify sample in list
    cy.visit('/samples');
    cy.get('[data-cy=sample-table]').should('contain', 'John Doe');
    cy.get('[data-cy=sample-table]').should('contain', 'Pending');
  });

  it('should scan barcode for sample tracking', () => {
    cy.visit('/samples/scan');
    
    // Simulate barcode scan
    cy.get('[data-cy=barcode-input]').type('LAB-2024-000123{enter}');
    cy.wait('@getSample');

    // Verify sample details loaded
    cy.contains('Sample Details').should('be.visible');
    cy.contains('John Doe').should('be.visible');
    cy.contains('Complete Blood Count').should('be.visible');
  });

  it('should update sample status', () => {
    cy.visit('/samples');
    cy.get('[data-cy=sample-table] tbody tr').first().click();

    // Update status to processing
    cy.get('[data-cy=status-select]').select('Processing');
    cy.get('[data-cy=update-status]').click();
    cy.wait('@updateSample');

    cy.expectSuccessToast('Sample status updated');
    cy.contains('Processing').should('be.visible');
  });

  it('should handle batch sample creation', () => {
    cy.visit('/samples/batch');

    // Select multiple patients
    cy.get('[data-cy=select-all-patients]').check();
    cy.get('[data-cy=selected-count]').should('contain', '5 patients selected');

    // Select test
    cy.get('[data-cy=test-search]').type('Glucose');
    cy.get('[data-cy=test-option]').contains('Fasting Glucose').click();

    // Set collection details
    cy.fillForm({
      collectionDate: '2024-01-20',
      sampleType: 'Blood',
      priority: 'routine'
    });

    // Generate barcodes for all
    cy.get('[data-cy=generate-all-barcodes]').click();
    cy.get('[data-cy=barcode-list]').find('.barcode-item').should('have.length', 5);

    // Submit batch
    cy.get('[data-cy=submit-batch]').click();
    cy.wait('@createBatchSamples');
    
    cy.expectSuccessToast('5 samples created successfully');
  });

  it('should track sample chain of custody', () => {
    cy.visit('/samples');
    cy.get('[data-cy=sample-table] tbody tr').first().click();
    cy.get('[data-cy=chain-of-custody-tab]').click();

    // View custody log
    cy.get('[data-cy=custody-log]').within(() => {
      cy.contains('Sample Created').should('be.visible');
      cy.contains('Collected by').should('be.visible');
      cy.contains('Received in Lab').should('be.visible');
    });

    // Add custody transfer
    cy.get('[data-cy=add-transfer]').click();
    cy.fillForm({
      transferTo: 'Lab Tech 2',
      reason: 'Processing',
      notes: 'Transferred for analysis'
    });
    cy.get('[data-cy=confirm-transfer]').click();

    cy.expectSuccessToast('Transfer recorded');
  });

  it('should handle sample rejection', () => {
    cy.visit('/samples');
    cy.get('[data-cy=sample-table] tbody tr').first().within(() => {
      cy.get('[data-cy=sample-actions]').click();
    });
    cy.contains('Reject Sample').click();

    // Fill rejection form
    cy.fillForm({
      rejectionReason: 'insufficient_volume',
      notes: 'Sample volume less than 2ml required'
    });

    cy.get('[data-cy=confirm-rejection]').click();
    cy.wait('@rejectSample');

    cy.expectSuccessToast('Sample rejected');
    cy.get('[data-cy=sample-table]').should('contain', 'Rejected');
  });

  it('should print sample labels', () => {
    cy.visit('/samples');
    cy.get('[data-cy=sample-table] tbody tr').first().within(() => {
      cy.get('[data-cy=sample-checkbox]').check();
    });

    cy.get('[data-cy=bulk-actions]').click();
    cy.contains('Print Labels').click();

    // Verify print preview
    cy.get('[data-cy=print-preview]').should('be.visible');
    cy.get('[data-cy=label-preview]').should('have.length.greaterThan', 0);
    
    cy.get('[data-cy=print-labels]').click();
    cy.window().its('print').should('be.called');
  });

  it('should track sample storage location', () => {
    cy.visit('/samples');
    cy.get('[data-cy=sample-table] tbody tr').first().click();

    // Update storage location
    cy.get('[data-cy=storage-location]').click();
    cy.fillForm({
      storageType: 'refrigerator',
      location: 'R1-S3-B2',
      temperature: '4'
    });

    cy.get('[data-cy=save-location]').click();
    cy.expectSuccessToast('Storage location updated');
  });

  it('should handle STAT priority samples', () => {
    cy.visit('/samples/new');
    
    // Create STAT sample
    cy.get('[data-cy=patient-search]').type('Jane Smith');
    cy.get('[data-cy=patient-suggestion]').first().click();
    cy.get('[data-cy=test-search]').type('Troponin');
    cy.get('[data-cy=test-option]').first().click();
    
    cy.get('[data-cy=priority-stat]').click();
    cy.get('[data-cy=stat-reason]').type('Chest pain, rule out MI');

    cy.get('[data-cy=submit-sample]').click();

    // Verify STAT handling
    cy.expectSuccessToast('STAT sample created');
    cy.get('[data-cy=stat-notification]').should('be.visible');
  });

  it('should validate sample collection requirements', () => {
    cy.visit('/samples/new');
    
    // Select test with specific requirements
    cy.get('[data-cy=patient-search]').type('John');
    cy.get('[data-cy=patient-suggestion]').first().click();
    cy.get('[data-cy=test-search]').type('Glucose');
    cy.get('[data-cy=test-option]').contains('Fasting Glucose').click();

    // Verify requirements shown
    cy.contains('Fasting required: 8-12 hours').should('be.visible');
    
    // Try to submit without confirming fasting
    cy.get('[data-cy=submit-sample]').click();
    cy.contains('Please confirm fasting status').should('be.visible');

    // Confirm and submit
    cy.get('[data-cy=fasting-confirmed]').check();
    cy.get('[data-cy=submit-sample]').click();
    cy.wait('@createSample');
    cy.expectSuccessToast();
  });
});