import { build } from 'esbuild';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..');

// Ensure dist directory exists
const distDir = join(rootDir, 'dist');
if (!existsSync(distDir)) {
  mkdirSync(distDir, { recursive: true });
}

// Build configuration
const buildOptions = {
  entryPoints: [
    join(rootDir, 'src/background/service-worker.js'),
    join(rootDir, 'src/content/emr-detector.js'),
    join(rootDir, 'src/content/emr-injector.js')
  ],
  bundle: true,
  outdir: join(distDir, 'src'),
  format: 'esm',
  platform: 'browser',
  target: 'chrome90',
  sourcemap: process.env.NODE_ENV !== 'production',
  minify: process.env.NODE_ENV === 'production',
  loader: {
    '.js': 'js',
    '.css': 'css'
  }
};

// Copy static files
const staticFiles = [
  'manifest.json',
  'popup.html',
  'popup.css',
  'popup.js',
  'src/content/emr-styles.css'
];

console.log('Building Chrome Extension...');

// Build JavaScript files
build(buildOptions)
  .then(() => {
    console.log('✓ JavaScript files built');
    
    // Copy static files
    staticFiles.forEach(file => {
      const src = join(rootDir, file);
      const dest = join(distDir, file);
      
      // Create directory if needed
      const destDir = dirname(dest);
      if (!existsSync(destDir)) {
        mkdirSync(destDir, { recursive: true });
      }
      
      if (existsSync(src)) {
        copyFileSync(src, dest);
        console.log(`✓ Copied ${file}`);
      } else {
        console.warn(`⚠ File not found: ${file}`);
      }
    });
    
    console.log('\n✅ Build complete! Extension ready in dist/ directory');
    console.log('\nTo install:');
    console.log('1. Open Chrome and go to chrome://extensions/');
    console.log('2. Enable "Developer mode"');
    console.log('3. Click "Load unpacked" and select the dist/ directory');
  })
  .catch((error) => {
    console.error('Build failed:', error);
    process.exit(1);
  });