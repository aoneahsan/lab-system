import React, { type ReactElement } from 'react';
import { render, type RenderOptions } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider } from '@/components/theme-provider';

// Create a custom render function that includes all providers
const AllTheProviders = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider defaultTheme="light" storageKey="labflow-theme">
          {children}
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

const customRender = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) => render(ui, { wrapper: AllTheProviders, ...options });

// Re-export everything
export * from '@testing-library/react';
export { customRender as render };

// Test data factories
export const createMockPatient = (overrides = {}) => ({
  id: '1',
  tenantId: 'test-tenant',
  patientId: 'PAT123456',
  mrn: 'MRN123456',
  firstName: 'John',
  lastName: 'Doe',
  middleName: '',
  dateOfBirth: new Date('1990-01-01'),
  gender: 'male' as const,
  email: 'john.doe@example.com',
  phoneNumbers: [{
    type: 'mobile' as const,
    value: '+1234567890',
    isPrimary: true,
    isVerified: true
  }],
  addresses: [{
    type: 'home' as const,
    line1: '123 Main St',
    line2: '',
    city: 'Anytown',
    state: 'CA',
    country: 'USA',
    postalCode: '12345',
    isDefault: true
  }],
  insurances: [],
  emergencyContacts: [],
  allergies: [],
  medications: [],
  medicalHistory: [],
  isActive: true,
  createdAt: new Date(),
  createdBy: 'test-user',
  updatedAt: new Date(),
  updatedBy: 'test-user',
  ...overrides,
});

export const createMockSample = (overrides = {}) => ({
  id: '1',
  sampleNumber: 'S123456',
  barcode: '123456789',
  patientId: '1',
  patientName: 'John Doe',
  testId: '1',
  testName: 'Complete Blood Count',
  type: 'blood',
  status: 'collected',
  collectionDate: new Date(),
  expirationDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockResult = (overrides = {}) => ({
  id: '1',
  sampleId: '1',
  patientId: '1',
  patientName: 'John Doe',
  testId: '1',
  testName: 'Complete Blood Count',
  value: '12.5',
  unit: 'g/dL',
  referenceRange: '12.0-16.0',
  status: 'pending',
  isCritical: false,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

export const createMockUser = (overrides = {}) => ({
  uid: '1',
  email: 'user@example.com',
  displayName: 'Test User',
  role: 'technician',
  createdAt: new Date(),
  ...overrides,
});