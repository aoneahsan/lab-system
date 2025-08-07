# Cypress E2E Testing

This directory contains end-to-end tests for the LabFlow application using Cypress.

## Quick Start

```bash
# Run all E2E tests in headless mode
yarn test:e2e

# Open Cypress Test Runner (interactive mode)
yarn test:e2e:open

# Run specific test file
yarn cypress:run --spec "cypress/e2e/auth.cy.ts"

# Run tests in specific browser
yarn cypress:run --browser chrome
```

## Directory Structure

```
cypress/
├── e2e/                    # E2E test files
│   ├── auth.cy.ts         # Authentication tests
│   ├── patient-management.cy.ts
│   ├── test-ordering.cy.ts
│   └── result-entry.cy.ts
├── fixtures/              # Test data
│   ├── patients.json
│   ├── tests.json
│   └── samples.json
├── support/               # Support files and custom commands
│   ├── commands.ts       # Custom Cypress commands
│   ├── component.ts      # Component testing setup
│   └── e2e.ts           # E2E testing setup
├── downloads/            # Downloaded files during tests
└── screenshots/          # Screenshots from test runs
```

## Writing Tests

### Basic Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
    cy.resetDatabase();
    cy.login('user@example.com', 'password');
  });

  it('should perform specific action', () => {
    // Test implementation
    cy.visit('/page');
    cy.get('[data-testid="element"]').click();
    cy.contains('Expected text').should('be.visible');
  });
});
```

### Custom Commands

We have several custom commands available:

#### Authentication
- `cy.login(email, password)` - Login with credentials
- `cy.logout()` - Logout current user
- `cy.loginAsAdmin()` - Login as admin user
- `cy.loginAsLabTech()` - Login as lab technician
- `cy.loginAsPhlebotomist()` - Login as phlebotomist
- `cy.loginAsDoctor()` - Login as doctor

#### Database
- `cy.resetDatabase()` - Reset test database
- `cy.seedDatabase(data)` - Seed database with test data

#### Patient Management
- `cy.createPatient(patientData)` - Create a new patient
- `cy.searchPatient(query)` - Search for patients

#### Test Orders
- `cy.createTestOrder(patientId, tests)` - Create test order

#### UI Helpers
- `cy.waitForSpinners()` - Wait for loading spinners to disappear
- `cy.closeNotification()` - Close notification messages
- `cy.selectFromDropdown(label, option)` - Select from dropdown
- `cy.uploadFile(fileName, selector?)` - Upload file

## Best Practices

### 1. Use Data Attributes for Selectors

Always use `data-testid` attributes for selecting elements:

```typescript
// Good
cy.get('[data-testid="submit-button"]').click();

// Avoid
cy.get('.btn-primary').click();
cy.get('#submit').click();
```

### 2. Wait for Elements, Not Time

```typescript
// Good
cy.get('[data-testid="loading"]').should('not.exist');
cy.contains('Data loaded').should('be.visible');

// Avoid
cy.wait(3000);
```

### 3. Use Fixtures for Test Data

```typescript
// Load fixture data
cy.fixture('patients').then((patients) => {
  cy.createPatient(patients[0]);
});
```

### 4. Reset State Between Tests

```typescript
beforeEach(() => {
  cy.resetDatabase();
  cy.clearLocalStorage();
  cy.clearCookies();
});
```

### 5. Group Related Tests

```typescript
describe('Patient Management', () => {
  describe('Creating Patients', () => {
    // Tests for patient creation
  });

  describe('Searching Patients', () => {
    // Tests for patient search
  });
});
```

## Configuration

### Environment Variables

Set these in `cypress.config.ts` or via CLI:

```typescript
env: {
  apiUrl: 'http://localhost:5001/api',
  TEST_EMAIL: 'test@labflow.com',
  TEST_PASSWORD: 'Test123!',
  TEST_TENANT_CODE: 'demo-lab',
}
```

### Custom Tasks

Available tasks in `cypress.config.ts`:

- `resetDatabase` - Reset test database to clean state
- `seedDatabase` - Seed database with test data
- `getTestUsers` - Get test user credentials

## Running in CI/CD

### GitHub Actions

```yaml
- name: Run E2E Tests
  run: |
    yarn install
    yarn test:e2e
  env:
    CYPRESS_TEST_EMAIL: ${{ secrets.CYPRESS_TEST_EMAIL }}
    CYPRESS_TEST_PASSWORD: ${{ secrets.CYPRESS_TEST_PASSWORD }}
```

### Docker

```bash
# Run tests in Docker
docker run -it \
  -v $PWD:/e2e \
  -w /e2e \
  cypress/included:13.0.0 \
  --config baseUrl=http://host.docker.internal:5173
```

## Debugging

### Screenshots and Videos

- Screenshots are automatically taken on test failure
- Videos are recorded for all test runs
- Find them in `cypress/screenshots` and `cypress/videos`

### Debug Mode

```typescript
// Add debug command
cy.debug();

// Or pause execution
cy.pause();
```

### Browser DevTools

1. Run `yarn test:e2e:open`
2. Click on a test to run it
3. Open browser DevTools (F12)
4. Use debugger statements in test code

## Troubleshooting

### Common Issues

1. **Tests timing out**
   - Increase timeout in `cypress.config.ts`
   - Check if elements are actually appearing
   - Use `cy.waitForSpinners()` command

2. **Firebase connection issues**
   - Ensure Firebase emulator is running
   - Check environment variables
   - Verify network connectivity

3. **Flaky tests**
   - Add proper waits for async operations
   - Reset state properly between tests
   - Use retry configuration

### Useful Commands

```bash
# Clear Cypress cache
yarn cypress cache clear

# Verify Cypress installation
yarn cypress verify

# Run specific test in headed mode
yarn cypress run --spec "cypress/e2e/auth.cy.ts" --headed
```

## Contributing

1. Write tests for new features
2. Ensure all tests pass locally
3. Add appropriate data-testid attributes
4. Update fixtures if needed
5. Document any new custom commands

## Resources

- [Cypress Documentation](https://docs.cypress.io)
- [Cypress Best Practices](https://docs.cypress.io/guides/references/best-practices)
- [Testing Library](https://testing-library.com/docs/cypress-testing-library/intro)
- [Cypress Real Events](https://github.com/dmtrKovalenko/cypress-real-events)