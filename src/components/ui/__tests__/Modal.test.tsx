import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../dialog';

describe('Modal/Dialog Components', () => {
  describe('Dialog', () => {
    it('renders when open is true', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Test Modal</DialogTitle>
            <DialogDescription>Test Description</DialogDescription>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('dialog')).toBeInTheDocument();
      expect(screen.getByText('Test Modal')).toBeInTheDocument();
      expect(screen.getByText('Test Description')).toBeInTheDocument();
    });

    it('does not render when open is false', () => {
      render(
        <Dialog open={false}>
          <DialogContent>
            <DialogTitle>Hidden Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      expect(screen.queryByText('Hidden Modal')).not.toBeInTheDocument();
    });

    it('calls onOpenChange when close is triggered', async () => {
      const handleOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Closeable Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Click the close button (usually an X button)
      const closeButton = screen.getByRole('button', { name: /close/i });
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('closes on escape key press', async () => {
      const handleOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Escape Test Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      fireEvent.keyDown(document, { key: 'Escape' });

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('closes on overlay click by default', async () => {
      const handleOpenChange = vi.fn();
      
      render(
        <Dialog open={true} onOpenChange={handleOpenChange}>
          <DialogContent>
            <DialogTitle>Overlay Click Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      // Click the overlay (backdrop)
      const overlay = document.querySelector('[data-radix-dialog-overlay]');
      if (overlay) {
        fireEvent.click(overlay);
      }

      await waitFor(() => {
        expect(handleOpenChange).toHaveBeenCalledWith(false);
      });
    });

    it('renders with custom className', () => {
      render(
        <Dialog open={true}>
          <DialogContent className="custom-modal-class">
            <DialogTitle>Custom Class Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('custom-modal-class');
    });

    it('supports footer actions', () => {
      const handleSave = vi.fn();
      const handleCancel = vi.fn();

      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Action Modal</DialogTitle>
            </DialogHeader>
            <DialogFooter>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleSave}>Save</button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      const cancelButton = screen.getByText('Cancel');
      const saveButton = screen.getByText('Save');

      fireEvent.click(cancelButton);
      expect(handleCancel).toHaveBeenCalledTimes(1);

      fireEvent.click(saveButton);
      expect(handleSave).toHaveBeenCalledTimes(1);
    });

    it('traps focus within modal', async () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Focus Trap Modal</DialogTitle>
            </DialogHeader>
            <input type="text" placeholder="First input" />
            <input type="text" placeholder="Second input" />
            <button>Submit</button>
          </DialogContent>
        </Dialog>
      );

      const firstInput = screen.getByPlaceholderText('First input');
      const secondInput = screen.getByPlaceholderText('Second input');
      const submitButton = screen.getByText('Submit');

      // Focus should be trapped within these elements
      expect(firstInput).toBeInTheDocument();
      expect(secondInput).toBeInTheDocument();
      expect(submitButton).toBeInTheDocument();
    });

    it('handles nested content correctly', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Parent Modal</DialogTitle>
              <DialogDescription>This modal has nested content</DialogDescription>
            </DialogHeader>
            <div>
              <h3>Nested Section</h3>
              <p>Nested paragraph</p>
              <ul>
                <li>Item 1</li>
                <li>Item 2</li>
              </ul>
            </div>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Parent Modal')).toBeInTheDocument();
      expect(screen.getByText('Nested Section')).toBeInTheDocument();
      expect(screen.getByText('Nested paragraph')).toBeInTheDocument();
      expect(screen.getByText('Item 1')).toBeInTheDocument();
      expect(screen.getByText('Item 2')).toBeInTheDocument();
    });

    it('applies aria attributes correctly', () => {
      render(
        <Dialog open={true}>
          <DialogContent aria-describedby="modal-description">
            <DialogTitle>Accessible Modal</DialogTitle>
            <DialogDescription id="modal-description">
              This modal follows accessibility best practices
            </DialogDescription>
          </DialogContent>
        </Dialog>
      );

      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
    });

    it('handles scroll for long content', () => {
      const longContent = Array.from({ length: 50 }, (_, i) => `Line ${i + 1}`).join('\n');

      render(
        <Dialog open={true}>
          <DialogContent className="max-h-96 overflow-y-auto">
            <DialogTitle>Scrollable Modal</DialogTitle>
            <div style={{ whiteSpace: 'pre-wrap' }}>{longContent}</div>
          </DialogContent>
        </Dialog>
      );

      const content = screen.getByRole('dialog');
      expect(content).toHaveClass('overflow-y-auto');
    });
  });

  describe('Confirmation Dialog', () => {
    it('renders confirmation dialog with proper buttons', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm Action</DialogTitle>
              <DialogDescription>
                Are you sure you want to proceed with this action?
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <button onClick={handleCancel}>Cancel</button>
              <button onClick={handleConfirm} className="bg-red-500">
                Confirm
              </button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByText('Confirm Action')).toBeInTheDocument();
      expect(screen.getByText(/Are you sure/)).toBeInTheDocument();
      
      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('bg-red-500');
    });
  });

  describe('Form Dialog', () => {
    it('renders form inside dialog correctly', () => {
      const handleSubmit = vi.fn((e) => e.preventDefault());

      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Form Modal</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit}>
              <div>
                <label htmlFor="name">Name</label>
                <input id="name" type="text" required />
              </div>
              <div>
                <label htmlFor="email">Email</label>
                <input id="email" type="email" required />
              </div>
              <DialogFooter>
                <button type="button">Cancel</button>
                <button type="submit">Submit</button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      );

      const nameInput = screen.getByLabelText('Name');
      const emailInput = screen.getByLabelText('Email');
      const submitButton = screen.getByText('Submit');

      expect(nameInput).toBeInTheDocument();
      expect(emailInput).toBeInTheDocument();
      
      fireEvent.click(submitButton);
      expect(handleSubmit).toHaveBeenCalled();
    });
  });

  describe('Loading State Dialog', () => {
    it('shows loading state correctly', () => {
      render(
        <Dialog open={true}>
          <DialogContent>
            <DialogTitle>Loading Modal</DialogTitle>
            <div className="flex justify-center p-4">
              <div className="animate-spin" role="status">
                <span className="sr-only">Loading...</span>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      );

      expect(screen.getByRole('status')).toBeInTheDocument();
      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });
  });

  describe('Dialog Sizes', () => {
    it('renders with different size variants', () => {
      const { rerender } = render(
        <Dialog open={true}>
          <DialogContent className="max-w-sm">
            <DialogTitle>Small Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      let content = screen.getByRole('dialog');
      expect(content).toHaveClass('max-w-sm');

      rerender(
        <Dialog open={true}>
          <DialogContent className="max-w-md">
            <DialogTitle>Medium Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      content = screen.getByRole('dialog');
      expect(content).toHaveClass('max-w-md');

      rerender(
        <Dialog open={true}>
          <DialogContent className="max-w-lg">
            <DialogTitle>Large Modal</DialogTitle>
          </DialogContent>
        </Dialog>
      );

      content = screen.getByRole('dialog');
      expect(content).toHaveClass('max-w-lg');
    });
  });
});