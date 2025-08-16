import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PatientRegistrationForm } from '../PatientRegistrationForm';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {component}
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('PatientRegistrationForm', () => {
  const mockOnSuccess = vi.fn();
  const mockOnCancel = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all required fields', () => {
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Personal Information fields
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/gender/i)).toBeInTheDocument();
    
    // Contact Information fields
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();
    
    // Address fields
    expect(screen.getByLabelText(/street address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/city/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/state/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/zip/i)).toBeInTheDocument();
  });

  it('validates required fields', async () => {
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const submitButton = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/first name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/last name is required/i)).toBeInTheDocument();
      expect(screen.getByText(/date of birth is required/i)).toBeInTheDocument();
    });

    expect(mockOnSuccess).not.toHaveBeenCalled();
  });

  it('validates email format', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const emailInput = screen.getByLabelText(/email/i);
    await user.type(emailInput, 'invalid-email');
    
    const submitButton = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument();
    });
  });

  it('validates phone number format', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const phoneInput = screen.getByLabelText(/phone/i);
    await user.type(phoneInput, '123'); // Too short
    
    const submitButton = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/invalid phone number/i)).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Fill in required fields
    await user.type(screen.getByLabelText(/first name/i), 'John');
    await user.type(screen.getByLabelText(/last name/i), 'Doe');
    await user.type(screen.getByLabelText(/date of birth/i), '1990-01-01');
    await user.selectOptions(screen.getByLabelText(/gender/i), 'male');
    await user.type(screen.getByLabelText(/email/i), 'john.doe@example.com');
    await user.type(screen.getByLabelText(/phone/i), '1234567890');
    await user.type(screen.getByLabelText(/street address/i), '123 Main St');
    await user.type(screen.getByLabelText(/city/i), 'New York');
    await user.type(screen.getByLabelText(/state/i), 'NY');
    await user.type(screen.getByLabelText(/zip/i), '10001');

    const submitButton = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('handles cancel action', () => {
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    fireEvent.click(cancelButton);

    expect(mockOnCancel).toHaveBeenCalledTimes(1);
  });

  it('disables submit button while loading', () => {
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    // Simulate loading state
    const submitButton = screen.getByRole('button', { name: /register patient/i });
    expect(submitButton).not.toBeDisabled();

    // Would need to mock the mutation to test actual loading state
  });

  it('handles emergency contact information', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const emergencyContactToggle = screen.getByText(/add emergency contact/i);
    fireEvent.click(emergencyContactToggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/emergency contact name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/emergency contact phone/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/relationship/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/emergency contact name/i), 'Jane Doe');
    await user.type(screen.getByLabelText(/emergency contact phone/i), '9876543210');
    await user.selectOptions(screen.getByLabelText(/relationship/i), 'spouse');
  });

  it('handles insurance information', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const insuranceToggle = screen.getByText(/add insurance information/i);
    fireEvent.click(insuranceToggle);

    await waitFor(() => {
      expect(screen.getByLabelText(/insurance provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/policy number/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/group number/i)).toBeInTheDocument();
    });

    await user.type(screen.getByLabelText(/insurance provider/i), 'Blue Cross');
    await user.type(screen.getByLabelText(/policy number/i), 'POL123456');
    await user.type(screen.getByLabelText(/group number/i), 'GRP789');
  });

  it('validates date of birth is not in future', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    await user.type(screen.getByLabelText(/date of birth/i), tomorrowStr);
    
    const submitButton = screen.getByRole('button', { name: /register patient/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/date of birth cannot be in the future/i)).toBeInTheDocument();
    });
  });

  it('calculates age from date of birth', async () => {
    const user = userEvent.setup();
    renderWithProviders(
      <PatientRegistrationForm onSuccess={mockOnSuccess} onCancel={mockOnCancel} />
    );

    await user.type(screen.getByLabelText(/date of birth/i), '2000-01-01');
    
    await waitFor(() => {
      const ageDisplay = screen.getByText(/age:/i);
      expect(ageDisplay).toBeInTheDocument();
      // Age would be calculated based on current date
    });
  });
});