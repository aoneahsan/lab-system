import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    chromeWebSecurity: false,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 10000,
    pageLoadTimeout: 30000,
    retries: {
      runMode: 2,
      openMode: 0,
    },
    env: {
      FIREBASE_API_KEY: 'test-api-key',
      FIREBASE_AUTH_DOMAIN: 'test.firebaseapp.com',
      FIREBASE_PROJECT_ID: 'test-project',
      TEST_EMAIL: 'test@labflow.com',
      TEST_PASSWORD: 'Test123!@#',
      TEST_TENANT_CODE: 'demo-lab',
    },
    setupNodeEvents(on, config) {
      // Implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        },
        clearFirebaseAuth() {
          // Clear Firebase auth state
          return null;
        },
      });

      // Code coverage - commented out for now due to ESM issues
      // require('@cypress/code-coverage/task')(on, config);

      return config;
    },
  },
  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite',
    },
    specPattern: 'src/**/*.cy.{js,jsx,ts,tsx}',
    supportFile: 'cypress/support/component.ts',
  },
});