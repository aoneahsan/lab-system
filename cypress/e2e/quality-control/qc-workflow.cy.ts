describe('Quality Control Workflow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.navigateToModule('Quality Control');
  });

  describe('QC Run Management', () => {
    it('creates new QC run', () => {
      cy.findByRole('button', { name: /new qc run/i }).click();
      
      // Select test and controls
      cy.findByLabelText(/test/i).select('Glucose');
      cy.findByLabelText(/control level/i).select('Level 1');
      cy.findByLabelText(/lot number/i).type('QC12345');
      
      // Enter results
      cy.findByLabelText(/result/i).type('95.5');
      cy.findByLabelText(/unit/i).should('have.value', 'mg/dL');
      
      // Save QC result
      cy.findByRole('button', { name: /save result/i }).click();
      cy.wait('@saveQCResult');
      
      cy.findByText(/qc result saved/i).should('be.visible');
    });

    it('validates QC results against rules', () => {
      cy.findByRole('button', { name: /new qc run/i }).click();
      
      // Enter out-of-range value
      cy.findByLabelText(/test/i).select('Hemoglobin');
      cy.findByLabelText(/control level/i).select('Level 2');
      cy.findByLabelText(/result/i).type('8.5');
      
      // Should show violation
      cy.findByText(/westgard violation/i).should('be.visible');
      cy.findByText(/1-3s rule/i).should('be.visible');
      
      // Require action
      cy.findByRole('button', { name: /save with violation/i }).click();
      cy.findByLabelText(/corrective action/i).type('Recalibrated analyzer');
      cy.findByRole('button', { name: /confirm/i }).click();
      
      cy.wait('@saveQCViolation');
    });
  });

  describe('Levey-Jennings Charts', () => {
    it('displays LJ charts for test', () => {
      cy.findByRole('tab', { name: /lj charts/i }).click();
      
      // Select test and date range
      cy.findByLabelText(/test/i).select('Glucose');
      cy.findByLabelText(/date range/i).select('Last 30 days');
      
      cy.findByRole('button', { name: /view chart/i }).click();
      cy.wait('@getLJData');
      
      // Verify chart elements
      cy.findByTestId('lj-chart').should('be.visible');
      cy.findByText(/mean:/i).should('be.visible');
      cy.findByText(/sd:/i).should('be.visible');
      cy.findByText(/cv%:/i).should('be.visible');
    });

    it('highlights rule violations on chart', () => {
      cy.findByRole('tab', { name: /lj charts/i }).click();
      cy.findByLabelText(/test/i).select('Creatinine');
      cy.findByRole('button', { name: /view chart/i }).click();
      
      // Should show violations
      cy.findAllByTestId('violation-point').should('have.length.at.least', 1);
      
      // Click on violation point
      cy.findAllByTestId('violation-point').first().click();
      cy.findByText(/rule violated:/i).should('be.visible');
    });
  });

  describe('QC Review and Approval', () => {
    it('reviews daily QC results', () => {
      cy.findByRole('tab', { name: /qc review/i }).click();
      
      // Select date
      cy.findByLabelText(/review date/i).type('2024-01-25');
      cy.findByRole('button', { name: /load qc data/i }).click();
      cy.wait('@getDailyQC');
      
      // Review all tests
      cy.findAllByTestId('qc-test-row').should('have.length.at.least', 5);
      
      // Approve all passing
      cy.findByRole('checkbox', { name: /select all passing/i }).check();
      cy.findByRole('button', { name: /approve selected/i }).click();
      
      cy.wait('@approveQC');
      cy.findByText(/qc approved/i).should('be.visible');
    });
  });
});