#!/usr/bin/env node

/**
 * Script to batch replace console usage with logger service
 * Run with: node replace-console-usage.js
 */

const fs = require('fs');
const path = require('path');

// Define logger mappings for different types of files
const loggerMappings = {
  // Services
  '/services/': {
    logger: 'logger',
    import: "import { logger } from '@/services/logger.service';"
  },
  '/services/auth': {
    logger: 'authLogger',
    import: "import { authLogger } from '@/services/logger.service';"
  },
  '/services/firebase': {
    logger: 'firebaseLogger',
    import: "import { firebaseLogger } from '@/services/logger.service';"
  },
  '/services/api': {
    logger: 'apiLogger',
    import: "import { apiLogger } from '@/services/logger.service';"
  },
  '/services/billing': {
    logger: 'billingLogger',
    import: "import { billingLogger } from '@/services/logger.service';"
  },
  '/services/inventory': {
    logger: 'inventoryLogger',
    import: "import { inventoryLogger } from '@/services/logger.service';"
  },
  '/services/offline': {
    logger: 'offlineLogger',
    import: "import { offlineLogger } from '@/services/logger.service';"
  },
  // Components and pages
  '/components/': {
    logger: 'uiLogger',
    import: "import { uiLogger } from '@/services/logger.service';"
  },
  '/pages/': {
    logger: 'uiLogger',
    import: "import { uiLogger } from '@/services/logger.service';"
  },
  // Stores
  '/stores/': {
    logger: 'logger',
    import: "import { logger } from '@/services/logger.service';"
  },
  // Hooks
  '/hooks/': {
    logger: 'logger',
    import: "import { logger } from '@/services/logger.service';"
  }
};

// Console method mappings
const consoleMethods = {
  'console.error': 'error',
  'console.warn': 'warn',
  'console.log': 'log',
  'console.info': 'info',
  'console.debug': 'debug'
};

function getLoggerForFile(filePath) {
  for (const [pattern, config] of Object.entries(loggerMappings)) {
    if (filePath.includes(pattern)) {
      return config;
    }
  }
  // Default fallback
  return {
    logger: 'logger',
    import: "import { logger } from '@/services/logger.service';"
  };
}

function replaceConsoleInFile(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    const originalContent = content;
    
    const loggerConfig = getLoggerForFile(filePath);
    let hasConsoleUsage = false;
    let needsImport = false;
    
    // Replace console methods
    for (const [consoleMethod, loggerMethod] of Object.entries(consoleMethods)) {
      const regex = new RegExp(`\\b${consoleMethod.replace('.', '\\.')}\\b`, 'g');
      if (regex.test(content)) {
        hasConsoleUsage = true;
        content = content.replace(regex, `${loggerConfig.logger}.${loggerMethod}`);
      }
    }
    
    // Add import if needed and not already present
    if (hasConsoleUsage && !content.includes(loggerConfig.import)) {
      needsImport = true;
      // Find the last import statement
      const importRegex = /^import.*from.*['""];$/gm;
      const imports = content.match(importRegex);
      if (imports && imports.length > 0) {
        const lastImport = imports[imports.length - 1];
        content = content.replace(lastImport, lastImport + '\n' + loggerConfig.import);
      } else {
        // If no imports found, add at the top
        content = loggerConfig.import + '\n\n' + content;
      }
    }
    
    // Only write if content changed
    if (content !== originalContent) {
      fs.writeFileSync(filePath, content, 'utf8');
      return {
        updated: true,
        consoleUsage: hasConsoleUsage,
        addedImport: needsImport
      };
    }
    
    return { updated: false };
  } catch (error) {
    console.error(`Error processing ${filePath}:`, error.message);
    return { updated: false, error: error.message };
  }
}

function findTypeScriptFiles(dir, files = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    
    if (entry.isDirectory() && !entry.name.startsWith('.') && entry.name !== 'node_modules') {
      findTypeScriptFiles(fullPath, files);
    } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
      // Skip test files and already processed files
      if (!entry.name.includes('.test.') && 
          !entry.name.includes('.spec.') && 
          !fullPath.includes('logger.service.ts')) {
        files.push(fullPath);
      }
    }
  }
  
  return files;
}

// Main execution
console.log('🔄 Starting console usage replacement...\n');

const srcDir = path.join(__dirname, 'src');
const tsFiles = findTypeScriptFiles(srcDir);

console.log(`Found ${tsFiles.length} TypeScript files to process.\n`);

let processedCount = 0;
let updatedCount = 0;
let errorCount = 0;

for (const filePath of tsFiles) {
  const relativePath = path.relative(__dirname, filePath);
  const result = replaceConsoleInFile(filePath);
  
  processedCount++;
  
  if (result.error) {
    console.error(`❌ Error: ${relativePath} - ${result.error}`);
    errorCount++;
  } else if (result.updated) {
    console.log(`✅ Updated: ${relativePath}`);
    updatedCount++;
  }
  
  // Show progress every 50 files
  if (processedCount % 50 === 0) {
    console.log(`📈 Progress: ${processedCount}/${tsFiles.length} files processed`);
  }
}

console.log('\n🎉 Console replacement completed!');
console.log(`📊 Summary:`);
console.log(`   Total files: ${tsFiles.length}`);
console.log(`   Updated: ${updatedCount}`);
console.log(`   Errors: ${errorCount}`);
console.log(`   Unchanged: ${tsFiles.length - updatedCount - errorCount}`);

if (updatedCount > 0) {
  console.log('\n💡 Next steps:');
  console.log('   1. Review the changes with git diff');
  console.log('   2. Test the application to ensure everything works');
  console.log('   3. Commit the changes');
  console.log('   4. Set VITE_LOG_LEVEL=warn in your .env file');
}

console.log('\n🎯 To control log levels:');
console.log('   - Set VITE_LOG_LEVEL in .env (verbose, debug, info, log, warn, error, silent)');
console.log('   - Use logger.setLogLevel() at runtime');
console.log('   - Enable debug mode with logger.enableDebugMode()');