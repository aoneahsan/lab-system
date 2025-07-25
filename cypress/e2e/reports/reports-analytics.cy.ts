describe('Reports and Analytics', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.navigateToModule('Reports');
  });

  describe('Standard Reports', () => {
    it('generates daily summary report', () => {
      cy.findByRole('button', { name: /daily summary/i }).click();
      
      // Select date
      cy.findByLabelText(/report date/i).type('2024-01-25');
      
      // Configure options
      cy.findByRole('checkbox', { name: /include statistics/i }).check();
      cy.findByRole('checkbox', { name: /include graphs/i }).check();
      
      // Generate report
      cy.findByRole('button', { name: /generate/i }).click();
      cy.wait('@generateDailySummary');
      
      // Verify sections
      cy.findByText(/tests performed:/i).should('be.visible');
      cy.findByText(/turnaround time:/i).should('be.visible');
      cy.findByText(/critical results:/i).should('be.visible');
    });

    it('generates turnaround time report', () => {
      cy.findByRole('button', { name: /tat report/i }).click();
      
      // Set parameters
      cy.findByLabelText(/from date/i).type('2024-01-01');
      cy.findByLabelText(/to date/i).type('2024-01-31');
      cy.findByLabelText(/group by/i).select('Test Type');
      
      cy.findByRole('button', { name: /generate/i }).click();
      cy.wait('@generateTATReport');
      
      // Check TAT metrics
      cy.findByText(/average tat/i).should('be.visible');
      cy.findByText(/90th percentile/i).should('be.visible');
      cy.findByTestId('tat-chart').should('be.visible');
    });
  });

  describe('Custom Reports', () => {
    it('creates custom report template', () => {
      cy.findByRole('tab', { name: /custom reports/i }).click();
      cy.findByRole('button', { name: /create template/i }).click();
      
      // Configure template
      cy.findByLabelText(/template name/i).type('Monthly Department Summary');
      cy.findByLabelText(/description/i).type('Monthly summary by department');
      
      // Add data fields
      cy.findByRole('button', { name: /add field/i }).click();
      cy.findByLabelText(/field type/i).select('Test Count');
      cy.findByLabelText(/group by/i).select('Department');
      
      // Save template
      cy.findByRole('button', { name: /save template/i }).click();
      cy.wait('@saveReportTemplate');
      
      cy.findByText(/template saved/i).should('be.visible');
    });
  });

  describe('Dashboard Analytics', () => {
    it('displays real-time analytics', () => {
      cy.findByRole('tab', { name: /dashboard/i }).click();
      
      // Verify dashboard widgets
      cy.findByTestId('tests-today-widget').should('be.visible');
      cy.findByTestId('pending-results-widget').should('be.visible');
      cy.findByTestId('tat-gauge').should('be.visible');
      cy.findByTestId('revenue-chart').should('be.visible');
    });
  });
});