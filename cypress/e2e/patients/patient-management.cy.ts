describe('Patient Management', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.navigateToModule('Patients');
  });

  describe('Patient List', () => {
    it('displays patient list with search and filters', () => {
      cy.findByRole('heading', { name: /patients/i }).should('be.visible');
      cy.findByPlaceholderText(/search patients/i).should('be.visible');
      cy.findByRole('button', { name: /add patient/i }).should('be.visible');
      
      // Check if patients are loaded
      cy.findAllByTestId('patient-card').should('have.length.at.least', 1);
    });

    it('searches patients by name', () => {
      cy.findByPlaceholderText(/search patients/i).type('John');
      cy.wait('@getPatients');
      
      cy.findAllByTestId('patient-card').each(($card) => {
        cy.wrap($card).should('contain.text', 'John');
      });
    });

    it('filters patients by gender', () => {
      cy.findByLabelText(/filter by gender/i).select('male');
      cy.wait('@getPatients');
      
      cy.findAllByTestId('patient-card').each(($card) => {
        cy.wrap($card).should('contain.text', 'Male');
      });
    });

    it('paginates through patient list', () => {
      // Check pagination controls
      cy.findByRole('button', { name: /next page/i }).should('be.visible');
      
      // Go to next page
      cy.findByRole('button', { name: /next page/i }).click();
      cy.wait('@getPatients');
      
      // Verify URL updated
      cy.url().should('include', 'page=2');
    });
  });

  describe('Create Patient', () => {
    beforeEach(() => {
      cy.findByRole('button', { name: /add patient/i }).click();
    });

    it('displays create patient form', () => {
      cy.findByRole('heading', { name: /new patient/i }).should('be.visible');
      cy.findByLabelText(/first name/i).should('be.visible');
      cy.findByLabelText(/last name/i).should('be.visible');
      cy.findByLabelText(/date of birth/i).should('be.visible');
      cy.findByLabelText(/gender/i).should('be.visible');
    });

    it('validates required fields', () => {
      cy.findByRole('button', { name: /save patient/i }).click();
      
      cy.findByText(/first name is required/i).should('be.visible');
      cy.findByText(/last name is required/i).should('be.visible');
      cy.findByText(/date of birth is required/i).should('be.visible');
      cy.findByText(/gender is required/i).should('be.visible');
    });

    it('creates a new patient successfully', () => {
      const patient = {
        firstName: 'Test',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        gender: 'male',
        email: 'test.patient@example.com',
        phone: '+1234567890',
      };

      cy.createPatient(patient);
      cy.wait('@createPatient');
      
      // Should redirect to patient details
      cy.url().should('match', /\/patients\/\w+/);
      cy.findByText(`${patient.firstName} ${patient.lastName}`).should('be.visible');
    });

    it('handles duplicate patient creation', () => {
      cy.intercept('POST', '**/patients', {
        statusCode: 409,
        body: { error: 'Patient already exists' },
      });

      const patient = {
        firstName: 'Existing',
        lastName: 'Patient',
        dateOfBirth: '1990-01-01',
        gender: 'female',
        email: 'existing@example.com',
        phone: '+1234567890',
      };

      cy.createPatient(patient);
      cy.findByText(/patient already exists/i).should('be.visible');
    });
  });

  describe('Patient Details', () => {
    beforeEach(() => {
      cy.findAllByTestId('patient-card').first().click();
    });

    it('displays patient information', () => {
      cy.findByRole('heading', { level: 1 }).should('contain.text', 'Patient Details');
      cy.findByText(/medical record number/i).should('be.visible');
      cy.findByText(/contact information/i).should('be.visible');
      cy.findByText(/insurance information/i).should('be.visible');
      cy.findByText(/medical history/i).should('be.visible');
    });

    it('allows editing patient information', () => {
      cy.findByRole('button', { name: /edit patient/i }).click();
      
      // Update phone number
      cy.findByLabelText(/phone/i).clear().type('+9876543210');
      cy.findByRole('button', { name: /save changes/i }).click();
      
      cy.wait('@updatePatient');
      cy.findByText(/patient updated successfully/i).should('be.visible');
      cy.findByText('+9876543210').should('be.visible');
    });

    it('displays patient test history', () => {
      cy.findByRole('tab', { name: /test history/i }).click();
      cy.findAllByTestId('test-result-row').should('have.length.at.least', 1);
    });

    it('allows printing patient information', () => {
      cy.window().then((win) => {
        cy.stub(win, 'print');
      });
      
      cy.findByRole('button', { name: /print/i }).click();
      cy.window().its('print').should('be.called');
    });
  });

  describe('Patient Documents', () => {
    beforeEach(() => {
      cy.findAllByTestId('patient-card').first().click();
      cy.findByRole('tab', { name: /documents/i }).click();
    });

    it('displays document upload section', () => {
      cy.findByText(/upload document/i).should('be.visible');
      cy.findByRole('button', { name: /choose file/i }).should('be.visible');
    });

    it('uploads a document successfully', () => {
      const fileName = 'test-document.pdf';
      
      cy.fixture(fileName, 'base64').then((fileContent) => {
        cy.findByLabelText(/upload document/i).attachFile({
          fileContent,
          fileName,
          mimeType: 'application/pdf',
          encoding: 'base64',
        });
      });
      
      cy.findByRole('button', { name: /upload/i }).click();
      cy.wait('@uploadDocument');
      
      cy.findByText(fileName).should('be.visible');
      cy.findByText(/document uploaded successfully/i).should('be.visible');
    });

    it('downloads a document', () => {
      cy.findAllByTestId('document-row').first().within(() => {
        cy.findByRole('button', { name: /download/i }).click();
      });
      
      // Verify download started (actual file download is handled by browser)
      cy.wait('@downloadDocument');
    });
  });
});