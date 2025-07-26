import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@/test/utils';
import { PatientCard } from './PatientCard';
import { createMockPatient } from '@/test/utils';

describe('PatientCard', () => {
  const mockPatient = createMockPatient();
  const mockOnClick = vi.fn();

  it('renders patient information correctly', () => {
    render(<PatientCard patient={mockPatient} />);
    
    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText(/male/i)).toBeInTheDocument();
    expect(screen.getByText('+1234567890')).toBeInTheDocument();
    expect(screen.getByText('john.doe@example.com')).toBeInTheDocument();
  });

  it('displays age correctly', () => {
    render(<PatientCard patient={mockPatient} />);
    
    const currentYear = new Date().getFullYear();
    const birthYear = 1990;
    const expectedAge = currentYear - birthYear;
    
    expect(screen.getByText(new RegExp(`${expectedAge}\\s*years`, 'i'))).toBeInTheDocument();
  });

  it('calls onClick when card is clicked', () => {
    render(<PatientCard patient={mockPatient} onClick={mockOnClick} />);
    
    const card = screen.getByRole('article');
    fireEvent.click(card);
    
    expect(mockOnClick).toHaveBeenCalledWith(mockPatient);
  });

  it('displays insurance information when available', () => {
    const patientWithInsurance = createMockPatient({
      insurances: [{
        id: '1',
        provider: 'Blue Cross',
        policyNumber: 'BC123456',
        groupNumber: 'GRP789',
        isPrimary: true,
        validFrom: new Date(),
        validTo: new Date(),
      }],
    });
    
    render(<PatientCard patient={patientWithInsurance} />);
    
    expect(screen.getByText(/Blue Cross/i)).toBeInTheDocument();
  });

  it('shows no insurance message when patient has no insurance', () => {
    render(<PatientCard patient={mockPatient} />);
    
    expect(screen.getByText(/No insurance/i)).toBeInTheDocument();
  });

  it('applies hover styles when hovered', () => {
    render(<PatientCard patient={mockPatient} onClick={mockOnClick} />);
    
    const card = screen.getByRole('article');
    
    expect(card).toHaveClass('hover:shadow-md');
    expect(card).toHaveClass('cursor-pointer');
  });

  it('does not apply hover styles when onClick is not provided', () => {
    render(<PatientCard patient={mockPatient} />);
    
    const card = screen.getByRole('article');
    
    expect(card).not.toHaveClass('cursor-pointer');
  });
});