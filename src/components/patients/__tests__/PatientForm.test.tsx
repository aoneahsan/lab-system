import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';
import PatientForm from '../PatientForm';
import { patientService } from '@/services/patient.service';
import { useAuthStore } from '@/stores/auth.store';

// Mock services and stores
vi.mock('@/services/patient.service');
vi.mock('@/stores/auth.store');

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderComponent = (props = {}) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter>
        <PatientForm {...props} />
      </MemoryRouter>
    </QueryClientProvider>
  );
};

describe('PatientForm', () => {
  const mockUser = {
    id: 'user1',
    tenantId: 'tenant1',
    role: 'lab_technician',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useAuthStore).mockReturnValue({
      user: mockUser,
      isAuthenticated: true,
    } as any);
  });

  describe('Create Mode', () => {
    it('should render empty form in create mode', () => {
      renderComponent();

      expect(screen.getByLabelText(/first name/i)).toHaveValue('');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('');
      expect(screen.getByLabelText(/email/i)).toHaveValue('');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('');
      expect(screen.getByText(/create patient/i)).toBeInTheDocument();
    });

    it('should show validation errors for required fields', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Submit without filling required fields
      const submitButton = screen.getByRole('button', { name: /create patient/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
        expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
        expect(screen.getByText(/gender is required/i)).toBeInTheDocument();
      });
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const emailInput = screen.getByLabelText(/email/i);
      await user.type(emailInput, 'invalid-email');
      await user.tab(); // Trigger blur

      await waitFor(() => {
        expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should validate phone number format', async () => {
      const user = userEvent.setup();
      renderComponent();

      const phoneInput = screen.getByLabelText(/phone/i);
      await user.type(phoneInput, '123'); // Too short
      await user.tab();

      await waitFor(() => {
        expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
      });
    });

    it('should submit form with valid data', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      vi.mocked(patientService.createPatient).mockResolvedValue({
        id: 'patient1',
        firstName: 'John',
        lastName: 'Doe',
      } as any);

      renderComponent({ onSuccess: mockOnSuccess });

      // Fill form
      await user.type(screen.getByLabelText(/first name/i), 'John');
      await user.type(screen.getByLabelText(/last name/i), 'Doe');
      await user.type(screen.getByLabelText(/date of birth/i), '1980-01-15');
      await user.selectOptions(screen.getByLabelText(/gender/i), 'male');
      await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
      await user.type(screen.getByLabelText(/phone/i), '+1234567890');
      
      // Address
      await user.type(screen.getByLabelText(/street address/i), '123 Main St');
      await user.type(screen.getByLabelText(/city/i), 'New York');
      await user.type(screen.getByLabelText(/state/i), 'NY');
      await user.type(screen.getByLabelText(/zip code/i), '10001');

      // Submit
      const submitButton = screen.getByRole('button', { name: /create patient/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(patientService.createPatient).toHaveBeenCalledWith(
          'tenant1',
          'user1',
          expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            dateOfBirth: expect.any(Date),
            gender: 'male',
            email: 'john.doe@example.com',
            phone: '+1234567890',
            address: {
              street: '123 Main St',
              city: 'New York',
              state: 'NY',
              zipCode: '10001',
            },
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Edit Mode', () => {
    const mockPatient = {
      id: 'patient1',
      firstName: 'John',
      lastName: 'Doe',
      dateOfBirth: new Date('1980-01-15'),
      gender: 'male' as const,
      email: 'john.doe@example.com',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
      },
      emergencyContact: {
        name: 'Jane Doe',
        relationship: 'Spouse',
        phone: '+1234567891',
      },
      insuranceInfo: {
        provider: 'Blue Cross',
        policyNumber: 'BC123456',
        groupNumber: 'GRP789',
      },
    };

    it('should populate form with patient data in edit mode', () => {
      renderComponent({ patient: mockPatient });

      expect(screen.getByLabelText(/first name/i)).toHaveValue('John');
      expect(screen.getByLabelText(/last name/i)).toHaveValue('Doe');
      expect(screen.getByLabelText(/email/i)).toHaveValue('john.doe@example.com');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('+1234567890');
      expect(screen.getByText(/update patient/i)).toBeInTheDocument();
    });

    it('should update patient with changes', async () => {
      const user = userEvent.setup();
      const mockOnSuccess = vi.fn();
      vi.mocked(patientService.updatePatient).mockResolvedValue(undefined);

      renderComponent({ patient: mockPatient, onSuccess: mockOnSuccess });

      // Update first name
      const firstNameInput = screen.getByLabelText(/first name/i);
      await user.clear(firstNameInput);
      await user.type(firstNameInput, 'Jonathan');

      // Submit
      const submitButton = screen.getByRole('button', { name: /update patient/i });
      await user.click(submitButton);

      await waitFor(() => {
        expect(patientService.updatePatient).toHaveBeenCalledWith(
          'tenant1',
          'user1',
          'patient1',
          expect.objectContaining({
            firstName: 'Jonathan',
            lastName: 'Doe',
          })
        );
        expect(mockOnSuccess).toHaveBeenCalled();
      });
    });
  });

  describe('Insurance Information', () => {
    it('should toggle insurance section', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Insurance section should be hidden initially
      expect(screen.queryByLabelText(/insurance provider/i)).not.toBeInTheDocument();

      // Click to expand
      const insuranceToggle = screen.getByText(/insurance information/i);
      await user.click(insuranceToggle);

      // Insurance fields should be visible
      expect(screen.getByLabelText(/insurance provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/policy number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group number/i)).toBeInTheDocument();
    });
  });

  describe('Emergency Contact', () => {
    it('should toggle emergency contact section', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Emergency contact section should be hidden initially
      expect(screen.queryByLabelText(/contact name/i)).not.toBeInTheDocument();

      // Click to expand
      const emergencyToggle = screen.getByText(/emergency contact/i);
      await user.click(emergencyToggle);

      // Emergency contact fields should be visible
      expect(screen.getByLabelText(/contact name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/contact phone/i)).toBeInTheDocument();
    });
  });

  describe('Medical History', () => {
    it('should add and remove allergies', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Expand medical history
      const medicalToggle = screen.getByText(/medical history/i);
      await user.click(medicalToggle);

      // Add allergy
      const allergyInput = screen.getByPlaceholderText(/add allergy/i);
      await user.type(allergyInput, 'Penicillin');
      const addButton = screen.getByRole('button', { name: /add allergy/i });
      await user.click(addButton);

      // Verify allergy added
      expect(screen.getByText('Penicillin')).toBeInTheDocument();

      // Remove allergy
      const removeButton = screen.getByRole('button', { name: /remove penicillin/i });
      await user.click(removeButton);

      // Verify allergy removed
      expect(screen.queryByText('Penicillin')).not.toBeInTheDocument();
    });

    it('should add and remove medications', async () => {
      const user = userEvent.setup();
      renderComponent();

      // Expand medical history
      const medicalToggle = screen.getByText(/medical history/i);
      await user.click(medicalToggle);

      // Add medication
      const medicationInput = screen.getByPlaceholderText(/add medication/i);
      await user.type(medicationInput, 'Lisinopril 10mg');
      const addButton = screen.getByRole('button', { name: /add medication/i });
      await user.click(addButton);

      // Verify medication added
      expect(screen.getByText('Lisinopril 10mg')).toBeInTheDocument();

      // Remove medication
      const removeButton = screen.getByRole('button', { name: /remove lisinopril/i });
      await user.click(removeButton);

      // Verify medication removed
      expect(screen.queryByText('Lisinopril 10mg')).not.toBeInTheDocument();
    });
  });
});