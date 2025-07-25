/// <reference types="cypress" />
import '@testing-library/cypress/add-commands';
import 'cypress-real-events/support';

// Custom commands for LabFlow

// Authentication commands
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.visit('/login');
  cy.findByLabelText(/email/i).type(email);
  cy.findByLabelText(/password/i).type(password);
  cy.findByRole('button', { name: /sign in/i }).click();
  cy.findByText(/dashboard/i).should('be.visible');
});

Cypress.Commands.add('logout', () => {
  cy.findByRole('button', { name: /user menu/i }).click();
  cy.findByRole('menuitem', { name: /sign out/i }).click();
  cy.url().should('include', '/login');
});

// Patient management commands
Cypress.Commands.add('createPatient', (patientData) => {
  cy.visit('/patients/new');
  cy.findByLabelText(/first name/i).type(patientData.firstName);
  cy.findByLabelText(/last name/i).type(patientData.lastName);
  cy.findByLabelText(/date of birth/i).type(patientData.dateOfBirth);
  cy.findByLabelText(/gender/i).select(patientData.gender);
  cy.findByLabelText(/email/i).type(patientData.email);
  cy.findByLabelText(/phone/i).type(patientData.phone);
  cy.findByRole('button', { name: /save patient/i }).click();
});

// Sample management commands
Cypress.Commands.add('createSample', (sampleData) => {
  cy.visit('/samples/new');
  cy.findByLabelText(/patient/i).type(sampleData.patientName);
  cy.findByRole('option', { name: new RegExp(sampleData.patientName) }).click();
  cy.findByLabelText(/test/i).select(sampleData.testName);
  cy.findByLabelText(/sample type/i).select(sampleData.sampleType);
  cy.findByRole('button', { name: /create sample/i }).click();
});

// Result entry commands
Cypress.Commands.add('enterResult', (sampleId: string, resultData) => {
  cy.visit(`/results/${sampleId}`);
  cy.findByLabelText(/result value/i).clear().type(resultData.value);
  cy.findByLabelText(/unit/i).select(resultData.unit);
  if (resultData.notes) {
    cy.findByLabelText(/notes/i).type(resultData.notes);
  }
  cy.findByRole('button', { name: /save result/i }).click();
});

// Navigation commands
Cypress.Commands.add('navigateToModule', (moduleName: string) => {
  cy.findByRole('navigation').within(() => {
    cy.findByText(new RegExp(moduleName, 'i')).click();
  });
  cy.url().should('include', moduleName.toLowerCase().replace(/\s+/g, '-'));
});

// Data cleanup commands
Cypress.Commands.add('cleanupTestData', () => {
  cy.task('clearTestData');
});

// Wait for Firebase
Cypress.Commands.add('waitForFirebase', () => {
  cy.window().its('firebase').should('exist');
  cy.wait(1000); // Additional wait for Firebase to initialize
});

// Mock Firebase Auth
Cypress.Commands.add('mockFirebaseAuth', (user) => {
  cy.window().then((win) => {
    // Mock Firebase auth state
    const mockAuth = {
      currentUser: user,
      onAuthStateChanged: (callback: Function) => {
        callback(user);
        return () => {};
      },
      signInWithEmailAndPassword: () => Promise.resolve({ user }),
      signOut: () => Promise.resolve(),
    };
    (win as any).mockAuth = mockAuth;
  });
});

// Intercept API calls
Cypress.Commands.add('interceptAPI', () => {
  // Patient API
  cy.intercept('GET', '**/patients*', { fixture: 'patients.json' }).as('getPatients');
  cy.intercept('POST', '**/patients', { statusCode: 201 }).as('createPatient');
  
  // Sample API
  cy.intercept('GET', '**/samples*', { fixture: 'samples.json' }).as('getSamples');
  cy.intercept('POST', '**/samples', { statusCode: 201 }).as('createSample');
  
  // Result API
  cy.intercept('GET', '**/results*', { fixture: 'results.json' }).as('getResults');
  cy.intercept('PUT', '**/results/*', { statusCode: 200 }).as('updateResult');
});

// Accessibility commands
Cypress.Commands.add('checkA11y', (context?, options?) => {
  cy.injectAxe();
  cy.checkA11y(context, options);
});

// TypeScript support
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createPatient(patientData: {
        firstName: string;
        lastName: string;
        dateOfBirth: string;
        gender: string;
        email: string;
        phone: string;
      }): Chainable<void>;
      createSample(sampleData: {
        patientName: string;
        testName: string;
        sampleType: string;
      }): Chainable<void>;
      enterResult(sampleId: string, resultData: {
        value: string;
        unit: string;
        notes?: string;
      }): Chainable<void>;
      navigateToModule(moduleName: string): Chainable<void>;
      cleanupTestData(): Chainable<void>;
      waitForFirebase(): Chainable<void>;
      mockFirebaseAuth(user: any): Chainable<void>;
      interceptAPI(): Chainable<void>;
      checkA11y(context?: any, options?: any): Chainable<void>;
    }
  }
}

export {};