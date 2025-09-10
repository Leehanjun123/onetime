import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:3000',
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        table(message) {
          console.table(message);
          return null;
        }
      });
      
      // Load environment variables
      config.env = {
        ...config.env,
        API_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5000',
        TEST_USER_EMAIL: 'test@onetime.kr',
        TEST_USER_PASSWORD: 'Test123!@#',
        TEST_EMPLOYER_EMAIL: 'employer@onetime.kr',
        TEST_EMPLOYER_PASSWORD: 'Employer123!@#'
      };
      
      return config;
    },
  },
  
  component: {
    devServer: {
      framework: 'next',
      bundler: 'webpack',
    },
    specPattern: 'cypress/component/**/*.cy.{js,jsx,ts,tsx}',
  },
  
  env: {
    coverage: false,
  },
  
  retries: {
    runMode: 2,
    openMode: 0,
  },
});