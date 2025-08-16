/// <reference types="cypress" />

describe('Quick Error Scan - All Pages', () => {
  const errors: string[] = [];
  
  beforeEach(() => {
    // Capture console errors
    cy.on('window:before:load', (win) => {
      const originalError = win.console.error;
      win.console.error = (...args) => {
        errors.push(`[${win.location.pathname}] ${args.join(' ')}`);
        originalError.apply(win.console, args);
      };
    });
    
    // Don't fail on uncaught exceptions
    cy.on('uncaught:exception', (err) => {
      errors.push(`[EXCEPTION] ${err.message}`);
      return false;
    });
  });

  it('should quickly scan all main pages for errors', () => {
    const pages = [
      '/',
      '/login',
      '/signup',
      '/dashboard',
      '/patients',
      '/tests',
      '/tests/catalog',
      '/tests/panels', 
      '/tests/orders',
      '/samples',
      '/results',
      '/billing',
      '/inventory',
      '/quality-control',
      '/reports',
      '/settings',
      '/settings/profile',
      '/settings/security',
      '/settings/two-factor',
      '/admin',
      '/admin/users',
      '/mobile/patient',
      '/mobile/phlebotomist',
      '/mobile/lab-staff',
      '/mobile/clinician',
    ];

    pages.forEach(page => {
      cy.visit(page, { failOnStatusCode: false });
      cy.wait(500); // Quick wait for page to load
    });

    // Report errors at the end
    cy.then(() => {
      if (errors.length > 0) {
        console.log('\n=== ERRORS FOUND ===');
        errors.forEach((error, i) => {
          console.log(`${i + 1}. ${error}`);
        });
        console.log(`\nTotal errors: ${errors.length}`);
      } else {
        console.log('\n✅ No errors detected!');
      }
    });
  });
});