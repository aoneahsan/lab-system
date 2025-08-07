describe('Authentication', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  describe('Login Flow', () => {
    it('should display login form', () => {
      cy.visit('/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
      cy.get('[data-testid="email-input"]').should('be.visible');
      cy.get('[data-testid="password-input"]').should('be.visible');
      cy.get('[data-testid="login-button"]').should('be.visible');
    });

    it('should show validation errors for empty fields', () => {
      cy.visit('/login');
      cy.get('[data-testid="login-button"]').click();
      cy.contains('Email is required').should('be.visible');
      cy.contains('Password is required').should('be.visible');
    });

    it('should show error for invalid credentials', () => {
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type('invalid@email.com');
      cy.get('[data-testid="password-input"]').type('wrongpassword');
      cy.get('[data-testid="login-button"]').click();
      
      cy.contains('Invalid email or password').should('be.visible');
    });

    it('should login successfully with valid credentials', () => {
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_EMAIL'));
      cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_PASSWORD'));
      cy.get('[data-testid="login-button"]').click();
      
      // Should redirect to dashboard
      cy.url().should('include', '/dashboard');
      cy.get('[data-testid="user-menu"]').should('be.visible');
    });

    it('should remember user with "Remember me" checked', () => {
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').type(Cypress.env('TEST_EMAIL'));
      cy.get('[data-testid="password-input"]').type(Cypress.env('TEST_PASSWORD'));
      cy.get('[data-testid="remember-me-checkbox"]').check();
      cy.get('[data-testid="login-button"]').click();
      
      // Logout
      cy.logout();
      
      // Visit login again - email should be pre-filled
      cy.visit('/login');
      cy.get('[data-testid="email-input"]').should('have.value', Cypress.env('TEST_EMAIL'));
    });
  });

  describe('Logout Flow', () => {
    beforeEach(() => {
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    });

    it('should logout successfully', () => {
      cy.get('[data-testid="user-menu"]').click();
      cy.get('[data-testid="logout-button"]').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.get('[data-testid="login-form"]').should('be.visible');
    });

    it('should clear session on logout', () => {
      cy.logout();
      
      // Try to access protected route
      cy.visit('/dashboard');
      
      // Should redirect to login
      cy.url().should('include', '/login');
    });
  });

  describe('Password Reset', () => {
    it('should show password reset form', () => {
      cy.visit('/login');
      cy.contains('Forgot password?').click();
      
      cy.url().should('include', '/forgot-password');
      cy.get('[data-testid="reset-password-form"]').should('be.visible');
    });

    it('should send password reset email', () => {
      cy.visit('/forgot-password');
      cy.get('[data-testid="email-input"]').type('test@example.com');
      cy.get('[data-testid="reset-button"]').click();
      
      cy.contains('Password reset email sent').should('be.visible');
    });
  });

  describe('Role-Based Access', () => {
    it('should show admin menu for admin users', () => {
      cy.loginAsAdmin();
      cy.get('[data-testid="admin-menu"]').should('be.visible');
      cy.get('[data-testid="settings-link"]').should('be.visible');
    });

    it('should not show admin menu for lab tech users', () => {
      cy.loginAsLabTech();
      cy.get('[data-testid="admin-menu"]').should('not.exist');
      cy.get('[data-testid="settings-link"]').should('not.exist');
    });

    it('should restrict access to admin routes for non-admin users', () => {
      cy.loginAsLabTech();
      cy.visit('/admin/settings');
      
      // Should show unauthorized message or redirect
      cy.contains('Unauthorized').should('be.visible');
    });
  });

  describe('Session Management', () => {
    it('should maintain session across page refreshes', () => {
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
      cy.get('[data-testid="user-menu"]').should('be.visible');
      
      // Refresh page
      cy.reload();
      
      // Should still be logged in
      cy.get('[data-testid="user-menu"]').should('be.visible');
      cy.url().should('not.include', '/login');
    });

    it('should handle session expiry gracefully', () => {
      cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
      
      // Simulate session expiry by clearing storage
      cy.window().then((win) => {
        win.localStorage.clear();
        win.sessionStorage.clear();
      });
      
      // Try to navigate
      cy.get('[data-testid="patients-link"]').click();
      
      // Should redirect to login
      cy.url().should('include', '/login');
      cy.contains('Session expired').should('be.visible');
    });
  });
});