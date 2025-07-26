describe('Result Entry and Validation', () => {
  beforeEach(() => {
    cy.interceptAPI();
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
  });

  it('should enter and validate test results', () => {
    // Navigate to pending results
    cy.visit('/results');
    cy.get('[data-cy=filter-pending]').click();
    
    // Select first pending sample
    cy.get('[data-cy=result-table] tbody tr').first().click();
    cy.url().should('match', /\/results\/[a-zA-Z0-9-]+$/);

    // Verify sample information
    cy.contains('Result Entry').should('be.visible');
    cy.contains('Complete Blood Count').should('be.visible');
    
    // Enter CBC results
    cy.fillForm({
      'WBC': '7.5',
      'RBC': '4.8',
      'Hemoglobin': '14.2',
      'Hematocrit': '42.1',
      'MCV': '87.5',
      'MCH': '29.5',
      'MCHC': '33.7',
      'Platelets': '250'
    });

    // Add result notes
    cy.get('[data-cy=result-notes]').type('All parameters within normal limits');

    // Save results
    cy.get('[data-cy=save-results]').click();
    cy.wait('@saveResults');
    cy.expectSuccessToast('Results saved successfully');

    // Verify validation indicators
    cy.get('[data-cy=validation-status]').should('contain', 'Pending Validation');
  });

  it('should handle critical values', () => {
    cy.visit('/results/sample-002');

    // Enter critical value
    cy.get('input[name="Hemoglobin"]').clear().type('6.5');
    
    // Verify critical value alert
    cy.get('[data-cy=critical-value-alert]').should('be.visible');
    cy.contains('Critical value detected').should('be.visible');

    // Fill critical value form
    cy.get('[data-cy=critical-notification]').within(() => {
      cy.get('[data-cy=notified-to]').type('Dr. Smith');
      cy.get('[data-cy=notification-time]').type('14:30');
      cy.get('[data-cy=notification-method]').select('Phone');
      cy.get('[data-cy=response]').type('Aware, will see patient immediately');
    });

    // Save with critical notification
    cy.get('[data-cy=save-critical]').click();
    cy.wait('@saveCriticalResult');
    
    cy.expectSuccessToast('Critical result saved and notification recorded');
  });

  it('should validate result ranges', () => {
    cy.visit('/results/sample-003');

    // Enter out of range value
    cy.get('input[name="Glucose"]').type('350');
    
    // Verify range validation
    cy.get('[data-cy=range-warning]').should('be.visible');
    cy.contains('Value outside reference range').should('be.visible');
    cy.get('[data-cy=reference-range]').should('contain', '70-100 mg/dL');

    // Confirm abnormal result
    cy.get('[data-cy=confirm-abnormal]').check();
    cy.get('[data-cy=save-results]').click();
    
    cy.expectSuccessToast('Results saved');
    cy.get('[data-cy=result-flag]').should('contain', 'H'); // High flag
  });

  it('should handle delta checks', () => {
    cy.visit('/results/sample-004');

    // Enter value that triggers delta check
    cy.get('input[name="Creatinine"]').type('3.5');
    
    // Verify delta check alert
    cy.get('[data-cy=delta-check-alert]').should('be.visible');
    cy.contains('Significant change from previous result').should('be.visible');
    
    // View previous results
    cy.get('[data-cy=view-previous]').click();
    cy.get('[data-cy=previous-results]').should('be.visible');
    cy.contains('Previous: 1.2 mg/dL').should('be.visible');

    // Add explanation for change
    cy.get('[data-cy=delta-explanation]').type('Patient in acute renal failure');
    cy.get('[data-cy=acknowledge-delta]').click();
    
    cy.get('[data-cy=save-results]').click();
    cy.expectSuccessToast('Results saved with delta check acknowledgment');
  });

  it('should support calculated results', () => {
    cy.visit('/results/sample-005');

    // Enter values for calculated fields
    cy.get('input[name="Total_Cholesterol"]').type('200');
    cy.get('input[name="HDL_Cholesterol"]').type('50');
    cy.get('input[name="Triglycerides"]').type('150');

    // Verify LDL calculation
    cy.get('input[name="LDL_Cholesterol"]').should('have.value', '120'); // Auto-calculated
    cy.get('[data-cy=calculated-indicator]').should('be.visible');

    // Verify calculation formula display
    cy.get('[data-cy=show-formula]').click();
    cy.contains('LDL = Total Cholesterol - HDL - (Triglycerides/5)').should('be.visible');
  });

  it('should handle result amendments', () => {
    cy.visit('/results');
    cy.get('[data-cy=filter-completed]').click();
    cy.get('[data-cy=result-table] tbody tr').first().click();

    // Initiate amendment
    cy.get('[data-cy=amend-result]').click();
    cy.get('[data-cy=amendment-reason]').select('Corrected value');
    cy.get('[data-cy=amendment-notes]').type('Transcription error, correct value entered');

    // Update result value
    cy.get('input[name="WBC"]').clear().type('8.2');
    
    // Save amendment
    cy.get('[data-cy=save-amendment]').click();
    cy.wait('@amendResult');
    
    cy.expectSuccessToast('Result amended successfully');
    cy.get('[data-cy=amendment-indicator]').should('be.visible');
  });

  it('should support result templates', () => {
    cy.visit('/results/sample-006');

    // Load template
    cy.get('[data-cy=use-template]').click();
    cy.get('[data-cy=template-search]').type('Normal CBC');
    cy.get('[data-cy=template-option]').first().click();
    
    // Verify template values loaded
    cy.get('input[name="WBC"]').should('have.value', '7.0');
    cy.get('input[name="RBC"]').should('have.value', '4.5');
    
    // Modify as needed
    cy.get('input[name="Hemoglobin"]').clear().type('13.8');
    
    cy.get('[data-cy=save-results]').click();
    cy.expectSuccessToast('Results saved');
  });

  it('should handle result verification', () => {
    cy.visit('/results');
    cy.get('[data-cy=filter-pending-verification]').click();
    cy.get('[data-cy=result-table] tbody tr').first().click();

    // Review results
    cy.get('[data-cy=verification-checklist]').within(() => {
      cy.get('[data-cy=check-patient-id]').check();
      cy.get('[data-cy=check-sample-id]').check();
      cy.get('[data-cy=check-results-reasonable]').check();
      cy.get('[data-cy=check-no-critical]').check();
    });

    // Add verification comment
    cy.get('[data-cy=verification-comment]').type('Results reviewed and verified');

    // Verify results
    cy.get('[data-cy=verify-results]').click();
    cy.wait('@verifyResults');
    
    cy.expectSuccessToast('Results verified successfully');
    cy.get('[data-cy=verification-status]').should('contain', 'Verified');
  });

  it('should support batch result entry', () => {
    cy.visit('/results/batch');

    // Upload result file
    cy.uploadFile('[data-cy=result-file-upload]', 'cypress/fixtures/batch-results.csv');
    
    // Preview uploaded results
    cy.get('[data-cy=preview-table]').should('be.visible');
    cy.get('[data-cy=preview-table] tbody tr').should('have.length', 10);

    // Validate all results
    cy.get('[data-cy=validate-all]').click();
    cy.get('[data-cy=validation-summary]').should('contain', '10 results validated');
    cy.get('[data-cy=validation-errors]').should('contain', '0 errors');

    // Import results
    cy.get('[data-cy=import-results]').click();
    cy.wait('@batchImportResults');
    
    cy.expectSuccessToast('10 results imported successfully');
  });

  it('should generate result reports', () => {
    cy.visit('/results/sample-007');

    // Complete result entry
    cy.fillForm({
      'Glucose': '95',
      'BUN': '18',
      'Creatinine': '1.0'
    });
    cy.get('[data-cy=save-results]').click();

    // Generate report
    cy.get('[data-cy=generate-report]').click();
    cy.get('[data-cy=report-preview]').should('be.visible');

    // Verify report content
    cy.get('[data-cy=report-preview]').within(() => {
      cy.contains('Laboratory Report').should('be.visible');
      cy.contains('Patient Name').should('be.visible');
      cy.contains('Test Results').should('be.visible');
      cy.contains('Reference Range').should('be.visible');
    });

    // Send report
    cy.get('[data-cy=send-report]').click();
    cy.get('[data-cy=send-to]').select('Ordering Physician');
    cy.get('[data-cy=send-method]').select('Secure Email');
    cy.get('[data-cy=confirm-send]').click();
    
    cy.expectSuccessToast('Report sent successfully');
  });
});