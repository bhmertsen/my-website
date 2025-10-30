/*
  resize-image.js
  Usage:
    node resize-image.js <inputPath> <outputPath> <scale>
  Example (50%):
    node resize-image.js ../assets/images/profile-original.png ../assets/images/profile-small.png 0.5

  This script uses sharp. From project root:
    cd tools
    npm install
    node resize-image.js ../assets/images/profile-original.png ../assets/images/profile-small.png 0.5
*/

const sharp = require('sharp');
const path = require('path');

async function run(){
  const args = process.argv.slice(2);
  if(args.length < 3){
    console.error('Usage: node resize-image.js <inputPath> <outputPath> <scale>');
    process.exit(2);
  }
  const input = path.resolve(args[0]);
  const output = path.resolve(args[1]);
  const scale = parseFloat(args[2]);
  if(isNaN(scale) || scale <= 0 || scale > 1){
    console.error('Scale must be a number between 0 and 1 (e.g. 0.5)');
    process.exit(2);
  }

  try{
    const meta = await sharp(input).metadata();
    const width = meta.width ? Math.round(meta.width * scale) : null;
    const height = meta.height ? Math.round(meta.height * scale) : null;
    console.log(`Input: ${input}`);
    console.log(`Original size: ${meta.width}x${meta.height}, resizing to ${width}x${height}`);

    // Ensure output dir exists
    const fs = require('fs');
    const outDir = path.dirname(output);
    fs.mkdirSync(outDir, { recursive: true });

    // Resize keeping aspect ratio
    let pipeline = sharp(input);
    if(width) pipeline = pipeline.resize(width, height, { fit: 'inside' });
    await pipeline.toFile(output);
    console.log('Wrote resized image to', output);
  }catch(err){
    console.error('Error while resizing:', err.message || err);
    process.exit(1);
  }
}

run();
