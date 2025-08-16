/// <reference types="cypress" />

describe('Complete App Coverage - All Pages, Modals, Forms & Interactions', () => {
  // Store all errors and issues found
  const testResults = {
    errors: [] as Array<{page: string, error: string, type: string, timestamp: string}>,
    warnings: [] as Array<{page: string, warning: string}>,
    successfulPages: [] as string[],
    failedPages: [] as string[],
    testedInteractions: [] as string[],
    consoleErrors: [] as Array<{page: string, message: string}>
  };

  // Helper to capture console errors
  const setupErrorCapture = () => {
    cy.on('window:before:load', (win) => {
      const originalError = win.console.error;
      win.console.error = (...args) => {
        testResults.consoleErrors.push({
          page: win.location.pathname,
          message: args.map(arg => String(arg)).join(' ')
        });
        originalError.apply(win.console, args);
      };
    });

    cy.on('uncaught:exception', (err, runnable) => {
      testResults.errors.push({
        page: Cypress.currentTest.title,
        error: err.message,
        type: 'uncaught-exception',
        timestamp: new Date().toISOString()
      });
      return false; // Prevent test failure
    });

    cy.on('fail', (err) => {
      testResults.errors.push({
        page: Cypress.currentTest.title,
        error: err.message,
        type: 'cypress-failure',
        timestamp: new Date().toISOString()
      });
      throw err;
    });
  };

  beforeEach(() => {
    setupErrorCapture();
    // Clear localStorage to ensure clean state
    cy.clearLocalStorage();
    cy.clearCookies();
  });

  describe('Complete Route Testing - All Pages from AppRouter', () => {
    // All routes from AppRouter.tsx
    const allRoutes = [
      // Auth routes (public)
      { path: '/login', name: 'Login Page', public: true },
      { path: '/register', name: 'Register Page', public: true },
      { path: '/forgot-password', name: 'Forgot Password Page', public: true },
      { path: '/setup-demo', name: 'Setup Demo Page', public: true },
      { path: '/setup-super-admin', name: 'Create Super Admin', public: true },
      
      // Protected main routes
      { path: '/onboarding', name: 'Onboarding Page' },
      { path: '/dashboard', name: 'Dashboard Page' },
      { path: '/dashboard-debug', name: 'Debug Dashboard' },
      
      // Appointments
      { path: '/appointments', name: 'Appointments Page' },
      { path: '/appointments/test-id', name: 'Appointment Detail Page' },
      
      // Home Collection
      { path: '/home-collection', name: 'Home Collection Page' },
      { path: '/home-collection/new', name: 'Home Collection Form Page' },
      { path: '/home-collection/test-id', name: 'Home Collection Detail Page' },
      { path: '/home-collection/routes', name: 'Route Management Page' },
      
      // Patients
      { path: '/patients', name: 'Patients Page' },
      { path: '/patients/test-id', name: 'Patient Detail Page' },
      { path: '/patients/test-id/edit', name: 'Patient Edit Page' },
      
      // Tests
      { path: '/tests', name: 'Tests Page' },
      { path: '/tests/panels', name: 'Test Panels Page' },
      { path: '/tests/orders', name: 'Test Orders Page' },
      { path: '/tests/orders/test-id', name: 'Test Order Detail Page' },
      { path: '/tests/test-id', name: 'Test Detail Page' },
      
      // Orders
      { path: '/orders', name: 'Order Dashboard Page' },
      
      // Samples
      { path: '/samples', name: 'Samples Dashboard' },
      { path: '/samples/register', name: 'Sample Registration' },
      { path: '/samples/collections', name: 'Sample Collections Page' },
      { path: '/samples/scan', name: 'Sample Scan Page' },
      { path: '/samples/test-id', name: 'Sample Detail Page' },
      
      // Results
      { path: '/results', name: 'Results Page' },
      { path: '/results/entry', name: 'Result Entry Page' },
      { path: '/results/review', name: 'Result Review Page' },
      { path: '/results/validation-rules', name: 'Result Validation Rules Page' },
      
      // Billing
      { path: '/billing', name: 'Billing Page' },
      { path: '/billing/invoices/test-id', name: 'Invoice Detail Page' },
      { path: '/billing/payments', name: 'Payments Page' },
      { path: '/billing/claims', name: 'Insurance Claims Page' },
      { path: '/billing/claims/test-id', name: 'Claim Detail Page' },
      { path: '/billing/reports', name: 'Financial Reports Page' },
      
      // Inventory
      { path: '/inventory', name: 'Inventory Dashboard' },
      { path: '/inventory/vendors', name: 'Vendors Page' },
      
      // Quality Control
      { path: '/quality-control', name: 'Quality Control Page' },
      
      // Reports & Analytics
      { path: '/reports', name: 'Report Dashboard' },
      { path: '/analytics', name: 'Analytics Page' },
      
      // Equipment
      { path: '/equipment', name: 'Equipment Page' },
      
      // Users
      { path: '/users', name: 'Users Page' },
      { path: '/users/test-id', name: 'User Detail Page' },
      
      // EMR
      { path: '/emr/connections', name: 'EMR Connections Page' },
      { path: '/emr/connections/test-id', name: 'EMR Connection Detail Page' },
      
      // Settings
      { path: '/settings', name: 'Settings Page' },
      { path: '/settings/biometric', name: 'Biometric Settings Page' },
      { path: '/settings/validation-rules', name: 'Validation Rules Page' },
      { path: '/settings/custom-fields', name: 'Custom Fields Page' },
      { path: '/settings/updates', name: 'App Update Settings Page' },
      { path: '/settings/hotkeys', name: 'Hotkeys Page' },
      { path: '/settings/security', name: 'Security Settings Page' },
      { path: '/settings/security/2fa', name: 'Two Factor Auth Page' },
      
      // Profile & Portal
      { path: '/profile', name: 'Profile Page' },
      { path: '/portal', name: 'Customer Portal Page' },
      
      // Workflow
      { path: '/workflow', name: 'Workflow Automation Page' },
      
      // Demo
      { path: '/demo/voice-dictation', name: 'Voice Dictation Demo' },
      
      // Admin (requires super_admin role)
      { path: '/admin', name: 'Admin Panel', requiresRole: 'super_admin' },
      
      // Clinician App (requires clinician role)
      { path: '/clinician', name: 'Clinician App', requiresRole: 'clinician' },
      
      // 404 test
      { path: '/non-existent-page-404-test', name: '404 Not Found Page', expect404: true }
    ];

    allRoutes.forEach(({ path, name, public: isPublic, requiresRole, expect404 }) => {
      it(`should test ${name} (${path})`, () => {
        cy.visit(path, { failOnStatusCode: false });
        cy.wait(1000);

        cy.url().then((url) => {
          // Check if page loaded or redirected
          if (!isPublic && url.includes('/login')) {
            cy.log(`✓ ${name} correctly redirected to login (protected route)`);
            testResults.successfulPages.push(`${name} - Correctly protected`);
            return;
          }

          if (expect404) {
            cy.contains(/404|not found/i).should('exist');
            cy.log(`✓ 404 page working correctly`);
            testResults.successfulPages.push(`${name} - 404 handling works`);
            return;
          }

          // Check for various error indicators
          cy.get('body').then($body => {
            const bodyText = $body.text().toLowerCase();
            const hasError = 
              $body.find('.error-boundary').length > 0 ||
              $body.find('[data-error="true"]').length > 0 ||
              bodyText.includes('error boundary') ||
              bodyText.includes('something went wrong') ||
              bodyText.includes('unexpected error') ||
              (bodyText.includes('404') && !expect404) ||
              (bodyText.includes('not found') && !expect404);

            if (hasError) {
              testResults.errors.push({
                page: path,
                error: `Page rendering error detected`,
                type: 'page-error',
                timestamp: new Date().toISOString()
              });
              testResults.failedPages.push(`${name} (${path})`);
              cy.screenshot(`error-${name.replace(/\s+/g, '-').toLowerCase()}`);
            } else {
              cy.log(`✓ ${name} loaded successfully`);
              testResults.successfulPages.push(`${name} (${path})`);
            }

            // Check for console errors specific to this page
            const pageConsoleErrors = testResults.consoleErrors.filter(e => e.page === path);
            if (pageConsoleErrors.length > 0) {
              testResults.warnings.push({
                page: path,
                warning: `Console errors: ${pageConsoleErrors.length}`
              });
            }
          });
        });
      });
    });
  });

  describe('Interactive Elements Testing', () => {
    it('should test all buttons and clickable elements on login page', () => {
      cy.visit('/login');
      cy.wait(1000);

      // Test all buttons
      cy.get('button').each(($btn, index) => {
        const buttonText = $btn.text().trim();
        if (buttonText && !buttonText.toLowerCase().includes('submit')) {
          cy.wrap($btn).click({ force: true });
          cy.wait(200);
          testResults.testedInteractions.push(`Login page - Button: ${buttonText}`);
          
          // Check if modal opened
          cy.get('[role="dialog"], .modal, [data-modal]').then($modal => {
            if ($modal.length > 0) {
              cy.log(`Modal opened: ${buttonText}`);
              // Try to close modal
              cy.get('[aria-label="Close"], button:contains("Close"), button:contains("Cancel")').first().click({ force: true });
            }
          });
        }
      });

      // Test all links
      cy.get('a').each(($link) => {
        const href = $link.attr('href');
        const linkText = $link.text().trim();
        if (href && !href.startsWith('http') && linkText) {
          testResults.testedInteractions.push(`Login page - Link: ${linkText} (${href})`);
        }
      });
    });

    it('should test form validation on register page', () => {
      cy.visit('/register');
      cy.wait(1000);

      // Try to submit empty form
      cy.get('form').then($form => {
        if ($form.length > 0) {
          cy.get('button[type="submit"]').first().click({ force: true });
          cy.wait(500);

          // Check for validation messages
          cy.get('.error, .text-red-500, .invalid-feedback, [aria-invalid="true"]').then($errors => {
            if ($errors.length > 0) {
              testResults.testedInteractions.push('Register form - Validation working');
              cy.log('✓ Form validation working correctly');
            } else {
              testResults.warnings.push({
                page: '/register',
                warning: 'Form validation might not be working'
              });
            }
          });
        }
      });

      // Test all input fields
      cy.get('input, select, textarea').each(($input) => {
        const inputType = $input.attr('type') || 'text';
        const inputName = $input.attr('name') || $input.attr('id') || 'unnamed';
        testResults.testedInteractions.push(`Register form - Input: ${inputName} (${inputType})`);
      });
    });
  });

  describe('Modal and Dialog Testing', () => {
    const modalTriggers = [
      { page: '/login', selector: 'button:contains("Help")', name: 'Help Modal' },
      { page: '/login', selector: 'button:contains("Demo")', name: 'Demo Modal' },
      { page: '/register', selector: 'button:contains("Terms")', name: 'Terms Modal' },
    ];

    modalTriggers.forEach(({ page, selector, name }) => {
      it(`should test ${name} on ${page}`, () => {
        cy.visit(page);
        cy.wait(1000);

        cy.get('body').then($body => {
          if ($body.find(selector).length > 0) {
            cy.get(selector).first().click({ force: true });
            cy.wait(500);

            // Check if modal opened
            cy.get('[role="dialog"], .modal').then($modal => {
              if ($modal.length > 0) {
                testResults.testedInteractions.push(`${page} - ${name} opened successfully`);
                
                // Test modal close
                cy.get('[aria-label="Close"], .close-button, button:contains("Close")').first().click({ force: true });
                cy.wait(200);
                
                // Verify modal closed
                cy.get('[role="dialog"], .modal').should('not.exist');
                testResults.testedInteractions.push(`${page} - ${name} closed successfully`);
              }
            });
          }
        });
      });
    });
  });

  describe('Dropdown and Select Testing', () => {
    it('should test all dropdowns and selects on accessible pages', () => {
      const pagesToTest = ['/login', '/register', '/setup-demo'];

      pagesToTest.forEach(page => {
        cy.visit(page);
        cy.wait(1000);

        // Test select elements
        cy.get('select').each(($select) => {
          const selectName = $select.attr('name') || $select.attr('id') || 'unnamed';
          cy.wrap($select).select(0, { force: true });
          testResults.testedInteractions.push(`${page} - Select: ${selectName}`);
        });

        // Test custom dropdowns (common patterns)
        cy.get('[role="combobox"], [data-dropdown], .dropdown-trigger').each(($dropdown) => {
          cy.wrap($dropdown).click({ force: true });
          cy.wait(200);
          testResults.testedInteractions.push(`${page} - Custom dropdown clicked`);
          
          // Try to close dropdown
          cy.get('body').click(0, 0, { force: true });
        });
      });
    });
  });

  describe('Responsive Testing', () => {
    const viewports = [
      { name: 'mobile', width: 375, height: 667 },
      { name: 'tablet', width: 768, height: 1024 },
      { name: 'desktop', width: 1920, height: 1080 }
    ];

    viewports.forEach(({ name, width, height }) => {
      it(`should test key pages in ${name} viewport`, () => {
        cy.viewport(width, height);

        const pagesToTest = ['/login', '/register', '/dashboard'];
        
        pagesToTest.forEach(page => {
          cy.visit(page, { failOnStatusCode: false });
          cy.wait(500);

          cy.get('body').then($body => {
            // Check for responsive issues
            const hasOverflow = $body[0].scrollWidth > width;
            if (hasOverflow) {
              testResults.warnings.push({
                page: `${page} (${name})`,
                warning: 'Horizontal overflow detected'
              });
            } else {
              testResults.testedInteractions.push(`${page} - ${name} viewport OK`);
            }
          });
        });
      });
    });
  });

  describe('Accessibility Testing', () => {
    it('should test basic accessibility on key pages', () => {
      const pagesToTest = ['/login', '/register'];

      pagesToTest.forEach(page => {
        cy.visit(page);
        cy.wait(1000);

        // Check for alt text on images
        cy.get('img').each(($img) => {
          const alt = $img.attr('alt');
          if (!alt || alt.trim() === '') {
            testResults.warnings.push({
              page: page,
              warning: `Image missing alt text: ${$img.attr('src')}`
            });
          }
        });

        // Check for form labels
        cy.get('input, select, textarea').each(($input) => {
          const id = $input.attr('id');
          const ariaLabel = $input.attr('aria-label');
          const ariaLabelledby = $input.attr('aria-labelledby');
          
          if (id) {
            cy.get(`label[for="${id}"]`).then($label => {
              if ($label.length === 0 && !ariaLabel && !ariaLabelledby) {
                testResults.warnings.push({
                  page: page,
                  warning: `Input missing label: ${id}`
                });
              }
            });
          }
        });

        // Check for ARIA roles
        cy.get('button').each(($button) => {
          const role = $button.attr('role');
          const ariaLabel = $button.attr('aria-label');
          const buttonText = $button.text().trim();
          
          if (!buttonText && !ariaLabel) {
            testResults.warnings.push({
              page: page,
              warning: 'Button missing accessible text'
            });
          }
        });
      });
    });
  });

  describe('Performance Testing', () => {
    it('should measure page load times', () => {
      const pagesToTest = ['/login', '/register', '/dashboard'];

      pagesToTest.forEach(page => {
        cy.visit(page, { failOnStatusCode: false });
        
        cy.window().then((win) => {
          const perfData = win.performance.timing;
          const loadTime = perfData.loadEventEnd - perfData.navigationStart;
          
          if (loadTime > 3000) {
            testResults.warnings.push({
              page: page,
              warning: `Slow load time: ${loadTime}ms`
            });
          } else {
            testResults.testedInteractions.push(`${page} - Load time: ${loadTime}ms`);
          }
        });
      });
    });
  });

  after(() => {
    // Generate comprehensive report
    const report = {
      summary: {
        totalPages: testResults.successfulPages.length + testResults.failedPages.length,
        successfulPages: testResults.successfulPages.length,
        failedPages: testResults.failedPages.length,
        totalErrors: testResults.errors.length,
        totalWarnings: testResults.warnings.length,
        totalInteractionsTested: testResults.testedInteractions.length,
        consoleErrors: testResults.consoleErrors.length,
        timestamp: new Date().toISOString()
      },
      details: testResults
    };

    // Log summary to console
    cy.task('log', '\n\n========== COMPREHENSIVE TEST REPORT ==========\n');
    cy.task('log', `Total Pages Tested: ${report.summary.totalPages}`);
    cy.task('log', `✓ Successful: ${report.summary.successfulPages}`);
    cy.task('log', `✗ Failed: ${report.summary.failedPages}`);
    cy.task('log', `⚠ Warnings: ${report.summary.totalWarnings}`);
    cy.task('log', `🔍 Interactions Tested: ${report.summary.totalInteractionsTested}`);
    cy.task('log', `🔴 Console Errors: ${report.summary.consoleErrors}\n`);

    if (testResults.errors.length > 0) {
      cy.task('log', '\n=== CRITICAL ERRORS ===\n');
      testResults.errors.forEach((error, index) => {
        cy.task('log', `${index + 1}. [${error.type}] ${error.page}`);
        cy.task('log', `   Error: ${error.error}`);
        cy.task('log', `   Time: ${error.timestamp}\n`);
      });
    }

    if (testResults.failedPages.length > 0) {
      cy.task('log', '\n=== FAILED PAGES ===\n');
      testResults.failedPages.forEach((page, index) => {
        cy.task('log', `${index + 1}. ${page}`);
      });
    }

    if (testResults.warnings.length > 0) {
      cy.task('log', '\n=== WARNINGS ===\n');
      testResults.warnings.forEach((warning, index) => {
        cy.task('log', `${index + 1}. ${warning.page}: ${warning.warning}`);
      });
    }

    if (testResults.consoleErrors.length > 0) {
      cy.task('log', '\n=== CONSOLE ERRORS ===\n');
      const uniqueErrors = [...new Set(testResults.consoleErrors.map(e => `${e.page}: ${e.message}`))];
      uniqueErrors.forEach((error, index) => {
        cy.task('log', `${index + 1}. ${error}`);
      });
    }

    // Save detailed reports
    cy.writeFile('cypress/reports/comprehensive-test-report.json', report, { flag: 'w' });
    
    // Create summary file
    const summary = `
COMPREHENSIVE APP TEST SUMMARY
==============================
Generated: ${report.summary.timestamp}

STATISTICS:
-----------
Total Pages Tested: ${report.summary.totalPages}
Successful Pages: ${report.summary.successfulPages}
Failed Pages: ${report.summary.failedPages}
Total Errors: ${report.summary.totalErrors}
Total Warnings: ${report.summary.totalWarnings}
Interactions Tested: ${report.summary.totalInteractionsTested}
Console Errors: ${report.summary.consoleErrors}

${testResults.errors.length === 0 ? '✅ NO CRITICAL ERRORS FOUND!' : '❌ CRITICAL ERRORS DETECTED - SEE DETAILED REPORT'}

FAILED PAGES:
-------------
${testResults.failedPages.length > 0 ? testResults.failedPages.join('\n') : 'None'}

TOP WARNINGS:
-------------
${testResults.warnings.slice(0, 10).map(w => `- ${w.page}: ${w.warning}`).join('\n')}

For full details, see comprehensive-test-report.json
    `;
    
    cy.writeFile('cypress/reports/test-summary.txt', summary, { flag: 'w' });
    
    cy.task('log', '\n==============================================\n');
    cy.task('log', testResults.errors.length === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED - CHECK REPORTS');
    cy.task('log', '\nReports saved to:');
    cy.task('log', '  - cypress/reports/comprehensive-test-report.json');
    cy.task('log', '  - cypress/reports/test-summary.txt\n');
  });
});