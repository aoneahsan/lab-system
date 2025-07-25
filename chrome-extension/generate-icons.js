import sharp from 'sharp';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sizes = [16, 32, 48, 128];

async function generateIcons() {
  const svgBuffer = fs.readFileSync(path.join(__dirname, 'icons', 'icon.svg'));
  
  for (const size of sizes) {
    await sharp(svgBuffer)
      .resize(size, size)
      .png()
      .toFile(path.join(__dirname, 'icons', `icon-${size}.png`));
    
    console.log(`Generated icon-${size}.png`);
  }
  
  // Also copy to public folder for popup
  for (const size of sizes) {
    const iconPath = path.join(__dirname, 'icons', `icon-${size}.png`);
    const publicPath = path.join(__dirname, 'public', `icon${size}.png`);
    fs.copyFileSync(iconPath, publicPath);
    console.log(`Copied to public/icon${size}.png`);
  }
}

generateIcons().catch(console.error);