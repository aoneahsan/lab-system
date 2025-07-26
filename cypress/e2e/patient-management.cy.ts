describe('Patient Management', () => {
  beforeEach(() => {
    cy.interceptAPI();
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.visit('/patients');
  });

  it('should display patient list', () => {
    cy.contains('Patients').should('be.visible');
    cy.get('[data-cy=patient-table]').should('be.visible');
    cy.get('[data-cy=add-patient-btn]').should('be.visible');
  });

  it('should search for patients', () => {
    cy.search('John Doe');
    cy.get('[data-cy=patient-table]').should('contain', 'John Doe');
    cy.get('[data-cy=patient-table]').should('not.contain', 'Jane Smith');
  });

  it('should filter patients by status', () => {
    cy.get('[data-cy=status-filter]').select('Active');
    cy.wait('@getPatients');
    cy.get('[data-cy=patient-table] tbody tr').should('have.length.greaterThan', 0);
  });

  it('should create a new patient', () => {
    cy.get('[data-cy=add-patient-btn]').click();
    cy.url().should('include', '/patients/new');

    // Fill patient form
    cy.fillForm({
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1990-01-01',
      gender: 'male',
      email: 'test.patient@example.com',
      phone: '(555) 123-4567',
      street: '123 Test St',
      city: 'Test City',
      state: 'CA',
      zipCode: '12345'
    });

    // Add insurance information
    cy.get('[data-cy=add-insurance]').click();
    cy.fillForm({
      insuranceProvider: 'Test Insurance',
      policyNumber: 'POL123456',
      groupNumber: 'GRP001'
    });

    // Add emergency contact
    cy.get('[data-cy=add-emergency-contact]').click();
    cy.fillForm({
      emergencyName: 'Emergency Contact',
      emergencyRelationship: 'Spouse',
      emergencyPhone: '(555) 987-6543'
    });

    // Submit form
    cy.get('[data-cy=save-patient]').click();
    cy.wait('@createPatient');

    // Verify success
    cy.expectSuccessToast('Patient created successfully');
    cy.url().should('match', /\/patients\/[a-zA-Z0-9-]+$/);
  });

  it('should view patient details', () => {
    cy.get('[data-cy=patient-table] tbody tr').first().click();
    cy.url().should('match', /\/patients\/[a-zA-Z0-9-]+$/);

    // Verify patient information is displayed
    cy.contains('Patient Information').should('be.visible');
    cy.contains('Medical History').should('be.visible');
    cy.contains('Test Results').should('be.visible');
    cy.contains('Insurance Information').should('be.visible');
  });

  it('should edit patient information', () => {
    cy.get('[data-cy=patient-table] tbody tr').first().click();
    cy.get('[data-cy=edit-patient]').click();

    // Update patient information
    cy.get('input[name="phone"]').clear().type('(555) 999-8888');
    cy.get('input[name="email"]').clear().type('updated.email@example.com');

    cy.get('[data-cy=save-patient]').click();
    cy.wait('@updatePatient');

    cy.expectSuccessToast('Patient updated successfully');
    cy.contains('(555) 999-8888').should('be.visible');
  });

  it('should add medical history', () => {
    cy.get('[data-cy=patient-table] tbody tr').first().click();
    cy.get('[data-cy=medical-history-tab]').click();
    cy.get('[data-cy=add-medical-history]').click();

    cy.fillForm({
      condition: 'Hypertension',
      diagnosedDate: '2023-01-15',
      notes: 'Managed with medication'
    });

    cy.get('[data-cy=save-medical-history]').click();
    cy.expectSuccessToast('Medical history added');
    cy.contains('Hypertension').should('be.visible');
  });

  it('should handle patient deletion', () => {
    cy.get('[data-cy=patient-table] tbody tr').first().within(() => {
      cy.get('[data-cy=patient-actions]').click();
    });
    cy.contains('Delete').click();

    // Confirm deletion
    cy.get('[data-cy=confirm-delete]').click();
    cy.wait('@deletePatient');

    cy.expectSuccessToast('Patient deleted successfully');
  });

  it('should export patient list', () => {
    cy.get('[data-cy=export-patients]').click();
    cy.get('[data-cy=export-csv]').click();

    // Verify file download
    cy.readFile('cypress/downloads/patients.csv').should('exist');
  });

  it('should print patient information', () => {
    cy.get('[data-cy=patient-table] tbody tr').first().click();
    cy.get('[data-cy=print-patient]').click();

    // Verify print dialog opens (mocked in tests)
    cy.window().its('print').should('be.called');
  });

  it('should handle pagination', () => {
    // Assuming more than 10 patients
    cy.get('[data-cy=pagination]').should('be.visible');
    cy.get('[data-cy=next-page]').click();
    cy.wait('@getPatients');
    cy.url().should('include', 'page=2');
  });

  it('should validate required fields', () => {
    cy.get('[data-cy=add-patient-btn]').click();
    cy.get('[data-cy=save-patient]').click();

    // Check validation messages
    cy.contains('First name is required').should('be.visible');
    cy.contains('Last name is required').should('be.visible');
    cy.contains('Date of birth is required').should('be.visible');
    cy.contains('Gender is required').should('be.visible');
  });
});