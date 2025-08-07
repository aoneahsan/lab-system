// ***********************************************************
// This file is processed and loaded automatically before your test files.
// You can change the location of this file or turn off loading support files
// with the 'supportFile' configuration option.
// ***********************************************************

// Import commands
import './commands';

// Import testing library commands
import '@testing-library/cypress/add-commands';

// Import file upload support
import 'cypress-file-upload';

// Import real events support
import 'cypress-real-events';

// Hide fetch/XHR requests from command log
const app = window.top;
if (app && !app.document.head.querySelector('[data-hide-command-log-request]')) {
  const style = app.document.createElement('style');
  style.innerHTML = `
    .command-name-request, .command-name-xhr {
      display: none;
    }
  `;
  style.setAttribute('data-hide-command-log-request', '');
  app.document.head.appendChild(style);
}

// Add custom types
declare global {
  namespace Cypress {
    interface Chainable {
      // Authentication commands
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      loginAsAdmin(): Chainable<void>;
      loginAsLabTech(): Chainable<void>;
      loginAsPhlebotomist(): Chainable<void>;
      loginAsDoctor(): Chainable<void>;
      
      // Database commands
      resetDatabase(): Chainable<void>;
      seedDatabase(data: any): Chainable<void>;
      
      // Patient commands
      createPatient(patientData: any): Chainable<string>;
      searchPatient(query: string): Chainable<void>;
      
      // Test order commands
      createTestOrder(orderId: string, tests: string[]): Chainable<void>;
      
      // UI helper commands
      waitForSpinners(): Chainable<void>;
      closeNotification(): Chainable<void>;
      selectFromDropdown(fieldLabel: string, optionText: string): Chainable<void>;
      uploadFile(fileName: string, selector?: string): Chainable<void>;
      
      // Accessibility commands
      checkA11y(context?: any, options?: any): Chainable<void>;
    }
  }
}

// Configure Cypress
Cypress.on('uncaught:exception', (err, runnable) => {
  // Prevent Cypress from failing tests on uncaught exceptions
  // This is especially useful for third-party scripts
  if (err.message.includes('ResizeObserver loop')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  // Let other errors fail the test
  return true;
});

// Add screenshot naming
Cypress.Screenshot.defaults({
  screenshotOnRunFailure: true,
  disableTimersAndAnimations: true,
  scale: false,
  onAfterScreenshot(_$el, props) {
    // Add timestamp to screenshot names
    props.name = `${props.name}-${new Date().toISOString()}`;
  },
});

// Before each test
beforeEach(() => {
  // Clear local storage and cookies
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set default viewport
  cy.viewport(1280, 720);
  
  // Stub analytics
  cy.window().then((win) => {
    win.gtag = cy.stub().as('gtag');
    win.analytics = {
      track: cy.stub().as('analyticsTrack'),
      page: cy.stub().as('analyticsPage'),
      identify: cy.stub().as('analyticsIdentify'),
    };
  });
});

// After each test
afterEach(() => {
  // Log any console errors
  cy.window().then((win) => {
    const consoleError = win.console.error;
    if (consoleError) {
      cy.task('log', 'Console errors detected');
    }
  });
});