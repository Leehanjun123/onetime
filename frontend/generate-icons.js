const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Icon sizes for PWA
const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create base icon with sharp
async function generateIcons() {
  const iconDir = path.join(__dirname, 'public', 'icons');
  
  // Ensure icons directory exists
  if (!fs.existsSync(iconDir)) {
    fs.mkdirSync(iconDir, { recursive: true });
  }

  // Create a simple colored square as base icon
  const svgIcon = `
    <svg width="512" height="512" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" style="stop-color:#3B82F6;stop-opacity:1" />
          <stop offset="100%" style="stop-color:#60A5FA;stop-opacity:1" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="64" fill="url(#grad)"/>
      <text x="256" y="320" font-family="Arial, sans-serif" font-size="200" font-weight="bold" text-anchor="middle" fill="white">일</text>
    </svg>
  `;

  // Generate icons for each size
  for (const size of sizes) {
    await sharp(Buffer.from(svgIcon))
      .resize(size, size)
      .png()
      .toFile(path.join(iconDir, `icon-${size}x${size}.png`));
    
    console.log(`✓ Generated icon-${size}x${size}.png`);
  }

  // Also create apple-touch-icon
  await sharp(Buffer.from(svgIcon))
    .resize(180, 180)
    .png()
    .toFile(path.join(iconDir, 'apple-touch-icon.png'));
  
  console.log('✓ Generated apple-touch-icon.png');

  // Create favicon.ico
  await sharp(Buffer.from(svgIcon))
    .resize(32, 32)
    .png()
    .toFile(path.join(__dirname, 'public', 'favicon.ico'));
  
  console.log('✓ Generated favicon.ico');
}

generateIcons().catch(console.error);