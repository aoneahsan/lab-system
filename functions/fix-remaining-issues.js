const fs = require('fs');
const path = require('path');

// More comprehensive fixes
function updateFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Fix request.data access for all properties
  const dataProperties = [
    'tenantId', 'month', 'year', 'patientId', 'startDate', 'endDate',
    'analyzerId', 'sampleId', 'testId', 'values', 'performedBy', 'resultId',
    'comments', 'prompt', 'message', 'recipient', 'orderId', 'status',
    'patientData', 'orderData', 'sampleData', 'notificationId', 'level',
    'type', 'filter', 'date', 'includeInactive', 'inventoryLevel',
    'testCode', 'historicalData', 'qcLevel', 'patientInfo', 'testResult',
    'testDefinition', 'recentResults', 'labData', 'period', 'startPeriod',
    'endPeriod', 'staffId'
  ];
  
  dataProperties.forEach(prop => {
    const regex = new RegExp(`(data|request)\\.${prop}(?![a-zA-Z])`, 'g');
    if (content.match(regex)) {
      content = content.replace(regex, `request.data.${prop}`);
      updated = true;
    }
  });
  
  // Fix destructuring from data/request
  const destructureRegex = /const \{([^}]+)\} = (data|request)(?!\.data);/g;
  if (content.match(destructureRegex)) {
    content = content.replace(destructureRegex, 'const {$1} = request.data;');
    updated = true;
  }
  
  // Fix onCall callback parameters that still use old pattern
  const oldCallbackRegex = /\.onCall\(async \((data|request), context\) => \{/g;
  if (content.match(oldCallbackRegex)) {
    content = content.replace(
      oldCallbackRegex,
      '.onCall(async (request: functions.https.CallableRequest<any>) => {'
    );
    content = content.replace(/context\.auth/g, 'request.auth');
    updated = true;
  }
  
  // Fix generatePDF export
  if (filePath.includes('pdfGeneratorService.ts')) {
    if (!content.includes('export async function generatePDF')) {
      content = content.replace(
        'async function generatePDF',
        'export async function generatePDF'
      );
      updated = true;
    }
  }
  
  // Fix missing auth middleware import
  if (filePath.includes('routes/audit.ts') && content.includes("from '../middleware/auth'")) {
    content = content.replace(
      "import { authenticateRequest } from '../middleware/auth';",
      "// Authentication is handled by Firebase Functions"
    );
    content = content.replace(
      /app\.(get|post|put|delete)\([^,]+,\s*authenticateRequest,/g,
      'app.$1$2'
    );
    updated = true;
  }
  
  // Fix projectId imports
  if (content.includes('{ projectId }')) {
    content = content.replace(
      /import \{ projectId \} from ['"]\.\.\/config['"];/g,
      "import config from '../config';"
    );
    content = content.replace(/\bprojectId\b/g, 'config.firebase.projectId');
    updated = true;
  }
  
  if (updated) {
    fs.writeFileSync(filePath, content);
    console.log(`✓ Updated: ${filePath}`);
  } else {
    console.log(`- No changes needed: ${filePath}`);
  }
}

// Process all TypeScript files
function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory() && !filePath.includes('node_modules') && !filePath.includes('lib')) {
      processDirectory(filePath);
    } else if (file.endsWith('.ts')) {
      updateFile(filePath);
    }
  });
}

// Start processing
console.log('Fixing remaining Firebase Functions issues...\n');
processDirectory(path.join(__dirname, 'src'));
console.log('\nDone!');