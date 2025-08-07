# Testing Guide

## Overview

LabFlow uses a comprehensive testing strategy to ensure code quality and reliability.

## Testing Stack

- **Unit Testing**: Vitest
- **Component Testing**: React Testing Library
- **E2E Testing**: Cypress
- **API Testing**: Supertest
- **Performance Testing**: Lighthouse

## Running Tests

```bash
# Unit tests
yarn test

# Watch mode
yarn test:watch

# Coverage report
yarn test:coverage

# E2E tests
yarn cypress:open
yarn cypress:run

# All tests
yarn test:all
```

## Unit Testing

### Basic Test Structure

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PatientList } from '@/components/patients/PatientList';

describe('PatientList', () => {
  it('renders patient list correctly', () => {
    const patients = [
      { id: '1', name: 'John Doe', mrn: 'MRN001' },
      { id: '2', name: 'Jane Smith', mrn: 'MRN002' }
    ];
    
    render(<PatientList patients={patients} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Jane Smith')).toBeInTheDocument();
  });
});
```

### Testing Hooks

```typescript
import { renderHook, act } from '@testing-library/react';
import { usePatients } from '@/hooks/usePatients';

describe('usePatients', () => {
  it('fetches patients successfully', async () => {
    const { result } = renderHook(() => usePatients());
    
    expect(result.current.loading).toBe(true);
    
    await act(async () => {
      await result.current.fetchPatients();
    });
    
    expect(result.current.loading).toBe(false);
    expect(result.current.patients).toHaveLength(2);
  });
});
```

## E2E Testing

### Cypress Best Practices

```typescript
describe('Patient Registration Flow', () => {
  beforeEach(() => {
    cy.login('admin@test.com', 'password');
    cy.visit('/patients/new');
  });
  
  it('completes patient registration', () => {
    cy.fillPatientForm({
      firstName: 'Test',
      lastName: 'Patient',
      dateOfBirth: '1990-01-01'
    });
    
    cy.get('[data-testid="submit-button"]').click();
    
    cy.url().should('match', /\/patients\/[a-z0-9]+$/);
    cy.contains('Patient created successfully');
  });
});
```

## Testing Guidelines

1. **Write tests first** (TDD approach)
2. **Test behavior, not implementation**
3. **Use meaningful test descriptions**
4. **Keep tests isolated and independent**
5. **Mock external dependencies**
6. **Test edge cases and error scenarios**

## Coverage Requirements

- Minimum 80% code coverage
- 100% coverage for critical paths
- All new features must include tests