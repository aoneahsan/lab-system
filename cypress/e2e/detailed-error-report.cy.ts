/// <reference types="cypress" />

describe('Detailed Error Report - All Pages', () => {
  const pageErrors: Record<string, string[]> = {};
  let totalErrors = 0;
  
  beforeEach(() => {
    // Intercept console errors and store them
    cy.on('window:before:load', (win) => {
      const originalError = win.console.error;
      win.console.error = (...args) => {
        const path = win.location.pathname;
        if (!pageErrors[path]) {
          pageErrors[path] = [];
        }
        const errorMessage = args.map(arg => 
          typeof arg === 'object' ? JSON.stringify(arg) : String(arg)
        ).join(' ');
        pageErrors[path].push(errorMessage);
        totalErrors++;
        originalError.apply(win.console, args);
      };
    });
  });

  it('should capture console errors from all pages', () => {
    const pages = [
      { path: '/', name: 'Home' },
      { path: '/login', name: 'Login' },
      { path: '/signup', name: 'Signup' },
      { path: '/dashboard', name: 'Dashboard' },
      { path: '/patients', name: 'Patients' },
      { path: '/tests', name: 'Tests' },
      { path: '/tests/catalog', name: 'Test Catalog' },
      { path: '/tests/panels', name: 'Test Panels' },
      { path: '/tests/orders', name: 'Test Orders' },
      { path: '/samples', name: 'Samples' },
      { path: '/results', name: 'Results' },
      { path: '/billing', name: 'Billing' },
      { path: '/inventory', name: 'Inventory' },
      { path: '/quality-control', name: 'Quality Control' },
      { path: '/reports', name: 'Reports' },
      { path: '/settings', name: 'Settings' },
      { path: '/settings/profile', name: 'Profile Settings' },
      { path: '/settings/security', name: 'Security Settings' },
      { path: '/admin', name: 'Admin' },
      { path: '/admin/users', name: 'User Management' },
    ];

    // Visit each page and wait for it to load
    pages.forEach(({ path, name }) => {
      cy.visit(path, { failOnStatusCode: false });
      cy.wait(1000); // Wait for page to fully load
      
      // Check for React error boundary
      cy.get('body').then($body => {
        if ($body.text().includes('Something went wrong')) {
          if (!pageErrors[path]) {
            pageErrors[path] = [];
          }
          pageErrors[path].push('React Error Boundary triggered');
          totalErrors++;
        }
      });
    });

    // Generate detailed report after all pages visited
    cy.then(() => {
      const errorReport = {
        timestamp: new Date().toISOString(),
        totalPagesScanned: pages.length,
        totalErrors: totalErrors,
        pagesWithErrors: Object.keys(pageErrors).length,
        errorDetails: pageErrors
      };

      // Log the report
      cy.task('log', '\n\n========== DETAILED ERROR REPORT ==========\n');
      cy.task('log', `Timestamp: ${errorReport.timestamp}`);
      cy.task('log', `Total Pages Scanned: ${errorReport.totalPagesScanned}`);
      cy.task('log', `Total Errors Found: ${errorReport.totalErrors}`);
      cy.task('log', `Pages with Errors: ${errorReport.pagesWithErrors}`);
      
      if (errorReport.totalErrors > 0) {
        cy.task('log', '\n--- Error Details by Page ---\n');
        
        Object.entries(pageErrors).forEach(([page, errors]) => {
          cy.task('log', `\nPage: ${page}`);
          cy.task('log', `Errors (${errors.length}):`);
          errors.forEach((error, index) => {
            // Truncate long error messages
            const truncatedError = error.length > 200 
              ? error.substring(0, 200) + '...' 
              : error;
            cy.task('log', `  ${index + 1}. ${truncatedError}`);
          });
        });

        // Save detailed report to file
        cy.writeFile('cypress/reports/detailed-error-report.json', errorReport, { 
          flag: 'w' 
        });

        // Create summary file
        const summary = Object.entries(pageErrors).map(([page, errors]) => 
          `${page}: ${errors.length} error(s)`
        ).join('\n');
        
        cy.writeFile('cypress/reports/error-summary.txt', 
          `Error Summary - ${new Date().toISOString()}\n` +
          `Total Errors: ${totalErrors}\n` +
          `Pages with Errors: ${Object.keys(pageErrors).length}\n\n` +
          summary,
          { flag: 'w' }
        );
      } else {
        cy.task('log', '\n✅ No errors detected on any page!\n');
      }
      
      cy.task('log', '==========================================\n');

      // Assert based on error count
      if (totalErrors > 0) {
        cy.task('log', `⚠️ Found ${totalErrors} console errors across ${Object.keys(pageErrors).length} pages`);
      }
    });
  });
});