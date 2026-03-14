const https = require('https');
const http  = require('http');
const zlib  = require('zlib');
const fs    = require('fs');
const path  = require('path');

// ── Pure-Node PNG generator (no dependencies) ─────────────────────────────────
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const byte of buf) {
    crc ^= byte;
    for (let i = 0; i < 8; i++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  const r = Buffer.alloc(4);
  r.writeUInt32BE((crc ^ 0xFFFFFFFF) >>> 0);
  return r;
}
function pngChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const t = Buffer.from(type);
  return Buffer.concat([len, t, data, crc32(Buffer.concat([t, data]))]);
}
function makePNG(width, height, r, g, b) {
  const sig      = Buffer.from([0x89,0x50,0x4E,0x47,0x0D,0x0A,0x1A,0x0A]);
  const ihdr     = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0); ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 2; // 8-bit RGB, no alpha
  const row    = Buffer.alloc(1 + width * 3);           // filter byte + RGB×width
  for (let x = 0; x < width; x++) { row[1+x*3]=r; row[2+x*3]=g; row[3+x*3]=b; }
  const raw    = Buffer.concat(Array.from({ length: height }, () => row));
  return Buffer.concat([
    sig,
    pngChunk('IHDR', ihdr),
    pngChunk('IDAT', zlib.deflateSync(raw)),
    pngChunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Asset list ────────────────────────────────────────────────────────────────
const ASSETS = [
  { file: 'icon.png',          w: 1024, h: 1024 },
  { file: 'splash.png',        w: 1284, h: 2778 },
  { file: 'adaptive-icon.png', w: 1024, h: 1024 },
  { file: 'favicon.png',       w:   32, h:   32 },
];

// Mushaira brand purple
const [R, G, B] = [0x5B, 0x2C, 0x83];

// ── Setup ─────────────────────────────────────────────────────────────────────
const assetsDir = path.join(__dirname, 'assets');
if (!fs.existsSync(assetsDir)) { fs.mkdirSync(assetsDir, { recursive: true }); console.log('📁 Created assets/'); }

function tryDownload(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);
    const client = url.startsWith('https') ? https : http;
    client.get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        file.close(); if (fs.existsSync(dest)) fs.unlinkSync(dest);
        tryDownload(res.headers.location, dest).then(resolve).catch(reject); return;
      }
      if (res.statusCode !== 200) {
        file.close(); if (fs.existsSync(dest)) fs.unlinkSync(dest);
        reject(new Error(`HTTP ${res.statusCode}`)); return;
      }
      res.pipe(file);
      file.on('finish', () => { file.close(); resolve(); });
    }).on('error', (e) => { file.close(); if (fs.existsSync(dest)) fs.unlinkSync(dest); reject(e); });
  });
}

const CDN_URLS = (name) => [
  `https://raw.githubusercontent.com/expo/expo/sdk-51/templates/expo-template-blank/assets/${name}`,
  `https://raw.githubusercontent.com/expo/create-expo-app/main/packages/create-expo/templates/blank/assets/${name}`,
];

(async () => {
  console.log('⬇️  Setting up app assets...\n');
  for (const { file, w, h } of ASSETS) {
    const dest = path.join(assetsDir, file);
    if (fs.existsSync(dest) && fs.statSync(dest).size > 200) {
      console.log(`  ✅ ${file} — already exists`); continue;
    }
    let ok = false;
    for (const url of CDN_URLS(file)) {
      try { await tryDownload(url, dest); console.log(`  ✅ ${file} — downloaded`); ok = true; break; }
      catch { /* try next */ }
    }
    if (!ok) {
      fs.writeFileSync(dest, makePNG(w, h, R, G, B));
      console.log(`  ✅ ${file} — generated ${w}×${h} purple placeholder`);
    }
  }
  console.log('\n✅ All assets ready.\n');
})();
