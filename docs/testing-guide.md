# Comprehensive Testing Guide

## Overview

This guide provides detailed instructions for testing LabFlow across all platforms and scenarios.

## Test Environment Setup

### Prerequisites

```bash
# Install testing dependencies
yarn install --dev

# Setup test database
yarn test:db:setup

# Install Cypress
yarn cypress:install
```

### Environment Variables

Create `.env.test`:

```env
VITE_FIREBASE_PROJECT_ID=labflow-test
VITE_ENVIRONMENT=test
USE_FIREBASE_EMULATOR=true
```

## Unit Testing

### Running Tests

```bash
# Run all unit tests
yarn test

# Run in watch mode
yarn test:watch

# Run with coverage
yarn test:coverage

# Run specific test file
yarn test src/components/PatientList.test.tsx
```

### Writing Tests

```typescript
// Component test example
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientForm } from '@/components/PatientForm';

describe('PatientForm', () => {
  it('validates required fields', async () => {
    render(<PatientForm onSubmit={vi.fn()} />);
    
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);
    
    expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
  });
});
```

## E2E Testing

### Cypress Configuration

```typescript
// cypress.config.ts
export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1920,
    viewportHeight: 1080,
    video: true,
    screenshotOnRunFailure: true,
  },
});
```

### Running E2E Tests

```bash
# Open Cypress UI
yarn cypress:open

# Run headless
yarn cypress:run

# Run specific spec
yarn cypress:run --spec "cypress/e2e/patient-flow.cy.ts"
```

## Mobile Testing

### Setup

```bash
# Install Appium
npm install -g appium

# Install drivers
appium driver install uiautomator2  # Android
appium driver install xcuitest      # iOS
```

### Running Mobile Tests

```bash
# Android
yarn test:mobile:android

# iOS
yarn test:mobile:ios
```

## Performance Testing

### Lighthouse CI

```bash
# Run performance tests
yarn test:performance

# Custom Lighthouse config
yarn lhci autorun --config=lighthouse.config.js
```

### Load Testing

```javascript
// k6 load test example
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  stages: [
    { duration: '5m', target: 100 },
    { duration: '10m', target: 100 },
    { duration: '5m', target: 0 },
  ],
};

export default function() {
  let response = http.get('https://api.labflow.com/patients');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
}
```

## Security Testing

### Automated Security Scans

```bash
# Run security audit
yarn audit

# OWASP ZAP scan
docker run -t owasp/zap2docker-stable zap-baseline.py -t https://labflow.com

# Dependency check
yarn test:security
```

## Test Data Management

### Seeding Test Data

```typescript
// seed-test-data.ts
import { seedDatabase } from '@/test/utils';

await seedDatabase({
  patients: 50,
  orders: 100,
  results: 200,
  users: 10
});
```

### Test User Accounts

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@test.labflow.com | Test123! |
| Lab Tech | tech@test.labflow.com | Test123! |
| Doctor | doctor@test.labflow.com | Test123! |

## CI/CD Testing

### GitHub Actions

```yaml
name: Test Suite
on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Run tests
        run: |
          yarn install
          yarn test:ci
          yarn cypress:ci
```

## Manual Testing Checklist

### Critical Paths

- [ ] User registration and login
- [ ] Patient creation and search
- [ ] Test ordering workflow
- [ ] Result entry and validation
- [ ] Report generation
- [ ] Billing process
- [ ] Mobile app sync

### Browser Testing

Test on:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)
- Mobile browsers

### Accessibility Testing

```bash
# Run accessibility tests
yarn test:a11y

# Manual testing with screen readers
# - NVDA (Windows)
# - JAWS (Windows)
# - VoiceOver (macOS/iOS)
# - TalkBack (Android)
```

## Bug Reporting

### Template

```markdown
**Description:**
Clear description of the issue

**Steps to Reproduce:**
1. Go to...
2. Click on...
3. Enter...
4. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser:
- OS:
- LabFlow Version:
- User Role:

**Screenshots:**
If applicable
```

## Testing Best Practices

1. **Test Pyramid**
   - Many unit tests
   - Some integration tests
   - Few E2E tests

2. **Test Isolation**
   - Each test should be independent
   - Clean state between tests
   - No shared test data

3. **Meaningful Assertions**
   - Test behavior, not implementation
   - Clear test descriptions
   - One assertion per test when possible

4. **Performance**
   - Keep tests fast
   - Mock external services
   - Parallel test execution

5. **Maintenance**
   - Regular test review
   - Update tests with features
   - Remove obsolete tests