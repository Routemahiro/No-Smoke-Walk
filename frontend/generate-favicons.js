const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

async function generateFavicons() {
  const inputFile = path.join(__dirname, 'public', 'favicon-source.png');
  const outputDir = path.join(__dirname, 'public');
  
  // Define favicon sizes
  const sizes = [
    { size: 16, name: 'favicon-16x16.png' },
    { size: 32, name: 'favicon-32x32.png' },
    { size: 48, name: 'favicon-48x48.png' },
    { size: 64, name: 'favicon-64x64.png' },
    { size: 128, name: 'favicon-128x128.png' },
    { size: 256, name: 'favicon-256x256.png' },
    { size: 512, name: 'favicon-512x512.png' }
  ];

  console.log('🎨 Generating favicons...');
  
  // Generate PNG sizes
  for (const { size, name } of sizes) {
    const outputPath = path.join(outputDir, name);
    await sharp(inputFile)
      .resize(size, size)
      .png()
      .toFile(outputPath);
    console.log(`✅ Generated ${name} (${size}x${size})`);
  }
  
  // Generate ICO file for older browsers
  const icoPath = path.join(outputDir, 'favicon.ico');
  await sharp(inputFile)
    .resize(32, 32)
    .png()
    .toFile(icoPath);
  console.log('✅ Generated favicon.ico (32x32)');
  
  // Generate Apple Touch Icon
  const appleTouchPath = path.join(outputDir, 'apple-touch-icon.png');
  await sharp(inputFile)
    .resize(180, 180)
    .png()
    .toFile(appleTouchPath);
  console.log('✅ Generated apple-touch-icon.png (180x180)');
  
  console.log('🎉 All favicons generated successfully!');
}

generateFavicons().catch(console.error);