#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Required environment variables
const REQUIRED_ENV_VARS = {
  production: [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID',
    'VITE_FIREBASE_MEASUREMENT_ID',
    'VITE_SENTRY_DSN',
    'VITE_ENVIRONMENT'
  ],
  development: [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_AUTH_DOMAIN',
    'VITE_FIREBASE_PROJECT_ID',
    'VITE_FIREBASE_STORAGE_BUCKET',
    'VITE_FIREBASE_MESSAGING_SENDER_ID',
    'VITE_FIREBASE_APP_ID'
  ],
  test: [
    'VITE_FIREBASE_API_KEY',
    'VITE_FIREBASE_PROJECT_ID'
  ]
};

// Sensitive patterns that should not be in code
const SENSITIVE_PATTERNS = [
  /api[_-]?key\s*[:=]\s*["'][\w-]+["']/i,
  /password\s*[:=]\s*["'][\w-]+["']/i,
  /secret\s*[:=]\s*["'][\w-]+["']/i,
  /private[_-]?key\s*[:=]\s*["'][\w-]+["']/i,
  /AIza[0-9A-Za-z-_]{35}/g, // Firebase API key pattern
];

function validateEnvironment(environment = 'development') {
  console.log(`\n🔍 Validating environment: ${environment}\n`);
  
  const requiredVars = REQUIRED_ENV_VARS[environment] || REQUIRED_ENV_VARS.development;
  const missing = [];
  const present = [];

  // Check required variables
  requiredVars.forEach(varName => {
    if (process.env[varName]) {
      present.push(varName);
    } else {
      missing.push(varName);
    }
  });

  // Display results
  if (present.length > 0) {
    console.log('✅ Present environment variables:');
    present.forEach(v => console.log(`   - ${v}`));
  }

  if (missing.length > 0) {
    console.log('\n❌ Missing environment variables:');
    missing.forEach(v => console.log(`   - ${v}`));
  }

  // Check for .env file
  const envPath = path.join(__dirname, '../../.env');
  const envExamplePath = path.join(__dirname, '../../.env.example');
  
  if (!fs.existsSync(envPath) && fs.existsSync(envExamplePath)) {
    console.log('\n⚠️  No .env file found. Copy .env.example to .env and fill in values.');
  }

  // Validate no sensitive data in code
  console.log('\n🔍 Checking for hardcoded secrets...');
  const srcPath = path.join(__dirname, '../../src');
  let secretsFound = false;

  function checkFile(filePath) {
    if (!filePath.endsWith('.ts') && !filePath.endsWith('.tsx') && !filePath.endsWith('.js')) {
      return;
    }

    const content = fs.readFileSync(filePath, 'utf8');
    SENSITIVE_PATTERNS.forEach(pattern => {
      const matches = content.match(pattern);
      if (matches) {
        secretsFound = true;
        console.log(`\n❌ Potential secret found in ${filePath}:`);
        matches.forEach(match => {
          console.log(`   ${match.substring(0, 50)}...`);
        });
      }
    });
  }

  function walkDir(dir) {
    const files = fs.readdirSync(dir);
    files.forEach(file => {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isDirectory() && !file.startsWith('.') && file !== 'node_modules') {
        walkDir(filePath);
      } else if (stat.isFile()) {
        checkFile(filePath);
      }
    });
  }

  if (fs.existsSync(srcPath)) {
    walkDir(srcPath);
  }

  if (!secretsFound) {
    console.log('✅ No hardcoded secrets found.');
  }

  // Generate report for CI
  if (process.env.GITHUB_ACTIONS) {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      let summary = '## 🔐 Environment Validation Report\n\n';
      summary += `**Environment:** ${environment}\n\n`;
      
      if (missing.length === 0) {
        summary += '✅ All required environment variables are present.\n\n';
      } else {
        summary += '❌ Missing environment variables:\n';
        missing.forEach(v => summary += `- ${v}\n`);
        summary += '\n';
      }

      if (secretsFound) {
        summary += '⚠️ **Warning:** Potential hardcoded secrets found in code!\n';
      } else {
        summary += '✅ No hardcoded secrets detected.\n';
      }

      fs.appendFileSync(summaryPath, summary);
    }
  }

  // Exit with error if validation failed
  if (missing.length > 0 || secretsFound) {
    process.exit(1);
  }

  console.log('\n✅ Environment validation passed!');
}

// Run validation
const environment = process.argv[2] || process.env.NODE_ENV || 'development';
validateEnvironment(environment);