describe('Admin Panel', () => {
  beforeEach(() => {
    cy.login(Cypress.env('ADMIN_EMAIL'), Cypress.env('ADMIN_PASSWORD'));
    cy.navigateToModule('Admin');
  });

  describe('User Management', () => {
    it('creates new user account', () => {
      cy.findByRole('tab', { name: /users/i }).click();
      cy.findByRole('button', { name: /add user/i }).click();
      
      // Fill user details
      cy.findByLabelText(/first name/i).type('New');
      cy.findByLabelText(/last name/i).type('User');
      cy.findByLabelText(/email/i).type('newuser@labflow.com');
      cy.findByLabelText(/role/i).select('Lab Technician');
      cy.findByLabelText(/department/i).select('Chemistry');
      
      // Set permissions
      cy.findByRole('checkbox', { name: /can create tests/i }).check();
      cy.findByRole('checkbox', { name: /can approve results/i }).check();
      
      cy.findByRole('button', { name: /create user/i }).click();
      cy.wait('@createUser');
      
      cy.findByText(/user created/i).should('be.visible');
    });

    it('manages user permissions', () => {
      cy.findByRole('tab', { name: /users/i }).click();
      cy.findAllByTestId('user-row').first().click();
      
      cy.findByRole('button', { name: /edit permissions/i }).click();
      
      // Update permissions
      cy.findByRole('checkbox', { name: /admin access/i }).check();
      cy.findByRole('button', { name: /save permissions/i }).click();
      
      cy.wait('@updatePermissions');
      cy.findByText(/permissions updated/i).should('be.visible');
    });
  });

  describe('System Configuration', () => {
    it('configures test catalog', () => {
      cy.findByRole('tab', { name: /test catalog/i }).click();
      cy.findByRole('button', { name: /add test/i }).click();
      
      // Add new test
      cy.findByLabelText(/test name/i).type('Advanced Lipid Panel');
      cy.findByLabelText(/test code/i).type('ALP-001');
      cy.findByLabelText(/department/i).select('Chemistry');
      cy.findByLabelText(/tat hours/i).type('24');
      
      // Add components
      cy.findByRole('button', { name: /add component/i }).click();
      cy.findByLabelText(/component name/i).type('Total Cholesterol');
      cy.findByLabelText(/loinc code/i).type('2093-3');
      
      cy.findByRole('button', { name: /save test/i }).click();
      cy.wait('@saveTest');
    });
  });

  describe('Audit Logs', () => {
    it('views and filters audit logs', () => {
      cy.findByRole('tab', { name: /audit logs/i }).click();
      
      // Apply filters
      cy.findByLabelText(/date range/i).select('Last 7 days');
      cy.findByLabelText(/action type/i).select('Data Modification');
      cy.findByLabelText(/user/i).type('John');
      
      cy.findByRole('button', { name: /apply filters/i }).click();
      cy.wait('@getAuditLogs');
      
      // Verify logs displayed
      cy.findAllByTestId('audit-log-entry').should('have.length.at.least', 1);
    });
  });

  describe('System Maintenance', () => {
    it('performs database backup', () => {
      cy.findByRole('tab', { name: /maintenance/i }).click();
      
      cy.findByRole('button', { name: /backup database/i }).click();
      cy.findByRole('button', { name: /confirm backup/i }).click();
      
      cy.wait('@performBackup');
      cy.findByText(/backup completed/i).should('be.visible');
    });
  });
});