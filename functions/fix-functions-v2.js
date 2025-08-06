const fs = require('fs');
const path = require('path');

// Function to update Firebase Functions v2 API usage
function updateFile(filePath) {
  console.log(`Processing: ${filePath}`);
  let content = fs.readFileSync(filePath, 'utf8');
  let updated = false;
  
  // Fix onCall functions to use CallableRequest
  if (content.includes('functions.https.onCall') && content.includes(', context)')) {
    content = content.replace(
      /export const (\w+) = functions\.https\.onCall\(async \((data|request): (\w+), context\) => \{/g,
      'export const $1 = functions.https.onCall(async (request: functions.https.CallableRequest<$3>) => {'
    );
    
    // Replace context.auth with request.auth
    content = content.replace(/context\.auth/g, 'request.auth');
    
    // Replace data. with request.data.
    content = content.replace(/const \{([^}]+)\} = data;/g, 'const {$1} = request.data;');
    content = content.replace(/const \{([^}]+)\} = request;/g, 'const {$1} = request.data;');
    
    updated = true;
  }
  
  // Fix direct data property access
  content = content.replace(
    /\(request: CallableRequest<any>\): /g,
    '(request: functions.https.CallableRequest<any>): '
  );
  
  // Fix AI response text() calls
  if (content.includes('result.response.text()') && !content.includes('await result.response.text()')) {
    content = content.replace(
      /const response = result\.response\.text\(\);/g,
      'const response = await result.response.text();'
    );
    updated = true;
  }
  
  // Fix import statements for config
  if (content.includes("from '../config'") && content.includes('{ projectId }')) {
    content = content.replace(
      /import \{ projectId \} from '\.\.\/config';/g,
      "import config from '../config';"
    );
    content = content.replace(/projectId,/g, 'config.vertexai.projectId,');
    content = content.replace(/projectId\)/g, 'config.vertexai.projectId)');
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
console.log('Updating Firebase Functions to v2 API...\n');
processDirectory(path.join(__dirname, 'src'));
console.log('\nDone!');