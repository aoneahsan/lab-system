describe('Result Entry and Validation', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.navigateToModule('Results');
  });

  describe('Result Entry', () => {
    it('enters single result manually', () => {
      // Search for pending sample
      cy.findByPlaceholderText(/search by sample id/i).type('S123456');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      // Enter result
      cy.findByRole('button', { name: /enter result/i }).click();
      cy.findByLabelText(/hemoglobin/i).type('12.5');
      cy.findByLabelText(/unit/i).should('have.value', 'g/dL');
      
      // Check reference range
      cy.findByText(/reference: 12.0-16.0/i).should('be.visible');
      
      // Save result
      cy.findByRole('button', { name: /save result/i }).click();
      cy.wait('@saveResult');
      
      cy.findByText(/result saved successfully/i).should('be.visible');
    });

    it('validates result against reference ranges', () => {
      cy.findByPlaceholderText(/search by sample id/i).type('S123457');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      cy.findByRole('button', { name: /enter result/i }).click();
      
      // Enter out-of-range value
      cy.findByLabelText(/glucose/i).type('250');
      
      // Should show warning
      cy.findByText(/high/i).should('be.visible');
      cy.findByText(/above reference range/i).should('be.visible');
      
      // Require confirmation
      cy.findByRole('button', { name: /save result/i }).click();
      cy.findByText(/confirm out-of-range result/i).should('be.visible');
      cy.findByRole('button', { name: /confirm/i }).click();
      
      cy.wait('@saveResult');
    });

    it('flags critical results', () => {
      cy.findByPlaceholderText(/search by sample id/i).type('S123458');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      cy.findByRole('button', { name: /enter result/i }).click();
      
      // Enter critical value
      cy.findByLabelText(/potassium/i).type('6.5');
      
      // Should show critical alert
      cy.findByText(/critical value/i).should('be.visible');
      cy.findByRole('alert').should('have.class', 'critical');
      
      // Save with critical flag
      cy.findByRole('button', { name: /save as critical/i }).click();
      
      // Require additional confirmation
      cy.findByLabelText(/notified/i).type('Dr. Smith');
      cy.findByLabelText(/notification time/i).type('14:30');
      cy.findByRole('button', { name: /confirm critical result/i }).click();
      
      cy.wait('@saveCriticalResult');
      cy.findByText(/critical result saved and flagged/i).should('be.visible');
    });

    it('handles delta checks', () => {
      cy.findByPlaceholderText(/search by sample id/i).type('S123459');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getSample');
      
      // View previous results
      cy.findByRole('button', { name: /view history/i }).click();
      cy.findByText(/previous: 4.5/i).should('be.visible');
      
      cy.findByRole('button', { name: /enter result/i }).click();
      
      // Enter significantly different value
      cy.findByLabelText(/creatinine/i).type('8.5');
      
      // Should trigger delta check
      cy.findByText(/significant change detected/i).should('be.visible');
      cy.findByText(/89% increase from previous/i).should('be.visible');
      
      // Require verification
      cy.findByRole('checkbox', { name: /verify delta/i }).check();
      cy.findByRole('button', { name: /save with delta flag/i }).click();
      
      cy.wait('@saveResult');
    });
  });

  describe('Batch Result Entry', () => {
    it('imports results from analyzer', () => {
      cy.findByRole('button', { name: /import results/i }).click();
      
      // Select analyzer
      cy.findByLabelText(/analyzer/i).select('Sysmex XN-1000');
      
      // Upload file
      const fileName = 'analyzer-results.csv';
      cy.fixture(fileName).then((fileContent) => {
        cy.findByLabelText(/upload file/i).attachFile({
          fileContent,
          fileName,
          mimeType: 'text/csv',
        });
      });
      
      // Preview results
      cy.findByRole('button', { name: /preview/i }).click();
      cy.findAllByTestId('import-preview-row').should('have.length', 10);
      
      // Import results
      cy.findByRole('button', { name: /import all/i }).click();
      cy.wait('@importResults');
      
      cy.findByText(/10 results imported successfully/i).should('be.visible');
    });

    it('validates imported results', () => {
      cy.findByRole('button', { name: /import results/i }).click();
      cy.findByLabelText(/analyzer/i).select('Beckman DxH 900');
      
      const fileName = 'analyzer-results-with-errors.csv';
      cy.fixture(fileName).then((fileContent) => {
        cy.findByLabelText(/upload file/i).attachFile({
          fileContent,
          fileName,
          mimeType: 'text/csv',
        });
      });
      
      cy.findByRole('button', { name: /preview/i }).click();
      
      // Should show validation errors
      cy.findByText(/3 results have validation errors/i).should('be.visible');
      cy.findAllByTestId('import-error').should('have.length', 3);
      
      // Fix errors
      cy.findByRole('button', { name: /fix errors/i }).click();
      cy.findAllByRole('textbox', { name: /corrected value/i }).each(($input) => {
        cy.wrap($input).clear().type('5.0');
      });
      
      // Re-validate and import
      cy.findByRole('button', { name: /validate and import/i }).click();
      cy.wait('@importResults');
    });
  });

  describe('Result Review and Approval', () => {
    beforeEach(() => {
      cy.findByRole('tab', { name: /pending review/i }).click();
    });

    it('reviews and approves results', () => {
      // Select results for review
      cy.findByRole('checkbox', { name: /select all/i }).check();
      cy.findByText(/5 results selected/i).should('be.visible');
      
      // Review selected
      cy.findByRole('button', { name: /review selected/i }).click();
      
      // Check each result
      cy.findAllByTestId('review-item').each(($item) => {
        cy.wrap($item).within(() => {
          cy.findByRole('checkbox', { name: /approve/i }).check();
        });
      });
      
      // Add review comment
      cy.findByLabelText(/review comment/i).type('All results verified against QC');
      
      // Approve all
      cy.findByRole('button', { name: /approve all/i }).click();
      cy.wait('@approveResults');
      
      cy.findByText(/5 results approved/i).should('be.visible');
    });

    it('rejects results requiring retest', () => {
      cy.findAllByTestId('result-row').first().click();
      
      // Review result details
      cy.findByRole('button', { name: /reject result/i }).click();
      
      // Select rejection reason
      cy.findByRole('combobox', { name: /rejection reason/i }).select('QC Failure');
      cy.findByLabelText(/comments/i).type('QC failed, retest required');
      
      // Reject
      cy.findByRole('button', { name: /confirm rejection/i }).click();
      cy.wait('@rejectResult');
      
      cy.findByText(/result rejected/i).should('be.visible');
      cy.findByText(/retest ordered/i).should('be.visible');
    });

    it('handles amended results', () => {
      // Find previously approved result
      cy.findByRole('tab', { name: /approved/i }).click();
      cy.findAllByTestId('result-row').first().click();
      
      // Amend result
      cy.findByRole('button', { name: /amend result/i }).click();
      
      // Update value
      cy.findByLabelText(/amended value/i).clear().type('5.8');
      cy.findByLabelText(/reason for amendment/i).type('Dilution factor correction');
      
      // Save amendment
      cy.findByRole('button', { name: /save amendment/i }).click();
      cy.wait('@amendResult');
      
      cy.findByText(/result amended/i).should('be.visible');
      cy.findByText(/amendment history/i).should('be.visible');
    });
  });

  describe('Result Reporting', () => {
    it('generates PDF report', () => {
      cy.findByPlaceholderText(/search patient/i).type('John Doe');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getPatientResults');
      
      // Select results for report
      cy.findByRole('checkbox', { name: /select all/i }).check();
      cy.findByRole('button', { name: /generate report/i }).click();
      
      // Configure report
      cy.findByRole('checkbox', { name: /include reference ranges/i }).check();
      cy.findByRole('checkbox', { name: /include graphs/i }).check();
      cy.findByRole('checkbox', { name: /include previous results/i }).check();
      
      // Generate PDF
      cy.findByRole('button', { name: /generate pdf/i }).click();
      cy.wait('@generateReport');
      
      // Verify download
      cy.readFile('cypress/downloads/lab-report.pdf').should('exist');
    });

    it('sends results electronically', () => {
      cy.findByPlaceholderText(/search patient/i).type('Jane Smith');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getPatientResults');
      
      cy.findByRole('button', { name: /send results/i }).click();
      
      // Select delivery method
      cy.findByRole('radio', { name: /email/i }).check();
      cy.findByLabelText(/recipient email/i).should('have.value', 'jane.smith@example.com');
      
      // Add message
      cy.findByLabelText(/message/i).type('Your lab results are ready');
      
      // Send
      cy.findByRole('button', { name: /send now/i }).click();
      cy.wait('@sendResults');
      
      cy.findByText(/results sent successfully/i).should('be.visible');
    });

    it('exports results to EMR', () => {
      cy.findByRole('button', { name: /export to emr/i }).click();
      
      // Select date range
      cy.findByLabelText(/from date/i).type('2024-01-01');
      cy.findByLabelText(/to date/i).type('2024-01-31');
      
      // Select format
      cy.findByRole('radio', { name: /hl7/i }).check();
      
      // Configure mapping
      cy.findByRole('button', { name: /configure mapping/i }).click();
      cy.findByRole('combobox', { name: /emr system/i }).select('Epic');
      
      // Export
      cy.findByRole('button', { name: /export/i }).click();
      cy.wait('@exportToEMR');
      
      cy.findByText(/exported \d+ results/i).should('be.visible');
    });
  });
});