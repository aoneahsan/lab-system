export const pdfGeneratorService = {
  async generateReport(data: any) {
    console.log('Generating PDF report...');
    return { success: true, message: 'PDF generation service' };
  }
};