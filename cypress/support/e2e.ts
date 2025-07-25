// ***********************************************************
// This file is processed and loaded automatically before test files.
// ***********************************************************

import './commands';
import 'cypress-real-events/support';

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Ignore Firebase auth errors in tests
  if (err.message.includes('Firebase')) {
    return false;
  }
  // Ignore React hydration errors
  if (err.message.includes('Hydration')) {
    return false;
  }
  return true;
});

// Before each test
beforeEach(() => {
  // Clear localStorage and sessionStorage
  cy.clearLocalStorage();
  cy.clearCookies();
  
  // Set up API intercepts
  cy.interceptAPI();
  
  // Visit the app
  cy.visit('/');
});

// After each test
afterEach(() => {
  // Take screenshot on failure
  if (Cypress.currentTest.state === 'failed') {
    cy.screenshot(`${Cypress.currentTest.title}-failed`);
  }
});