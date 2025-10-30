/*
  generate-default-png.js
  Writes a small default PNG to assets/images/default.png from an embedded base64 string.
  Run: node tools/generate-default-png.js
*/
const fs = require('fs');
const path = require('path');

const base64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAAIElEQVR4nO3BMQEAAADCoPVPbQ0PoAAAAAAAAAAAAAAA4FoDAAAH2k1GgAAAABJRU5ErkJggg==';
// The above is a small placeholder PNG (approx 32x32) encoded as base64. Replace if you want a different image.

const outPath = path.join(__dirname, '..', 'assets', 'images', 'default.png');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, Buffer.from(base64, 'base64'));
console.log('Wrote', outPath);
