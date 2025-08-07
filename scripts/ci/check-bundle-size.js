#!/usr/bin/env node

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Bundle size limits in KB
const BUNDLE_SIZE_LIMITS = {
  'main.js': 300,
  'vendor.js': 500,
  'total': 1000
};

async function checkBundleSize() {
  const distPath = path.join(__dirname, '../../dist/assets');
  
  if (!fs.existsSync(distPath)) {
    console.error('Build directory not found. Run build first.');
    process.exit(1);
  }

  const files = fs.readdirSync(distPath);
  const sizes = {};
  let totalSize = 0;

  files.forEach(file => {
    if (file.endsWith('.js')) {
      const stats = fs.statSync(path.join(distPath, file));
      const sizeInKB = stats.size / 1024;
      
      // Categorize files
      if (file.includes('index-')) {
        sizes['main.js'] = (sizes['main.js'] || 0) + sizeInKB;
      } else if (file.includes('vendor-')) {
        sizes['vendor.js'] = (sizes['vendor.js'] || 0) + sizeInKB;
      }
      
      totalSize += sizeInKB;
    }
  });

  sizes['total'] = totalSize;

  // Check against limits
  let hasExceededLimit = false;
  const report = [];

  Object.entries(sizes).forEach(([bundle, size]) => {
    const limit = BUNDLE_SIZE_LIMITS[bundle];
    const status = size > limit ? '❌' : '✅';
    
    if (size > limit) {
      hasExceededLimit = true;
    }

    report.push({
      bundle,
      size: size.toFixed(2),
      limit,
      status,
      percentage: ((size / limit) * 100).toFixed(1)
    });
  });

  // Generate report
  console.log('\n📦 Bundle Size Report\n');
  console.log('Bundle          Size (KB)    Limit (KB)    Status    Usage');
  console.log('─'.repeat(60));

  report.forEach(({ bundle, size, limit, status, percentage }) => {
    const bundleName = bundle.padEnd(15);
    const sizeStr = size.padEnd(12);
    const limitStr = limit.toString().padEnd(13);
    const percentageStr = `${percentage}%`.padEnd(8);
    
    console.log(`${bundleName} ${sizeStr} ${limitStr} ${status}       ${percentageStr}`);
  });

  // Generate GitHub summary if in CI
  if (process.env.GITHUB_ACTIONS) {
    const summaryPath = process.env.GITHUB_STEP_SUMMARY;
    if (summaryPath) {
      let summary = '## 📦 Bundle Size Report\n\n';
      summary += '| Bundle | Size (KB) | Limit (KB) | Status | Usage |\n';
      summary += '|--------|-----------|------------|--------|-------|\n';
      
      report.forEach(({ bundle, size, limit, status, percentage }) => {
        summary += `| ${bundle} | ${size} | ${limit} | ${status} | ${percentage}% |\n`;
      });

      fs.appendFileSync(summaryPath, summary);
    }
  }

  if (hasExceededLimit) {
    console.error('\n❌ Bundle size limits exceeded!');
    console.log('\nTips to reduce bundle size:');
    console.log('- Use dynamic imports for large components');
    console.log('- Check for duplicate dependencies');
    console.log('- Enable tree shaking');
    console.log('- Use production builds of libraries');
    process.exit(1);
  } else {
    console.log('\n✅ All bundle sizes within limits!');
  }
}

checkBundleSize().catch(error => {
  console.error('Error checking bundle size:', error);
  process.exit(1);
});