/// <reference types="cypress" />

describe('Authentication Flow', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login', () => {
    it('should show login page by default', () => {
      cy.contains('h1', 'Sign in to your account').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.contains('button', 'Sign in').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.contains('button', 'Sign in').click();
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show validation error for invalid email', () => {
      cy.get('input[type="email"]').type('invalid-email');
      cy.get('input[type="password"]').type('password123');
      cy.contains('button', 'Sign in').click();
      cy.contains('Invalid email address').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.get('input[type="email"]').type('labstaff@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.contains('button', 'Sign in').click();

      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.contains('Dashboard').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.get('input[type="email"]').type('wrong@example.com');
      cy.get('input[type="password"]').type('wrongpassword');
      cy.contains('button', 'Sign in').click();

      cy.contains('Invalid email or password').should('be.visible');
    });

    it('should toggle password visibility', () => {
      cy.get('input[type="password"]').type('password123');
      cy.get('input[type="password"]').should('have.attr', 'type', 'password');

      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'text');

      cy.get('[data-testid="toggle-password"]').click();
      cy.get('input[name="password"]').should('have.attr', 'type', 'password');
    });
  });

  describe('Registration', () => {
    beforeEach(() => {
      cy.contains('a', "Don't have an account?").click();
    });

    it('should show registration form', () => {
      cy.contains('h1', 'Create your account').should('be.visible');
      cy.get('input[name="name"]').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.get('input[type="password"]').should('be.visible');
      cy.get('input[name="confirmPassword"]').should('be.visible');
      cy.get('select[name="role"]').should('be.visible');
    });

    it('should validate registration form', () => {
      cy.contains('button', 'Sign up').click();

      cy.contains('Name is required').should('be.visible');
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
      cy.contains('Please confirm your password').should('be.visible');
    });

    it('should validate password match', () => {
      cy.get('input[name="name"]').type('Test User');
      cy.get('input[type="email"]').type('test@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password456');
      cy.contains('button', 'Sign up').click();

      cy.contains('Passwords do not match').should('be.visible');
    });

    it('should register successfully', () => {
      const uniqueEmail = `test${Date.now()}@example.com`;

      cy.get('input[name="name"]').type('Test User');
      cy.get('input[type="email"]').type(uniqueEmail);
      cy.get('input[type="password"]').type('password123');
      cy.get('input[name="confirmPassword"]').type('password123');
      cy.get('select[name="role"]').select('patient');
      cy.contains('button', 'Sign up').click();

      // Should redirect to dashboard after registration
      cy.url().should('include', '/dashboard');
      cy.contains('Dashboard').should('be.visible');
    });
  });

  describe('Forgot Password', () => {
    beforeEach(() => {
      cy.contains('a', 'Forgot your password?').click();
    });

    it('should show forgot password form', () => {
      cy.contains('h1', 'Reset your password').should('be.visible');
      cy.get('input[type="email"]').should('be.visible');
      cy.contains('button', 'Send reset email').should('be.visible');
    });

    it('should validate email field', () => {
      cy.contains('button', 'Send reset email').click();
      cy.contains('Email is required').should('be.visible');
    });

    it('should send reset email', () => {
      cy.get('input[type="email"]').type('test@example.com');
      cy.contains('button', 'Send reset email').click();

      cy.contains('Password reset email sent').should('be.visible');
    });
  });

  describe('Logout', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[type="email"]').type('labstaff@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.contains('button', 'Sign in').click();
      cy.url().should('include', '/dashboard');
    });

    it('should logout successfully', () => {
      // Click on user menu
      cy.get('[data-testid="user-menu"]').click();
      cy.contains('button', 'Sign out').click();

      // Should redirect to login page
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.contains('h1', 'Sign in to your account').should('be.visible');
    });
  });

  describe('Protected Routes', () => {
    it('should redirect to login when accessing protected route', () => {
      cy.visit('/dashboard');
      cy.url().should('eq', Cypress.config().baseUrl + '/');
      cy.contains('h1', 'Sign in to your account').should('be.visible');
    });

    it('should redirect to requested page after login', () => {
      cy.visit('/patients');

      // Should redirect to login
      cy.url().should('eq', Cypress.config().baseUrl + '/');

      // Login
      cy.get('input[type="email"]').type('labstaff@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.contains('button', 'Sign in').click();

      // Should redirect to originally requested page
      cy.url().should('include', '/patients');
      cy.contains('Patients').should('be.visible');
    });
  });

  describe('Biometric Authentication', () => {
    beforeEach(() => {
      // Login first
      cy.get('input[type="email"]').type('labstaff@example.com');
      cy.get('input[type="password"]').type('password123');
      cy.contains('button', 'Sign in').click();
      cy.url().should('include', '/dashboard');

      // Navigate to settings
      cy.visit('/settings/biometric');
    });

    it('should show biometric settings', () => {
      cy.contains('h2', 'Biometric Authentication').should('be.visible');
      cy.contains('Enable biometric authentication').should('be.visible');
    });

    it('should toggle biometric authentication', () => {
      // Enable biometric
      cy.get('[data-testid="biometric-toggle"]').click();
      cy.contains('Biometric authentication enabled').should('be.visible');

      // Disable biometric
      cy.get('[data-testid="biometric-toggle"]').click();
      cy.contains('Biometric authentication disabled').should('be.visible');
    });
  });
});
