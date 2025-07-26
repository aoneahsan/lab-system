describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/login');
  });

  it('should display login form', () => {
    cy.get('h1').should('contain', 'Sign In');
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('contain', 'Sign In');
  });

  it('should show validation errors for empty fields', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('Email is required').should('be.visible');
    cy.contains('Password is required').should('be.visible');
  });

  it('should show error for invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    
    cy.contains('Invalid email or password').should('be.visible');
  });

  it('should login successfully with valid credentials', () => {
    cy.interceptAPI();
    
    cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
  });

  it('should redirect to login when accessing protected route', () => {
    cy.visit('/patients');
    cy.url().should('include', '/login');
  });

  it('should logout successfully', () => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.get('[data-cy=user-menu]').click();
    cy.contains('Sign Out').click();
    
    cy.url().should('include', '/login');
  });

  it('should persist login state on page refresh', () => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.reload();
    
    cy.url().should('include', '/dashboard');
    cy.contains('Welcome').should('be.visible');
  });

  it('should handle password reset flow', () => {
    cy.contains('Forgot password?').click();
    cy.url().should('include', '/forgot-password');
    
    cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'));
    cy.get('button[type="submit"]').click();
    
    cy.contains('Password reset email sent').should('be.visible');
  });

  it('should handle multi-tenant login', () => {
    cy.visit('/login');
    cy.get('[data-cy=tenant-code]').type(Cypress.env('TEST_TENANT_CODE'));
    cy.get('input[type="email"]').type(Cypress.env('TEST_EMAIL'));
    cy.get('input[type="password"]').type(Cypress.env('TEST_PASSWORD'));
    cy.get('button[type="submit"]').click();
    
    cy.url().should('include', '/dashboard');
    cy.contains(Cypress.env('TEST_TENANT_CODE')).should('be.visible');
  });
});