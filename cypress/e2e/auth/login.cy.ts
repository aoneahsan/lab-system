describe('Authentication - Login', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('displays login form correctly', () => {
    cy.findByRole('heading', { name: /sign in/i }).should('be.visible');
    cy.findByLabelText(/email/i).should('be.visible');
    cy.findByLabelText(/password/i).should('be.visible');
    cy.findByRole('button', { name: /sign in/i }).should('be.visible');
    cy.findByText(/create account/i).should('be.visible');
  });

  it('shows validation errors for empty fields', () => {
    cy.findByRole('button', { name: /sign in/i }).click();
    cy.findByText(/email is required/i).should('be.visible');
    cy.findByText(/password is required/i).should('be.visible');
  });

  it('shows error for invalid email format', () => {
    cy.findByLabelText(/email/i).type('invalid-email');
    cy.findByLabelText(/password/i).type('password123');
    cy.findByRole('button', { name: /sign in/i }).click();
    cy.findByText(/invalid email format/i).should('be.visible');
  });

  it('shows error for incorrect credentials', () => {
    cy.findByLabelText(/email/i).type('wrong@example.com');
    cy.findByLabelText(/password/i).type('wrongpassword');
    cy.findByRole('button', { name: /sign in/i }).click();
    cy.findByText(/invalid credentials/i).should('be.visible');
  });

  it('successfully logs in with valid credentials', () => {
    cy.findByLabelText(/email/i).type(Cypress.env('TEST_EMAIL'));
    cy.findByLabelText(/password/i).type(Cypress.env('TEST_PASSWORD'));
    cy.findByRole('button', { name: /sign in/i }).click();
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    cy.findByText(/welcome/i).should('be.visible');
  });

  it('persists login state on page refresh', () => {
    // Login
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    
    // Refresh page
    cy.reload();
    
    // Should still be logged in
    cy.url().should('include', '/dashboard');
    cy.findByText(/welcome/i).should('be.visible');
  });

  it('redirects to originally requested page after login', () => {
    // Try to visit protected page
    cy.visit('/patients');
    
    // Should redirect to login
    cy.url().should('include', '/login');
    
    // Login
    cy.findByLabelText(/email/i).type(Cypress.env('TEST_EMAIL'));
    cy.findByLabelText(/password/i).type(Cypress.env('TEST_PASSWORD'));
    cy.findByRole('button', { name: /sign in/i }).click();
    
    // Should redirect back to patients
    cy.url().should('include', '/patients');
  });

  it('handles network errors gracefully', () => {
    cy.intercept('POST', '**/signInWithEmailAndPassword', {
      statusCode: 500,
      body: { error: 'Internal Server Error' },
    });

    cy.findByLabelText(/email/i).type(Cypress.env('TEST_EMAIL'));
    cy.findByLabelText(/password/i).type(Cypress.env('TEST_PASSWORD'));
    cy.findByRole('button', { name: /sign in/i }).click();
    
    cy.findByText(/server error/i).should('be.visible');
  });
});