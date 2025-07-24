import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { TestResult, Sample, Patient, Test } from '@/types';

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

    yPosition = (doc as any).lastAutoTable.finalY + 10;

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
    const pageWidth = doc.internal.pageSize.getWidth();
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

  private addReportPage(doc: jsPDF, data: ReportData, pageNumber: number): void {
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
}

export const pdfService = new PDFService();