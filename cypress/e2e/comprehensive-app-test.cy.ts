/// <reference types="cypress" />

describe('Comprehensive App Test - Find All Errors', () => {
  // Store all errors found
  const errors: Array<{page: string, error: string, screenshot?: string}> = [];

  beforeEach(() => {
    // Capture all console errors
    cy.on('window:before:load', (win) => {
      cy.stub(win.console, 'error').callsFake((...args) => {
        errors.push({
          page: win.location.pathname,
          error: args.join(' ')
        });
      });
    });

    // Capture uncaught exceptions
    cy.on('uncaught:exception', (err, runnable) => {
      errors.push({
        page: runnable.parent?.title || 'unknown',
        error: err.message
      });
      // Return false to prevent test from failing
      return false;
    });
  });

  describe('Authentication Pages', () => {
    it('should visit login page', () => {
      cy.visit('/login');
      cy.wait(1000);
      cy.get('body').should('be.visible');
      // Check for any error messages
      cy.get('.error, .text-red-500, .text-red-600, .bg-red-50').should('not.exist');
    });

    it('should visit signup page', () => {
      cy.visit('/signup');
      cy.wait(1000);
      cy.get('body').should('be.visible');
    });

    it('should visit forgot password page', () => {
      cy.visit('/forgot-password');
      cy.wait(1000);
      cy.get('body').should('be.visible');
    });
  });

  describe('Main Navigation Pages (Unauthenticated)', () => {
    const mainPages = [
      { path: '/', name: 'Home' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/patients', name: 'Patients' },
      { path: '/tests', name: 'Tests' },
      { path: '/samples', name: 'Samples' },
      { path: '/results', name: 'Results' },
      { path: '/billing', name: 'Billing' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/quality-control', name: 'Quality Control' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' },
      { path: '/admin', name: 'Admin' },
    ];

    mainPages.forEach(({ path, name }) => {
      it(`should attempt to visit ${name} page`, () => {
        cy.visit(path, { failOnStatusCode: false });
        cy.wait(1000);
        // Check if redirected to login or shows error
        cy.url().then(url => {
          if (url.includes('/login')) {
            cy.log(`${name} redirected to login (expected for protected route)`);
          } else {
            cy.get('body').should('be.visible');
            // Look for error indicators
            cy.get('.error-boundary, .error-message, [data-error]').then($el => {
              if ($el.length > 0) {
                cy.screenshot(`error-${name.toLowerCase().replace(/\s+/g, '-')}`);
              }
            });
          }
        });
      });
    });
  });

  describe('Sub-Pages and Features', () => {
    const subPages = [
      // Patient sub-pages
      { path: '/patients/new', name: 'New Patient' },
      { path: '/patients/import', name: 'Import Patients' },
      { path: '/patients/demographics', name: 'Patient Demographics' },
      
      // Test sub-pages
      { path: '/tests/catalog', name: 'Test Catalog' },
      { path: '/tests/panels', name: 'Test Panels' },
      { path: '/tests/orders', name: 'Test Orders' },
      { path: '/tests/new', name: 'New Test' },
      
      // Sample sub-pages
      { path: '/samples/collection', name: 'Sample Collection' },
      { path: '/samples/tracking', name: 'Sample Tracking' },
      { path: '/samples/processing', name: 'Sample Processing' },
      { path: '/samples/storage', name: 'Sample Storage' },
      
      // Results sub-pages
      { path: '/results/entry', name: 'Result Entry' },
      { path: '/results/validation', name: 'Result Validation' },
      { path: '/results/history', name: 'Result History' },
      
      // Billing sub-pages
      { path: '/billing/invoices', name: 'Invoices' },
      { path: '/billing/payments', name: 'Payments' },
      { path: '/billing/insurance', name: 'Insurance Claims' },
      { path: '/billing/pricing', name: 'Pricing' },
      
      // Inventory sub-pages
      { path: '/inventory/reagents', name: 'Reagents' },
      { path: '/inventory/supplies', name: 'Supplies' },
      { path: '/inventory/equipment', name: 'Equipment' },
      { path: '/inventory/orders', name: 'Inventory Orders' },
      
      // QC sub-pages
      { path: '/quality-control/runs', name: 'QC Runs' },
      { path: '/quality-control/rules', name: 'QC Rules' },
      { path: '/quality-control/charts', name: 'QC Charts' },
      
      // Reports sub-pages
      { path: '/reports/patient', name: 'Patient Reports' },
      { path: '/reports/financial', name: 'Financial Reports' },
      { path: '/reports/operational', name: 'Operational Reports' },
      { path: '/reports/regulatory', name: 'Regulatory Reports' },
      
      // Settings sub-pages
      { path: '/settings/profile', name: 'Profile Settings' },
      { path: '/settings/security', name: 'Security Settings' },
      { path: '/settings/preferences', name: 'Preferences' },
      { path: '/settings/notifications', name: 'Notifications' },
      { path: '/settings/integrations', name: 'Integrations' },
      { path: '/settings/two-factor', name: 'Two Factor Auth' },
      
      // Admin sub-pages
      { path: '/admin/users', name: 'User Management' },
      { path: '/admin/roles', name: 'Roles & Permissions' },
      { path: '/admin/audit', name: 'Audit Logs' },
      { path: '/admin/system', name: 'System Configuration' },
      { path: '/admin/backup', name: 'Backup & Restore' },
      { path: '/admin/tenants', name: 'Tenant Management' },
    ];

    subPages.forEach(({ path, name }) => {
      it(`should attempt to visit ${name}`, () => {
        cy.visit(path, { failOnStatusCode: false });
        cy.wait(500);
        
        // Check for various error indicators
        cy.get('body').then($body => {
          // Check for React error boundary
          if ($body.find('.error-boundary').length > 0) {
            errors.push({ 
              page: path, 
              error: 'React Error Boundary triggered',
              screenshot: `error-${name.toLowerCase().replace(/\s+/g, '-')}`
            });
            cy.screenshot(`error-${name.toLowerCase().replace(/\s+/g, '-')}`);
          }
          
          // Check for error messages
          if ($body.find('.error, .text-red-500, .text-red-600, .bg-red-50').length > 0) {
            cy.get('.error, .text-red-500, .text-red-600, .bg-red-50').first().then($el => {
              const errorText = $el.text();
              if (errorText && !errorText.includes('required') && !errorText.includes('invalid')) {
                errors.push({ 
                  page: path, 
                  error: `Error message found: ${errorText}`
                });
              }
            });
          }
          
          // Check for 404 or not found messages
          if ($body.text().includes('404') || $body.text().includes('Not Found') || $body.text().includes('Page not found')) {
            errors.push({ 
              page: path, 
              error: 'Page not found (404)'
            });
          }
        });
      });
    });
  });

  describe('Mobile App Pages', () => {
    const mobileApps = [
      // Patient app
      { path: '/mobile/patient', name: 'Patient Mobile Home' },
      { path: '/mobile/patient/results', name: 'Patient Results' },
      { path: '/mobile/patient/appointments', name: 'Patient Appointments' },
      { path: '/mobile/patient/profile', name: 'Patient Profile' },
      
      // Phlebotomist app
      { path: '/mobile/phlebotomist', name: 'Phlebotomist Home' },
      { path: '/mobile/phlebotomist/schedule', name: 'Phlebotomist Schedule' },
      { path: '/mobile/phlebotomist/collections', name: 'Collections' },
      { path: '/mobile/phlebotomist/route', name: 'Collection Route' },
      
      // Lab Staff app
      { path: '/mobile/lab-staff', name: 'Lab Staff Home' },
      { path: '/mobile/lab-staff/samples', name: 'Lab Staff Samples' },
      { path: '/mobile/lab-staff/processing', name: 'Sample Processing' },
      { path: '/mobile/lab-staff/results', name: 'Lab Staff Results' },
      
      // Clinician app
      { path: '/mobile/clinician', name: 'Clinician Home' },
      { path: '/mobile/clinician/patients', name: 'Clinician Patients' },
      { path: '/mobile/clinician/orders', name: 'Clinician Orders' },
      { path: '/mobile/clinician/results', name: 'Clinician Results' },
    ];

    mobileApps.forEach(({ path, name }) => {
      it(`should visit ${name}`, () => {
        // Set mobile viewport
        cy.viewport('iphone-x');
        cy.visit(path, { failOnStatusCode: false });
        cy.wait(500);
        
        cy.get('body').then($body => {
          if ($body.find('.error, .error-boundary').length > 0) {
            errors.push({ 
              page: path, 
              error: 'Mobile page error detected'
            });
            cy.screenshot(`mobile-error-${name.toLowerCase().replace(/\s+/g, '-')}`);
          }
        });
      });
    });
  });

  describe('Interactive Elements Test', () => {
    it('should test buttons and modals on accessible pages', () => {
      // Test login page interactions
      cy.visit('/login');
      cy.wait(500);
      
      // Test all buttons on the page
      cy.get('button').each(($btn, index) => {
        // Skip submit buttons to avoid form submission
        if (!$btn.text().includes('Sign') && !$btn.text().includes('Login')) {
          cy.wrap($btn).click({ force: true });
          cy.wait(200);
          
          // Check if any modal or error appeared
          cy.get('body').then($body => {
            if ($body.find('.modal, [role="dialog"]').length > 0) {
              cy.log('Modal opened successfully');
              // Close modal if present
              cy.get('[aria-label="Close"], .close-button, button:contains("Cancel")').first().click({ force: true });
            }
          });
        }
      });
    });

    it('should test navigation menu items', () => {
      cy.visit('/');
      cy.wait(500);
      
      // Try to open navigation menu (if exists)
      cy.get('[aria-label="Menu"], .menu-button, button:contains("Menu")').then($menu => {
        if ($menu.length > 0) {
          cy.wrap($menu).first().click({ force: true });
          cy.wait(200);
          
          // Test each menu item
          cy.get('nav a, .menu-item, [role="menuitem"]').each(($item) => {
            const href = $item.attr('href');
            if (href && !href.startsWith('http')) {
              cy.log(`Testing navigation to: ${href}`);
            }
          });
        }
      });
    });
  });

  describe('Form Validation Test', () => {
    it('should test form validations on login page', () => {
      cy.visit('/login');
      cy.wait(500);
      
      // Test empty form submission
      cy.get('form').then($form => {
        if ($form.length > 0) {
          cy.get('button[type="submit"], button:contains("Sign In"), button:contains("Login")').first().click({ force: true });
          cy.wait(200);
          
          // Check for validation errors
          cy.get('.error, .text-red-500, .invalid-feedback').then($errors => {
            if ($errors.length > 0) {
              cy.log('Form validation working correctly');
            } else {
              errors.push({
                page: '/login',
                error: 'Form validation might not be working'
              });
            }
          });
        }
      });
    });
  });

  after(() => {
    // Generate error report
    cy.task('log', '\n\n========== ERROR REPORT ==========\n');
    cy.task('log', `Total errors found: ${errors.length}\n`);
    
    if (errors.length > 0) {
      cy.task('log', '\nDetailed Error List:\n');
      errors.forEach((error, index) => {
        cy.task('log', `${index + 1}. Page: ${error.page}`);
        cy.task('log', `   Error: ${error.error}\n`);
      });
      
      // Save error report to file
      cy.writeFile('cypress/reports/error-report.json', errors);
      cy.writeFile('cypress/reports/error-summary.txt', 
        errors.map(e => `${e.page}: ${e.error}`).join('\n')
      );
    } else {
      cy.task('log', 'No errors detected! 🎉\n');
    }
    
    cy.task('log', '===================================\n');
  });
});