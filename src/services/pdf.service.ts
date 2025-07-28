import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TestResult, Sample, Patient, Test, Invoice, Payment, QCRun, QCMaterial, QCStatistics } from '@/types';

interface ReportData {
  result: TestResult;
  sample: Sample;
  patient: Patient;
  test: Test;
  tenant: {
    name: string;
    address: {
      street: string;
      city: string;
      state: string;
      zipCode: string;
    };
    contact: {
      phone: string;
      email: string;
    };
  };
}

export class PDFService {
  generateResultReport(data: ReportData): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    let yPosition = 20;

    // Header with lab info
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text(data.tenant.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `${data.tenant.address.street}, ${data.tenant.address.city}, ${data.tenant.address.state} ${data.tenant.address.zipCode}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 5;
    doc.text(
      `Phone: ${data.tenant.contact.phone} | Email: ${data.tenant.contact.email}`,
      pageWidth / 2,
      yPosition,
      { align: 'center' }
    );
    yPosition += 10;

    // Divider line
    doc.setLineWidth(0.5);
    doc.line(20, yPosition, pageWidth - 20, yPosition);
    yPosition += 10;

    // Report Title
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('LABORATORY TEST REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Patient Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Patient Information', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const patientInfo = [
      ['Name:', data.patient.fullName],
      ['Patient ID:', data.patient.patientId],
      ['Date of Birth:', new Date(data.patient.dateOfBirth).toLocaleDateString()],
      ['Gender:', data.patient.gender],
      ['Phone:', data.patient.phone || 'N/A'],
    ];

    patientInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Sample Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Sample Information', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const sampleInfo = [
      ['Sample Number:', data.sample.sampleNumber],
      ['Barcode:', data.sample.barcode],
      ['Type:', data.sample.type],
      ['Collection Date:', data.sample.collectionDate.toDate().toLocaleDateString()],
      ['Collection Time:', data.sample.collectionTime],
      ['Collected By:', data.sample.collectedBy],
    ];

    sampleInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 60, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Test Results
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Test Results', 20, yPosition);
    yPosition += 10;

    // Results table
    const tableData = [[
      data.test.name,
      data.result.value,
      data.result.unit || '-',
      data.test.referenceRange || '-',
      data.result.status,
    ]];

    autoTable(doc, {
      startY: yPosition,
      head: [['Test Name', 'Result', 'Unit', 'Reference Range', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 10,
      },
      columnStyles: {
        4: {
          fontStyle: 'bold',
          textColor: this.getStatusColor(data.result.status),
        },
      },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Notes section if present
    if (data.result.notes) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes', 20, yPosition);
      yPosition += 6;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(data.result.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPosition);
      yPosition += splitNotes.length * 5 + 10;
    }

    // Footer
    const footerY = pageHeight - 30;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Report Date:', 20, footerY);
    doc.text(new Date().toLocaleDateString(), 55, footerY);
    
    doc.text('Reported By:', 20, footerY + 6);
    doc.text(data.result.enteredBy || 'Laboratory Staff', 55, footerY + 6);

    if (data.result.verifiedBy) {
      doc.text('Verified By:', 20, footerY + 12);
      doc.text(data.result.verifiedBy, 55, footerY + 12);
    }

    // Page number
    doc.setFontSize(8);
    doc.text(`Page 1 of 1`, pageWidth / 2, pageHeight - 10, { align: 'center' });

    return doc;
  }

  generateBatchReport(results: ReportData[]): jsPDF {
    const doc = new jsPDF();
    let currentPage = 1;

    results.forEach((data, index) => {
      if (index > 0) {
        doc.addPage();
        currentPage++;
      }

      this.addReportPage(doc, data, currentPage);
    });

    return doc;
  }

  private addReportPage(_doc: jsPDF, _data: ReportData, _pageNumber: number): void {
    // Similar to generateResultReport but as a reusable function
    // Implementation would be same as above but extracted into this method
  }

  private getStatusColor(status: string): number[] {
    switch (status) {
      case 'normal':
        return [0, 128, 0]; // Green
      case 'abnormal':
        return [255, 0, 0]; // Red
      case 'critical':
        return [139, 0, 0]; // Dark Red
      default:
        return [0, 0, 0]; // Black
    }
  }

  downloadReport(doc: jsPDF, filename: string): void {
    doc.save(`${filename}_${new Date().getTime()}.pdf`);
  }

  printReport(doc: jsPDF): void {
    const pdfData = doc.output('datauristring');
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(
        `<iframe width='100%' height='100%' src='${pdfData}'></iframe>`
      );
      printWindow.document.close();
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }
  }

  generateInvoicePDF(
    invoice: Invoice,
    patient: Patient,
    payments: Payment[],
    tenant: {
      name: string;
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
      contact: {
        phone: string;
        email: string;
      };
      taxId?: string;
    }
  ): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('INVOICE', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 15;

    // Lab Info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(tenant.name, 20, yPosition);
    yPosition += 6;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant.address.street, 20, yPosition);
    yPosition += 5;
    doc.text(`${tenant.address.city}, ${tenant.address.state} ${tenant.address.zipCode}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Phone: ${tenant.contact.phone}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Email: ${tenant.contact.email}`, 20, yPosition);
    if (tenant.taxId) {
      yPosition += 5;
      doc.text(`Tax ID: ${tenant.taxId}`, 20, yPosition);
    }

    // Invoice Info
    yPosition = 40;
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Number:', pageWidth - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceNumber, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Invoice Date:', pageWidth - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.invoiceDate.toDate().toLocaleDateString(), pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 5;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Due Date:', pageWidth - 80, yPosition);
    doc.setFont('helvetica', 'normal');
    doc.text(invoice.dueDate.toDate().toLocaleDateString(), pageWidth - 20, yPosition, { align: 'right' });

    // Patient Info
    yPosition = 80;
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Bill To:', 20, yPosition);
    yPosition += 7;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(patient.fullName, 20, yPosition);
    yPosition += 5;
    if (patient.address) {
      doc.text(patient.address.street, 20, yPosition);
      yPosition += 5;
      doc.text(`${patient.address.city}, ${patient.address.state} ${patient.address.zipCode}`, 20, yPosition);
      yPosition += 5;
    }
    doc.text(`Patient ID: ${patient.patientId}`, 20, yPosition);
    yPosition += 15;

    // Items table
    const tableData = invoice.items.map(item => [
      item.testCode,
      item.testName,
      item.quantity.toString(),
      `$${item.unitPrice.toFixed(2)}`,
      item.discount ? `$${item.discount.toFixed(2)}` : '-',
      `$${item.total.toFixed(2)}`
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['Code', 'Description', 'Qty', 'Unit Price', 'Discount', 'Total']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        2: { halign: 'center' },
        3: { halign: 'right' },
        4: { halign: 'right' },
        5: { halign: 'right' }
      },
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Totals
    const totalsX = pageWidth - 80;
    doc.setFont('helvetica', 'normal');
    doc.text('Subtotal:', totalsX, yPosition);
    doc.text(`$${invoice.subtotal.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 5;

    if (invoice.discountAmount > 0) {
      doc.text('Discount:', totalsX, yPosition);
      doc.text(`-$${invoice.discountAmount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 5;
    }

    if (invoice.taxAmount > 0) {
      doc.text('Tax:', totalsX, yPosition);
      doc.text(`$${invoice.taxAmount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
      yPosition += 5;
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Total:', totalsX, yPosition);
    doc.text(`$${invoice.totalAmount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
    yPosition += 5;

    // Payments
    if (payments.length > 0) {
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      payments.forEach(payment => {
        doc.text(`Paid (${payment.method}):`, totalsX, yPosition);
        doc.text(`-$${payment.amount.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });
        yPosition += 5;
      });
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Balance Due:', totalsX, yPosition);
    doc.text(`$${invoice.balanceDue.toFixed(2)}`, pageWidth - 20, yPosition, { align: 'right' });

    // Notes
    if (invoice.notes) {
      yPosition += 15;
      doc.setFontSize(10);
      doc.setFont('helvetica', 'bold');
      doc.text('Notes:', 20, yPosition);
      yPosition += 5;
      doc.setFont('helvetica', 'normal');
      const splitNotes = doc.splitTextToSize(invoice.notes, pageWidth - 40);
      doc.text(splitNotes, 20, yPosition);
    }

    return doc;
  }

  generateQCReportPDF(
    qcRun: QCRun,
    material: QCMaterial,
    statistics?: QCStatistics,
    tenant: {
      name: string;
      address: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
      contact: {
        phone: string;
        email: string;
      };
    }
  ): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('QUALITY CONTROL REPORT', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Lab Info
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 5;
    doc.text(`${tenant.address.street}, ${tenant.address.city}, ${tenant.address.state} ${tenant.address.zipCode}`, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Run Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('QC Run Information', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const runInfo = [
      ['Run Number:', qcRun.runNumber],
      ['Run Date:', qcRun.runDate.toDate().toLocaleDateString()],
      ['Shift:', qcRun.shift.charAt(0).toUpperCase() + qcRun.shift.slice(1)],
      ['Operator:', qcRun.operator],
      ['Instrument:', qcRun.instrumentName || 'N/A'],
      ['Status:', qcRun.status.toUpperCase()]
    ];

    runInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPosition);
      yPosition += 6;
    });
    yPosition += 5;

    // Material Information
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('QC Material Information', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const materialInfo = [
      ['Material:', material.name],
      ['Manufacturer:', material.manufacturer],
      ['Lot Number:', material.lotNumber],
      ['Level:', material.level.toUpperCase()],
      ['Matrix:', material.matrix],
      ['Exp Date:', material.expirationDate.toDate().toLocaleDateString()]
    ];

    materialInfo.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 70, yPosition);
      yPosition += 6;
    });
    yPosition += 10;

    // Results Table
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('QC Results', 20, yPosition);
    yPosition += 8;

    const tableData = qcRun.results.map(result => {
      const analyte = material.analytes.find(a => a.testCode === result.testCode);
      
      return [
        result.testName,
        result.value.toFixed(2),
        result.unit,
        analyte ? `${analyte.targetMean.toFixed(2)} ± ${analyte.targetSD.toFixed(2)}` : 'N/A',
        result.zscore ? result.zscore.toFixed(2) : 'N/A',
        result.status.toUpperCase()
      ];
    });

    autoTable(doc, {
      startY: yPosition,
      head: [['Test', 'Result', 'Unit', 'Target (Mean ± SD)', 'Z-Score', 'Status']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 10,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 9,
      },
      columnStyles: {
        5: {
          fontStyle: 'bold',
          cellWidth: 25
        }
      },
      didDrawCell: (data) => {
        if (data.column.index === 5 && data.row.section === 'body') {
          const status = qcRun.results[data.row.index].status;
          if (status === 'fail') {
            doc.setTextColor(255, 0, 0);
          } else if (status === 'warning') {
            doc.setTextColor(255, 165, 0);
          } else {
            doc.setTextColor(0, 128, 0);
          }
          doc.text(data.cell.text[0], data.cell.x + 2, data.cell.y + data.cell.height / 2 + 1);
          doc.setTextColor(0, 0, 0);
        }
      }
    });

    yPosition = doc.lastAutoTable.finalY + 10;

    // Westgard Rule Violations
    const violations = qcRun.results.filter(r => r.violatedRules && r.violatedRules.length > 0);
    if (violations.length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Westgard Rule Violations', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      violations.forEach(result => {
        doc.setFont('helvetica', 'bold');
        doc.text(`${result.testName}:`, 25, yPosition);
        yPosition += 5;
        
        result.violatedRules.forEach(violation => {
          doc.setFont('helvetica', 'normal');
          const severity = violation.severity === 'rejection' ? '[REJECTION]' : '[WARNING]';
          doc.text(`  ${severity} ${violation.description}`, 30, yPosition);
          yPosition += 5;
        });
        yPosition += 3;
      });
    }

    // Statistics Summary (if provided)
    if (statistics) {
      if (yPosition > 200) {
        doc.addPage();
        yPosition = 20;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Statistical Summary', 20, yPosition);
      yPosition += 8;

      doc.setFontSize(10);
      const statsInfo = [
        ['Period:', `${statistics.periodStart.toDate().toLocaleDateString()} - ${statistics.periodEnd.toDate().toLocaleDateString()}`],
        ['Data Points:', statistics.n.toString()],
        ['Mean:', statistics.mean.toFixed(2)],
        ['SD:', statistics.sd.toFixed(2)],
        ['CV%:', statistics.cv.toFixed(2) + '%'],
        ['Bias%:', statistics.bias.toFixed(2) + '%'],
        ['Sigma:', statistics.sigma.toFixed(2)]
      ];

      statsInfo.forEach(([label, value]) => {
        doc.setFont('helvetica', 'bold');
        doc.text(label, 25, yPosition);
        doc.setFont('helvetica', 'normal');
        doc.text(value, 70, yPosition);
        yPosition += 6;
      });
    }

    // Comments
    if (qcRun.comments) {
      yPosition += 10;
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Comments', 20, yPosition);
      yPosition += 6;
      
      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      const splitComments = doc.splitTextToSize(qcRun.comments, pageWidth - 40);
      doc.text(splitComments, 20, yPosition);
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 20);
    if (qcRun.reviewedBy) {
      doc.text(`Reviewed by: ${qcRun.reviewedBy}`, 20, pageHeight - 15);
    }

    return doc;
  }

  generateQCLeveyJenningsPDF(
    statistics: QCStatistics,
    material: QCMaterial,
    analyte: string,
    tenant: {
      name: string;
    }
  ): jsPDF {
    const doc = new jsPDF('landscape');
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text('Levey-Jennings Chart', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Chart Information
    doc.setFontSize(10);
    doc.text(`Material: ${material.name} (${material.level})`, 20, yPosition);
    yPosition += 5;
    doc.text(`Lot: ${material.lotNumber}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Test: ${analyte}`, 20, yPosition);
    yPosition += 5;
    doc.text(`Period: ${statistics.periodStart.toDate().toLocaleDateString()} - ${statistics.periodEnd.toDate().toLocaleDateString()}`, 20, yPosition);
    yPosition += 5;
    doc.text(`N = ${statistics.n}, Mean = ${statistics.mean.toFixed(2)}, SD = ${statistics.sd.toFixed(2)}, CV = ${statistics.cv.toFixed(2)}%`, 20, yPosition);
    yPosition += 15;

    // Note about chart
    doc.setFontSize(12);
    doc.setFont('helvetica', 'italic');
    doc.text('Note: For the actual Levey-Jennings chart visualization, please view in the application.', pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 10;

    // Data Points Table
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('QC Data Points', 20, yPosition);
    yPosition += 5;

    const tableData = statistics.dataPoints.map((point, index) => [
      (index + 1).toString(),
      point.runDate.toDate().toLocaleDateString(),
      point.value.toFixed(2),
      point.zscore.toFixed(2),
      point.status.toUpperCase(),
      point.isExcluded ? 'Yes' : 'No'
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [['#', 'Date', 'Value', 'Z-Score', 'Status', 'Excluded']],
      body: tableData,
      theme: 'striped',
      headStyles: {
        fillColor: [41, 128, 185],
        textColor: 255,
        fontSize: 9,
        fontStyle: 'bold',
      },
      bodyStyles: {
        fontSize: 8,
      },
      columnStyles: {
        0: { cellWidth: 15 },
        4: { fontStyle: 'bold' },
        5: { fontStyle: 'bold' }
      }
    });

    return doc;
  }

  generateFinancialReportPDF(
    reportType: 'revenue' | 'aging' | 'insurance' | 'monthly',
    reportData: any,
    tenant: {
      name: string;
      address?: {
        street: string;
        city: string;
        state: string;
        zipCode: string;
      };
    },
    dateRange?: { start: Date; end: Date }
  ): jsPDF {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    let yPosition = 20;

    // Header
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    const reportTitle = {
      revenue: 'Revenue Report',
      aging: 'Accounts Receivable Aging Report',
      insurance: 'Insurance Analysis Report',
      monthly: 'Monthly Summary Report'
    }[reportType];
    
    doc.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 8;

    // Tenant info
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(tenant.name, pageWidth / 2, yPosition, { align: 'center' });
    yPosition += 6;

    // Date range
    if (dateRange) {
      doc.setFontSize(10);
      doc.text(
        `Period: ${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`,
        pageWidth / 2,
        yPosition,
        { align: 'center' }
      );
      yPosition += 10;
    }

    // Report content based on type
    switch (reportType) {
      case 'revenue':
        this.addRevenueReportContent(doc, reportData, yPosition);
        break;
      case 'aging':
        this.addAgingReportContent(doc, reportData, yPosition);
        break;
      case 'insurance':
        this.addInsuranceReportContent(doc, reportData, yPosition);
        break;
      case 'monthly':
        this.addMonthlyReportContent(doc, reportData, yPosition);
        break;
    }

    // Footer
    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${new Date().toLocaleString()}`, 20, pageHeight - 10);

    return doc;
  }

  private addRevenueReportContent(doc: jsPDF, data: any, startY: number) {
    let yPosition = startY;

    // Summary section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue Summary', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    const summaryData = [
      ['Total Revenue:', `$${data.totalRevenue.toFixed(2)}`],
      ['Collected:', `$${data.collectedRevenue.toFixed(2)}`],
      ['Pending:', `$${data.pendingRevenue.toFixed(2)}`],
      ['Collection Rate:', `${((data.collectedRevenue / data.totalRevenue) * 100).toFixed(1)}%`]
    ];

    summaryData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 80, yPosition);
      yPosition += 6;
    });

    yPosition += 10;

    // Revenue by category table
    if (data.revenueByCategory && Object.keys(data.revenueByCategory).length > 0) {
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Revenue by Category', 20, yPosition);
      yPosition += 8;

      const categoryData = Object.entries(data.revenueByCategory)
        .map(([category, amount]) => [category, `$${(amount as number).toFixed(2)}`]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Category', 'Amount']],
        body: categoryData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185] },
        columnStyles: { 1: { halign: 'right' } }
      });
    }
  }

  private addAgingReportContent(doc: jsPDF, data: any, startY: number) {
    const yPosition = startY;

    doc.setFontSize(10);
    const agingData = [
      ['Current (0-30 days)', data.current.count, `$${data.current.amount.toFixed(2)}`],
      ['31-60 days', data.thirtyDays.count, `$${data.thirtyDays.amount.toFixed(2)}`],
      ['61-90 days', data.sixtyDays.count, `$${data.sixtyDays.amount.toFixed(2)}`],
      ['Over 90 days', data.overNinetyDays.count, `$${data.overNinetyDays.amount.toFixed(2)}`],
      ['Total Outstanding', 
       data.current.count + data.thirtyDays.count + data.sixtyDays.count + data.overNinetyDays.count,
       `$${data.totalOutstanding.toFixed(2)}`]
    ];

    autoTable(doc, {
      startY: yPosition,
      head: [['Aging Period', 'Count', 'Amount']],
      body: agingData,
      theme: 'striped',
      headStyles: { fillColor: [41, 128, 185] },
      columnStyles: {
        1: { halign: 'center' },
        2: { halign: 'right' }
      },
      footStyles: { fontStyle: 'bold' }
    });
  }

  private addInsuranceReportContent(doc: jsPDF, data: any, startY: number) {
    let yPosition = startY;

    // Summary
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Insurance Claims Summary', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    const summaryData = [
      ['Total Claims:', data.totalClaims.toString()],
      ['Total Claim Amount:', `$${data.totalClaimAmount.toFixed(2)}`],
      ['Approved Amount:', `$${data.approvedAmount.toFixed(2)}`],
      ['Denied Amount:', `$${data.deniedAmount.toFixed(2)}`],
      ['Pending Amount:', `$${data.pendingAmount.toFixed(2)}`],
      ['Approval Rate:', `${data.approvalRate.toFixed(1)}%`],
      ['Avg Processing Days:', data.averageProcessingDays.toFixed(1)]
    ];

    summaryData.forEach(([label, value]) => {
      doc.setFont('helvetica', 'bold');
      doc.text(label, 25, yPosition);
      doc.setFont('helvetica', 'normal');
      doc.text(value, 90, yPosition);
      yPosition += 6;
    });
  }

  private addMonthlyReportContent(doc: jsPDF, data: any, startY: number) {
    let yPosition = startY;

    // Revenue section
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Revenue', 20, yPosition);
    yPosition += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Invoiced: $${data.revenue.invoiced.toFixed(2)}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Collected: $${data.revenue.collected.toFixed(2)}`, 25, yPosition);
    yPosition += 5;
    doc.text(`Outstanding: $${data.revenue.outstanding.toFixed(2)}`, 25, yPosition);
    yPosition += 10;

    // Tests performed
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Tests Performed', 20, yPosition);
    yPosition += 8;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Total Tests: ${data.tests.totalPerformed}`, 25, yPosition);
    yPosition += 10;

    // Top tests table
    if (data.topTests && data.topTests.length > 0) {
      doc.setFontSize(11);
      doc.setFont('helvetica', 'bold');
      doc.text('Top Tests by Revenue', 20, yPosition);
      yPosition += 8;

      const topTestsData = data.topTests.slice(0, 5).map((test: any) => [
        test.testName,
        test.count.toString(),
        `$${test.revenue.toFixed(2)}`
      ]);

      autoTable(doc, {
        startY: yPosition,
        head: [['Test Name', 'Count', 'Revenue']],
        body: topTestsData,
        theme: 'striped',
        headStyles: { fillColor: [41, 128, 185], fontSize: 9 },
        bodyStyles: { fontSize: 9 },
        columnStyles: {
          1: { halign: 'center' },
          2: { halign: 'right' }
        }
      });
    }
  }
}

export const pdfService = new PDFService();