describe('Billing and Insurance Workflow', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.navigateToModule('Billing');
  });

  describe('Invoice Generation', () => {
    it('creates invoice for patient tests', () => {
      // Search for patient
      cy.findByPlaceholderText(/search patient/i).type('John Doe');
      cy.findByRole('button', { name: /search/i }).click();
      cy.wait('@getPatient');
      
      // Select unbilled tests
      cy.findByRole('tab', { name: /unbilled tests/i }).click();
      cy.findByRole('checkbox', { name: /select all/i }).check();
      
      // Generate invoice
      cy.findByRole('button', { name: /generate invoice/i }).click();
      
      // Review invoice details
      cy.findByText(/invoice summary/i).should('be.visible');
      cy.findByText(/total amount/i).should('be.visible');
      cy.findByTestId('invoice-total').should('contain', '$');
      
      // Apply discount if needed
      cy.findByRole('button', { name: /apply discount/i }).click();
      cy.findByLabelText(/discount type/i).select('Percentage');
      cy.findByLabelText(/discount value/i).type('10');
      cy.findByRole('button', { name: /apply/i }).click();
      
      // Save invoice
      cy.findByRole('button', { name: /save invoice/i }).click();
      cy.wait('@createInvoice');
      
      cy.findByText(/invoice created successfully/i).should('be.visible');
    });

    it('generates batch invoices', () => {
      cy.findByRole('button', { name: /batch invoicing/i }).click();
      
      // Select date range
      cy.findByLabelText(/from date/i).type('2024-01-01');
      cy.findByLabelText(/to date/i).type('2024-01-31');
      
      // Filter by insurance
      cy.findByRole('checkbox', { name: /group by insurance/i }).check();
      
      // Preview batch
      cy.findByRole('button', { name: /preview batch/i }).click();
      cy.wait('@getInvoicePreview');
      
      cy.findByText(/15 invoices will be generated/i).should('be.visible');
      
      // Generate all
      cy.findByRole('button', { name: /generate all/i }).click();
      cy.wait('@generateBatchInvoices');
      
      cy.findByText(/15 invoices generated/i).should('be.visible');
    });
  });

  describe('Payment Processing', () => {
    beforeEach(() => {
      cy.findByRole('tab', { name: /payments/i }).click();
    });

    it('records cash payment', () => {
      // Select invoice
      cy.findAllByTestId('invoice-row').first().click();
      
      // Record payment
      cy.findByRole('button', { name: /record payment/i }).click();
      
      // Payment details
      cy.findByLabelText(/payment method/i).select('Cash');
      cy.findByLabelText(/amount/i).type('250.00');
      cy.findByLabelText(/receipt number/i).type('R123456');
      
      // Save payment
      cy.findByRole('button', { name: /save payment/i }).click();
      cy.wait('@recordPayment');
      
      cy.findByText(/payment recorded/i).should('be.visible');
      cy.findByTestId('payment-status').should('contain', 'Paid');
    });

    it('processes card payment', () => {
      cy.findAllByTestId('invoice-row').eq(1).click();
      cy.findByRole('button', { name: /record payment/i }).click();
      
      // Card payment
      cy.findByLabelText(/payment method/i).select('Credit Card');
      cy.findByLabelText(/card number/i).type('4111111111111111');
      cy.findByLabelText(/cvv/i).type('123');
      cy.findByLabelText(/expiry/i).type('12/25');
      
      cy.findByRole('button', { name: /process payment/i }).click();
      cy.wait('@processCardPayment');
      
      cy.findByText(/payment successful/i).should('be.visible');
    });

    it('handles partial payments', () => {
      // Find invoice with balance
      cy.findByText(/partial payment/i).click();
      cy.findAllByTestId('invoice-row').first().click();
      
      // Record partial payment
      cy.findByRole('button', { name: /record payment/i }).click();
      cy.findByLabelText(/payment method/i).select('Cash');
      cy.findByLabelText(/amount/i).type('100.00');
      
      // Should show remaining balance
      cy.findByText(/remaining balance: \$150.00/i).should('be.visible');
      
      cy.findByRole('button', { name: /save partial payment/i }).click();
      cy.wait('@recordPayment');
      
      cy.findByTestId('payment-status').should('contain', 'Partial');
    });
  });

  describe('Insurance Claims', () => {
    beforeEach(() => {
      cy.findByRole('tab', { name: /insurance claims/i }).click();
    });

    it('creates insurance claim', () => {
      cy.findByRole('button', { name: /new claim/i }).click();
      
      // Patient and insurance info
      cy.findByLabelText(/patient/i).type('Jane Smith');
      cy.findByRole('option', { name: /jane smith/i }).click();
      
      // Verify insurance loaded
      cy.findByText(/blue cross/i).should('be.visible');
      cy.findByText(/policy: BC123456/i).should('be.visible');
      
      // Add tests to claim
      cy.findByRole('button', { name: /add tests/i }).click();
      cy.findByRole('checkbox', { name: /complete blood count/i }).check();
      cy.findByRole('checkbox', { name: /metabolic panel/i }).check();
      
      // Add diagnosis codes
      cy.findByLabelText(/primary diagnosis/i).type('E11.9');
      cy.findByRole('option', { name: /diabetes/i }).click();
      
      // Submit claim
      cy.findByRole('button', { name: /submit claim/i }).click();
      cy.wait('@submitClaim');
      
      cy.findByText(/claim submitted successfully/i).should('be.visible');
      cy.findByText(/claim id:/i).should('be.visible');
    });

    it('tracks claim status', () => {
      // Filter by pending claims
      cy.findByLabelText(/status filter/i).select('Pending');
      cy.wait('@getClaims');
      
      // Check claim details
      cy.findAllByTestId('claim-row').first().click();
      
      cy.findByText(/claim details/i).should('be.visible');
      cy.findByText(/submitted date/i).should('be.visible');
      cy.findByText(/status: pending/i).should('be.visible');
      
      // Update status
      cy.findByRole('button', { name: /update status/i }).click();
      cy.findByLabelText(/new status/i).select('Approved');
      cy.findByLabelText(/approved amount/i).type('450.00');
      cy.findByLabelText(/notes/i).type('Approved with adjustment');
      
      cy.findByRole('button', { name: /save/i }).click();
      cy.wait('@updateClaimStatus');
      
      cy.findByText(/claim updated/i).should('be.visible');
    });

    it('handles claim rejections', () => {
      cy.findByLabelText(/status filter/i).select('Rejected');
      cy.wait('@getClaims');
      
      cy.findAllByTestId('claim-row').first().click();
      
      // View rejection reason
      cy.findByText(/rejection reason/i).should('be.visible');
      
      // Resubmit claim
      cy.findByRole('button', { name: /resubmit claim/i }).click();
      
      // Fix issues
      cy.findByLabelText(/authorization number/i).type('AUTH123456');
      cy.findByLabelText(/corrected diagnosis/i).clear().type('E11.65');
      
      cy.findByRole('button', { name: /resubmit/i }).click();
      cy.wait('@resubmitClaim');
      
      cy.findByText(/claim resubmitted/i).should('be.visible');
    });
  });

  describe('Financial Reports', () => {
    beforeEach(() => {
      cy.findByRole('tab', { name: /reports/i }).click();
    });

    it('generates revenue report', () => {
      cy.findByRole('button', { name: /revenue report/i }).click();
      
      // Set parameters
      cy.findByLabelText(/report period/i).select('Last Month');
      cy.findByRole('checkbox', { name: /group by department/i }).check();
      cy.findByRole('checkbox', { name: /include projections/i }).check();
      
      // Generate report
      cy.findByRole('button', { name: /generate/i }).click();
      cy.wait('@generateReport');
      
      // Verify report sections
      cy.findByText(/total revenue/i).should('be.visible');
      cy.findByText(/department breakdown/i).should('be.visible');
      cy.findByText(/payment methods/i).should('be.visible');
      cy.findByText(/projections/i).should('be.visible');
      
      // Export report
      cy.findByRole('button', { name: /export pdf/i }).click();
      cy.readFile('cypress/downloads/revenue-report.pdf').should('exist');
    });

    it('generates aging report', () => {
      cy.findByRole('button', { name: /aging report/i }).click();
      
      // Configure aging buckets
      cy.findByRole('checkbox', { name: /0-30 days/i }).should('be.checked');
      cy.findByRole('checkbox', { name: /31-60 days/i }).should('be.checked');
      cy.findByRole('checkbox', { name: /61-90 days/i }).should('be.checked');
      cy.findByRole('checkbox', { name: /over 90 days/i }).should('be.checked');
      
      cy.findByRole('button', { name: /generate/i }).click();
      cy.wait('@generateAgingReport');
      
      // Check aging summary
      cy.findByTestId('aging-summary').within(() => {
        cy.findByText(/0-30 days/i).should('be.visible');
        cy.findByText(/\$\d+/i).should('be.visible');
      });
      
      // View detailed list
      cy.findByRole('button', { name: /view details/i }).click();
      cy.findAllByTestId('aging-detail-row').should('have.length.at.least', 1);
    });
  });
});