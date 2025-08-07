// Generate placeholder icons for the Chrome extension
import { writeFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// SVG icon content
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
  <rect width="128" height="128" fill="#4f46e5" rx="24"/>
  <text x="64" y="64" text-anchor="middle" dy=".35em" fill="white" font-family="Arial, sans-serif" font-size="48" font-weight="bold">LF</text>
</svg>`;

// Generate PNG placeholders (would need a proper image library in production)
const sizes = [16, 32, 48, 128];

console.log('Generating icon placeholders...');

// Save SVG
writeFileSync(join(__dirname, 'icon.svg'), svgIcon);
console.log('✓ Created icon.svg');

// Create placeholder text files for PNGs
sizes.forEach(size => {
  const placeholder = `Placeholder for ${size}x${size} PNG icon\nReplace with actual PNG file`;
  writeFileSync(join(__dirname, `icon-${size}.png`), placeholder);
  console.log(`✓ Created icon-${size}.png placeholder`);
});

console.log('\n⚠️  Note: Replace the .png placeholders with actual PNG icons before publishing');