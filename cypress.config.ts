import { defineConfig } from 'cypress';
import viteConfig from './vite.config';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    specPattern: 'cypress/e2e/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/e2e.ts',
    video: true,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    projectId: 'labflow-e2e',
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      apiUrl: 'http://localhost:5001/labsystem-a1/us-central1',
      coverage: true,
      TEST_EMAIL: 'test@labflow.com',
      TEST_PASSWORD: 'Test123!@#',
      TEST_TENANT_CODE: 'demo-lab',
    },
    setupNodeEvents(on, config) {
      // Task to reset database for tests
      on('task', {
        async resetDatabase() {
          // Reset test database
          console.log('Resetting test database...');
          return null;
        },
        async seedDatabase(data) {
          // Seed test database with data
          console.log('Seeding database with:', data);
          return null;
        },
        async getTestUsers() {
          // Return test user credentials
          return {
            admin: {
              email: 'admin@labflow-test.com',
              password: 'TestAdmin123!',
            },
            labTech: {
              email: 'tech@labflow-test.com',
              password: 'TestTech123!',
            },
            phlebotomist: {
              email: 'phlebotomist@labflow-test.com',
              password: 'TestPhleb123!',
            },
            doctor: {
              email: 'doctor@labflow-test.com',
              password: 'TestDoc123!',
            },
          };
        },
        log(message) {
          console.log(message);
          return null;
        },
      });

      // Handle browser launch options
      on('before:browser:launch', (browser, launchOptions) => {
        if (browser.name === 'chrome' && browser.isHeadless) {
          launchOptions.args.push('--disable-gpu');
          launchOptions.args.push('--no-sandbox');
          launchOptions.args.push('--disable-dev-shm-usage');
        }
        return launchOptions;
      });

      return config;
    },
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
      viteConfig,
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
    video: false,
    screenshotOnRunFailure: true,
    viewportWidth: 1280,
    viewportHeight: 720,
  },
});