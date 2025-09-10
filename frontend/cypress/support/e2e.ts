// ***********************************************************
// This file is processed and loaded automatically before test files.
// You can change the location of this file or turn off processing it.
// ***********************************************************

import './commands';
import '@testing-library/cypress/add-commands';
import 'cypress-real-events';

// Prevent Cypress from failing tests on uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // Return false to prevent the error from failing the test
  if (err.message.includes('ResizeObserver')) {
    return false;
  }
  if (err.message.includes('Non-Error promise rejection')) {
    return false;
  }
  return true;
});

// Add custom types
declare global {
  namespace Cypress {
    interface Chainable {
      login(email: string, password: string): Chainable<void>;
      logout(): Chainable<void>;
      createJob(jobData: any): Chainable<void>;
      applyToJob(jobId: string): Chainable<void>;
      checkAccessibility(): Chainable<void>;
      waitForApi(alias: string): Chainable<void>;
      mockGeolocation(latitude: number, longitude: number): Chainable<void>;
      clearAllData(): Chainable<void>;
      seedDatabase(): Chainable<void>;
    }
  }
}

// Configure viewport for mobile tests
before(() => {
  if (Cypress.env('MOBILE')) {
    cy.viewport('iphone-x');
  }
});

// Clear data before each test
beforeEach(() => {
  cy.clearAllData();
  
  // Set up API intercepts
  cy.intercept('GET', '/api/**').as('apiGet');
  cy.intercept('POST', '/api/**').as('apiPost');
  cy.intercept('PUT', '/api/**').as('apiPut');
  cy.intercept('DELETE', '/api/**').as('apiDelete');
});

// Clean up after tests
after(() => {
  cy.task('log', 'All tests completed');
});