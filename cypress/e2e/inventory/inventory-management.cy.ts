describe('Inventory Management', () => {
  beforeEach(() => {
    cy.login(Cypress.env('TEST_EMAIL'), Cypress.env('TEST_PASSWORD'));
    cy.navigateToModule('Inventory');
  });

  describe('Reagent Management', () => {
    it('displays reagent inventory list', () => {
      cy.findByRole('heading', { name: /inventory management/i }).should('be.visible');
      cy.findAllByTestId('reagent-card').should('have.length.at.least', 1);
      
      // Check inventory details
      cy.findAllByTestId('reagent-card').first().within(() => {
        cy.findByText(/lot number/i).should('be.visible');
        cy.findByText(/expiry date/i).should('be.visible');
        cy.findByText(/quantity/i).should('be.visible');
        cy.findByTestId('stock-level').should('be.visible');
      });
    });

    it('adds new reagent to inventory', () => {
      cy.findByRole('button', { name: /add reagent/i }).click();
      
      // Fill reagent details
      cy.findByLabelText(/reagent name/i).type('Glucose Reagent');
      cy.findByLabelText(/catalog number/i).type('GLU-500');
      cy.findByLabelText(/manufacturer/i).select('Abbott Diagnostics');
      cy.findByLabelText(/lot number/i).type('LOT123456');
      cy.findByLabelText(/quantity/i).type('500');
      cy.findByLabelText(/unit/i).select('mL');
      cy.findByLabelText(/expiry date/i).type('2025-12-31');
      cy.findByLabelText(/storage temperature/i).select('2-8°C');
      
      // Set reorder levels
      cy.findByLabelText(/minimum stock/i).type('100');
      cy.findByLabelText(/reorder quantity/i).type('1000');
      
      // Save reagent
      cy.findByRole('button', { name: /save reagent/i }).click();
      cy.wait('@createReagent');
      
      cy.findByText(/reagent added successfully/i).should('be.visible');
    });

    it('updates reagent quantity on receipt', () => {
      cy.findByPlaceholderText(/search reagent/i).type('Hemoglobin');
      cy.wait('@searchReagents');
      
      cy.findAllByTestId('reagent-card').first().click();
      
      // Receive new stock
      cy.findByRole('button', { name: /receive stock/i }).click();
      
      cy.findByLabelText(/quantity received/i).type('200');
      cy.findByLabelText(/lot number/i).type('LOT789012');
      cy.findByLabelText(/expiry date/i).type('2025-06-30');
      cy.findByLabelText(/invoice number/i).type('INV-2024-001');
      
      cy.findByRole('button', { name: /confirm receipt/i }).click();
      cy.wait('@updateStock');
      
      cy.findByText(/stock updated/i).should('be.visible');
      // Verify quantity increased
      cy.findByTestId('current-stock').should('contain', '700');
    });

    it('tracks reagent usage', () => {
      cy.findAllByTestId('reagent-card').first().click();
      
      // Record usage
      cy.findByRole('button', { name: /record usage/i }).click();
      
      cy.findByLabelText(/quantity used/i).type('50');
      cy.findByLabelText(/used for/i).select('QC Run');
      cy.findByLabelText(/technician/i).type('John Smith');
      cy.findByLabelText(/notes/i).type('Daily QC run');
      
      cy.findByRole('button', { name: /save usage/i }).click();
      cy.wait('@recordUsage');
      
      // Verify stock decreased
      cy.findByText(/usage recorded/i).should('be.visible');
      cy.findByTestId('current-stock').should('contain', '450');
    });
  });

  describe('Low Stock Alerts', () => {
    it('displays low stock alerts', () => {
      cy.findByRole('tab', { name: /alerts/i }).click();
      
      // Check for low stock items
      cy.findAllByTestId('low-stock-alert').should('have.length.at.least', 1);
      
      cy.findAllByTestId('low-stock-alert').first().within(() => {
        cy.findByText(/low stock/i).should('be.visible');
        cy.findByText(/current: \d+/i).should('be.visible');
        cy.findByText(/minimum: \d+/i).should('be.visible');
        cy.findByRole('button', { name: /order now/i }).should('be.visible');
      });
    });

    it('creates purchase order from alert', () => {
      cy.findByRole('tab', { name: /alerts/i }).click();
      
      // Click order now on first alert
      cy.findAllByTestId('low-stock-alert').first().within(() => {
        cy.findByRole('button', { name: /order now/i }).click();
      });
      
      // Purchase order form should be pre-filled
      cy.findByLabelText(/reagent/i).should('not.have.value', '');
      cy.findByLabelText(/quantity/i).should('not.have.value', '');
      
      // Complete order
      cy.findByLabelText(/supplier/i).select('Fisher Scientific');
      cy.findByLabelText(/delivery date/i).type('2024-02-15');
      
      cy.findByRole('button', { name: /create order/i }).click();
      cy.wait('@createPurchaseOrder');
      
      cy.findByText(/purchase order created/i).should('be.visible');
    });

    it('handles expiring reagents', () => {
      cy.findByRole('tab', { name: /expiring soon/i }).click();
      
      // Should show reagents expiring within 30 days
      cy.findAllByTestId('expiring-reagent').should('have.length.at.least', 1);
      
      cy.findAllByTestId('expiring-reagent').first().within(() => {
        cy.findByText(/expires in \d+ days/i).should('be.visible');
        cy.findByRole('button', { name: /use first/i }).should('be.visible');
      });
    });
  });

  describe('Equipment Management', () => {
    beforeEach(() => {
      cy.findByRole('tab', { name: /equipment/i }).click();
    });

    it('displays equipment list', () => {
      cy.findAllByTestId('equipment-card').should('have.length.at.least', 1);
      
      cy.findAllByTestId('equipment-card').first().within(() => {
        cy.findByText(/serial number/i).should('be.visible');
        cy.findByText(/status/i).should('be.visible');
        cy.findByText(/last maintenance/i).should('be.visible');
      });
    });

    it('schedules equipment maintenance', () => {
      cy.findAllByTestId('equipment-card').first().click();
      
      cy.findByRole('button', { name: /schedule maintenance/i }).click();
      
      // Fill maintenance details
      cy.findByLabelText(/maintenance type/i).select('Preventive');
      cy.findByLabelText(/scheduled date/i).type('2024-02-20');
      cy.findByLabelText(/technician/i).type('Service Tech');
      cy.findByLabelText(/description/i).type('Annual calibration and cleaning');
      
      cy.findByRole('button', { name: /schedule/i }).click();
      cy.wait('@scheduleMaintenance');
      
      cy.findByText(/maintenance scheduled/i).should('be.visible');
    });

    it('records equipment issues', () => {
      cy.findAllByTestId('equipment-card').first().click();
      
      cy.findByRole('button', { name: /report issue/i }).click();
      
      // Report issue
      cy.findByLabelText(/issue type/i).select('Malfunction');
      cy.findByLabelText(/severity/i).select('High');
      cy.findByLabelText(/description/i).type('Temperature reading unstable');
      cy.findByRole('checkbox', { name: /take offline/i }).check();
      
      cy.findByRole('button', { name: /report/i }).click();
      cy.wait('@reportIssue');
      
      cy.findByText(/issue reported/i).should('be.visible');
      cy.findByTestId('equipment-status').should('contain', 'Offline');
    });
  });

  describe('Supplier Management', () => {
    beforeEach(() => {
      cy.findByRole('tab', { name: /suppliers/i }).click();
    });

    it('manages supplier information', () => {
      cy.findByRole('button', { name: /add supplier/i }).click();
      
      // Add new supplier
      cy.findByLabelText(/supplier name/i).type('MedLab Supplies Inc');
      cy.findByLabelText(/contact person/i).type('Jane Doe');
      cy.findByLabelText(/email/i).type('jane@medlabsupplies.com');
      cy.findByLabelText(/phone/i).type('+1234567890');
      cy.findByLabelText(/address/i).type('123 Medical Drive, Health City');
      
      // Add product categories
      cy.findByRole('checkbox', { name: /reagents/i }).check();
      cy.findByRole('checkbox', { name: /consumables/i }).check();
      
      cy.findByRole('button', { name: /save supplier/i }).click();
      cy.wait('@createSupplier');
      
      cy.findByText(/supplier added/i).should('be.visible');
    });

    it('tracks supplier performance', () => {
      cy.findAllByTestId('supplier-row').first().click();
      
      cy.findByRole('tab', { name: /performance/i }).click();
      
      // Should show performance metrics
      cy.findByText(/on-time delivery/i).should('be.visible');
      cy.findByText(/quality rating/i).should('be.visible');
      cy.findByText(/response time/i).should('be.visible');
      
      // Rate recent order
      cy.findByRole('button', { name: /rate order/i }).click();
      cy.findByLabelText(/delivery rating/i).select('5');
      cy.findByLabelText(/quality rating/i).select('4');
      cy.findByLabelText(/comments/i).type('Good service, minor packaging issue');
      
      cy.findByRole('button', { name: /submit rating/i }).click();
      cy.wait('@submitRating');
    });
  });

  describe('Inventory Reports', () => {
    it('generates stock valuation report', () => {
      cy.findByRole('button', { name: /reports/i }).click();
      cy.findByRole('menuitem', { name: /stock valuation/i }).click();
      
      // Set parameters
      cy.findByLabelText(/as of date/i).type('2024-01-31');
      cy.findByRole('checkbox', { name: /include expired/i }).uncheck();
      
      cy.findByRole('button', { name: /generate report/i }).click();
      cy.wait('@generateValuationReport');
      
      // Verify report content
      cy.findByText(/total inventory value/i).should('be.visible');
      cy.findByText(/by category/i).should('be.visible');
      cy.findAllByTestId('valuation-row').should('have.length.at.least', 1);
    });

    it('generates usage trends report', () => {
      cy.findByRole('button', { name: /reports/i }).click();
      cy.findByRole('menuitem', { name: /usage trends/i }).click();
      
      // Configure report
      cy.findByLabelText(/period/i).select('Last 3 Months');
      cy.findByLabelText(/group by/i).select('Reagent Type');
      cy.findByRole('checkbox', { name: /show forecast/i }).check();
      
      cy.findByRole('button', { name: /generate/i }).click();
      cy.wait('@generateUsageReport');
      
      // Check for trend visualization
      cy.findByTestId('usage-chart').should('be.visible');
      cy.findByText(/projected usage/i).should('be.visible');
    });
  });
});