describe('Quality Control Workflow', () => {
  beforeEach(() => {
    cy.resetDatabase();
    cy.loginAsLabTech();
  });

  describe('QC Run Management', () => {
    it('should create new QC run', () => {
      cy.visit('/quality-control');
      cy.get('[data-testid="new-qc-run"]').click();
      
      // Select instrument and test
      cy.get('[data-testid="instrument-select"]').select('Analyzer-01');
      cy.get('[data-testid="test-select"]').select('Glucose');
      cy.get('[data-testid="qc-level"]').select('Level 1');
      
      // Enter QC values
      cy.get('[data-testid="qc-value"]').type('95.5');
      cy.get('[data-testid="lot-number"]').type('QC2024-001');
      cy.get('[data-testid="expiry-date"]').type('2024-12-31');
      
      // Save QC run
      cy.get('[data-testid="save-qc"]').click();
      cy.contains('QC run saved successfully').should('be.visible');
    });

    it('should flag out-of-control values', () => {
      cy.visit('/quality-control/run');
      
      // Enter out-of-range value
      cy.get('[data-testid="qc-value"]').type('65.0'); // Below 2SD
      
      // Verify warning
      cy.get('[data-testid="qc-warning"]').should('be.visible');
      cy.contains('QC value outside acceptable range').should('be.visible');
      cy.get('[data-testid="westgard-rule"]').should('contain', '1-2s');
      
      // Document corrective action
      cy.get('[data-testid="corrective-action"]').type('Recalibrated instrument');
      cy.get('[data-testid="save-with-action"]').click();
    });

    it('should handle multi-rule QC violations', () => {
      cy.visit('/quality-control/multi-rule');
      
      // Enter multiple QC values
      const qcValues = ['92.0', '91.5', '93.0', '91.0', '92.5'];
      qcValues.forEach((value, index) => {
        cy.get('[data-testid="add-qc-value"]').click();
        cy.get(`[data-testid="qc-value-${index}"]`).type(value);
      });
      
      // Check for Westgard rule violations
      cy.get('[data-testid="evaluate-rules"]').click();
      cy.get('[data-testid="rule-violations"]').within(() => {
        cy.contains('2-2s').should('be.visible');
        cy.contains('Action Required').should('be.visible');
      });
    });
  });

  describe('Levey-Jennings Charts', () => {
    it('should display QC trends', () => {
      cy.visit('/quality-control/charts');
      
      // Select parameters
      cy.get('[data-testid="chart-test"]').select('Glucose');
      cy.get('[data-testid="chart-level"]').select('Level 1');
      cy.get('[data-testid="chart-period"]').select('Last 30 days');
      
      // Generate chart
      cy.get('[data-testid="generate-chart"]').click();
      cy.get('[data-testid="lj-chart"]').should('be.visible');
      
      // Verify chart elements
      cy.get('[data-testid="mean-line"]').should('be.visible');
      cy.get('[data-testid="sd-lines"]').should('have.length', 6); // ±1SD, ±2SD, ±3SD
      cy.get('[data-testid="qc-points"]').should('have.length.greaterThan', 20);
    });

    it('should highlight rule violations on chart', () => {
      cy.visit('/quality-control/charts');
      
      // Generate chart with violations
      cy.get('[data-testid="show-violations"]').check();
      cy.get('[data-testid="generate-chart"]').click();
      
      // Verify violation markers
      cy.get('[data-testid="violation-point"]').should('have.class', 'text-red-500');
      cy.get('[data-testid="violation-point"]').first().click();
      
      // Show violation details
      cy.get('[data-testid="violation-tooltip"]').within(() => {
        cy.contains('Rule Violation').should('be.visible');
        cy.contains('Date:').should('be.visible');
        cy.contains('Value:').should('be.visible');
        cy.contains('Rule:').should('be.visible');
      });
    });
  });

  describe('QC Review and Approval', () => {
    it('should review QC results', () => {
      cy.visit('/quality-control/review');
      
      // Filter pending review
      cy.get('[data-testid="filter-pending-review"]').click();
      cy.get('[data-testid="qc-table"]').should('be.visible');
      
      // Review QC run
      cy.get('[data-testid="qc-row"]').first().click();
      cy.get('[data-testid="qc-details"]').should('be.visible');
      
      // Approve QC
      cy.get('[data-testid="review-checklist"]').within(() => {
        cy.get('[data-testid="check-values"]').check();
        cy.get('[data-testid="check-actions"]').check();
        cy.get('[data-testid="check-documentation"]').check();
      });
      
      cy.get('[data-testid="approve-qc"]').click();
      cy.contains('QC approved').should('be.visible');
    });

    it('should handle QC failures', () => {
      cy.visit('/quality-control/failures');
      
      // Document failure
      cy.get('[data-testid="qc-failure-row"]').first().click();
      cy.get('[data-testid="failure-investigation"]').type('Expired reagent detected');
      cy.get('[data-testid="root-cause"]').select('Reagent Issue');
      
      // Corrective actions
      cy.get('[data-testid="add-action"]').click();
      cy.get('[data-testid="action-description"]').type('Replace reagent lot');
      cy.get('[data-testid="action-responsible"]').type('Lab Manager');
      cy.get('[data-testid="action-deadline"]').type('2024-01-20');
      
      // Save investigation
      cy.get('[data-testid="save-investigation"]').click();
      cy.contains('Investigation saved').should('be.visible');
    });
  });

  describe('External Quality Assessment', () => {
    it('should submit EQA results', () => {
      cy.visit('/quality-control/eqa');
      
      // Select EQA program
      cy.get('[data-testid="eqa-program"]').select('CAP Chemistry');
      cy.get('[data-testid="survey-id"]').type('C-2024-01');
      
      // Enter results
      cy.get('[data-testid="sample-1-glucose"]').type('142');
      cy.get('[data-testid="sample-1-bun"]').type('28');
      cy.get('[data-testid="sample-1-creatinine"]').type('1.8');
      
      // Submit results
      cy.get('[data-testid="submit-eqa"]').click();
      cy.contains('EQA results submitted').should('be.visible');
    });

    it('should review EQA performance', () => {
      cy.visit('/quality-control/eqa/performance');
      
      // View performance report
      cy.get('[data-testid="eqa-report"]').select('C-2023-04');
      cy.get('[data-testid="view-report"]').click();
      
      // Check performance metrics
      cy.get('[data-testid="performance-summary"]').within(() => {
        cy.contains('Overall Score: 95%').should('be.visible');
        cy.contains('Acceptable Performance').should('be.visible');
      });
      
      // View detailed results
      cy.get('[data-testid="detailed-results"]').click();
      cy.get('[data-testid="result-table"]').should('be.visible');
    });
  });

  describe('Instrument Maintenance', () => {
    it('should schedule maintenance', () => {
      cy.visit('/quality-control/maintenance');
      
      // Create maintenance schedule
      cy.get('[data-testid="new-maintenance"]').click();
      cy.get('[data-testid="instrument"]').select('Analyzer-01');
      cy.get('[data-testid="maintenance-type"]').select('Monthly PM');
      cy.get('[data-testid="scheduled-date"]').type('2024-02-01');
      
      // Add tasks
      cy.get('[data-testid="add-task"]').click();
      cy.get('[data-testid="task-description"]').type('Clean sample probe');
      cy.get('[data-testid="add-task"]').click();
      cy.get('[data-testid="task-description"]').eq(1).type('Replace tubing');
      
      // Save schedule
      cy.get('[data-testid="save-schedule"]').click();
      cy.contains('Maintenance scheduled').should('be.visible');
    });

    it('should complete maintenance checklist', () => {
      cy.visit('/quality-control/maintenance/checklist');
      
      // Complete tasks
      cy.get('[data-testid="maintenance-task"]').each(($task) => {
        cy.wrap($task).within(() => {
          cy.get('[data-testid="task-complete"]').check();
          cy.get('[data-testid="task-notes"]').type('Completed');
        });
      });
      
      // Sign off
      cy.get('[data-testid="technician-signature"]').type('J. Smith');
      cy.get('[data-testid="complete-maintenance"]').click();
      
      cy.contains('Maintenance completed').should('be.visible');
    });
  });
});