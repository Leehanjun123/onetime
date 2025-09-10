/// <reference types="cypress" />

// Login command
Cypress.Commands.add('login', (email: string, password: string) => {
  cy.session(
    [email, password],
    () => {
      cy.visit('/login');
      cy.get('input[name="email"]').type(email);
      cy.get('input[name="password"]').type(password);
      cy.get('button[type="submit"]').click();
      
      // Wait for login to complete
      cy.url().should('not.include', '/login');
      cy.window().its('localStorage.token').should('exist');
    },
    {
      validate() {
        cy.window().its('localStorage.token').should('exist');
      },
      cacheAcrossSpecs: true,
    }
  );
});

// Logout command
Cypress.Commands.add('logout', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
  });
  cy.clearCookies();
  cy.visit('/');
});

// Create job command
Cypress.Commands.add('createJob', (jobData) => {
  const defaultJob = {
    title: 'Test Job',
    category: 'DELIVERY',
    location: '서울 강남구',
    address: '테헤란로 123',
    wage: 15000,
    workDate: new Date(Date.now() + 86400000).toISOString(),
    startTime: '09:00',
    endTime: '18:00',
    description: 'Test job description',
    requirements: ['신분증 필수', '안전화 지참'],
    urgent: false,
    maxApplicants: 5
  };
  
  const job = { ...defaultJob, ...jobData };
  
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/jobs`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: job,
  }).then((response) => {
    expect(response.status).to.equal(201);
    return response.body.data;
  });
});

// Apply to job command
Cypress.Commands.add('applyToJob', (jobId: string) => {
  cy.request({
    method: 'POST',
    url: `${Cypress.env('API_URL')}/api/jobs/${jobId}/apply`,
    headers: {
      Authorization: `Bearer ${window.localStorage.getItem('token')}`,
    },
    body: {
      message: 'Test application message',
      availableDate: new Date().toISOString(),
    },
  }).then((response) => {
    expect(response.status).to.equal(201);
  });
});

// Check accessibility
Cypress.Commands.add('checkAccessibility', () => {
  cy.injectAxe();
  cy.checkA11y(null, {
    rules: {
      'color-contrast': { enabled: false }, // Disable for now
    },
  });
});

// Wait for API with timeout
Cypress.Commands.add('waitForApi', (alias: string) => {
  cy.wait(alias, { timeout: 10000 });
});

// Mock geolocation
Cypress.Commands.add('mockGeolocation', (latitude: number, longitude: number) => {
  cy.window().then((win) => {
    cy.stub(win.navigator.geolocation, 'getCurrentPosition').callsFake((success) => {
      success({
        coords: {
          latitude,
          longitude,
          accuracy: 10,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: Date.now(),
      });
    });
  });
});

// Clear all data
Cypress.Commands.add('clearAllData', () => {
  cy.window().then((win) => {
    win.localStorage.clear();
    win.sessionStorage.clear();
    if ('caches' in win) {
      win.caches.keys().then((names) => {
        names.forEach((name) => {
          win.caches.delete(name);
        });
      });
    }
  });
  cy.clearCookies();
  cy.clearLocalStorage();
});

// Seed database with test data
Cypress.Commands.add('seedDatabase', () => {
  cy.task('seedDatabase');
});

export {};