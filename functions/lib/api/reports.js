"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateReport = exports.getReportTemplates = void 0;
const auth_1 = require("../middleware/auth");
const pdfkit_1 = __importDefault(require("pdfkit"));
const exceljs_1 = __importDefault(require("exceljs"));
const projectPrefix = 'labflow_';
// Get report templates
const getReportTemplates = async (req, res) => {
    try {
        await (0, auth_1.authenticateRequest)(req, res, async () => {
            const templates = [
                {
                    id: 'patient-results',
                    name: 'Patient Results Report',
                    description: 'Comprehensive patient test results with history',
                    type: 'patient',
                    parameters: ['patientId', 'dateRange']
                },
                {
                    id: 'daily-summary',
                    name: 'Daily Summary Report',
                    description: 'Summary of all tests performed in a day',
                    type: 'operational',
                    parameters: ['date', 'department']
                },
                {
                    id: 'qc-report',
                    name: 'Quality Control Report',
                    description: 'QC results and trends analysis',
                    type: 'quality',
                    parameters: ['dateRange', 'testType']
                },
                {
                    id: 'financial-summary',
                    name: 'Financial Summary',
                    description: 'Revenue and billing summary',
                    type: 'financial',
                    parameters: ['dateRange', 'insuranceType']
                }
            ];
            res.json(templates);
        });
    }
    catch (error) {
        console.error('Error getting report templates:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.getReportTemplates = getReportTemplates;
// Generate report
const generateReport = async (req, res) => {
    try {
        await (0, auth_1.authenticateRequest)(req, res, async () => {
            const { templateId, filters, format } = req.body;
            // Get report data based on template
            const reportData = await getReportData(templateId, filters);
            switch (format) {
                case 'pdf':
                    generatePDFReport(reportData, res);
                    break;
                case 'excel':
                    generateExcelReport(reportData, res);
                    break;
                case 'csv':
                    generateCSVReport(reportData, res);
                    break;
                default:
                    res.status(400).json({ error: 'Invalid format' });
            }
        });
    }
    catch (error) {
        console.error('Error generating report:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};
exports.generateReport = generateReport;
// Get report data
async function getReportData(templateId, filters) {
    // This would fetch actual data based on template and filters
    return {
        title: 'Lab Report',
        generatedAt: new Date(),
        data: [],
        summary: {}
    };
}
// Generate PDF report
function generatePDFReport(data, res) {
    const doc = new pdfkit_1.default();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename=report.pdf');
    doc.pipe(res);
    // Add content
    doc.fontSize(20).text(data.title, { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Generated: ${data.generatedAt.toLocaleString()}`);
    // Add more content based on data...
    doc.end();
}
// Generate Excel report
async function generateExcelReport(data, res) {
    const workbook = new exceljs_1.default.Workbook();
    const worksheet = workbook.addWorksheet('Report');
    // Add headers
    worksheet.addRow([data.title]);
    worksheet.addRow([`Generated: ${data.generatedAt.toLocaleString()}`]);
    worksheet.addRow([]);
    // Add data...
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=report.xlsx');
    await workbook.xlsx.write(res);
}
// Generate CSV report
function generateCSVReport(data, res) {
    let csv = `${data.title}\n`;
    csv += `Generated: ${data.generatedAt.toLocaleString()}\n\n`;
    // Add CSV data...
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=report.csv');
    res.send(csv);
}
//# sourceMappingURL=reports.js.map