import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer
  const buffer = Buffer.alloc(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      buffer[idx] = r;
      buffer[idx + 1] = g;
      buffer[idx + 2] = b;
      buffer[idx + 3] = a;
    }
  }

  // Scanlines with filter byte 0
  const scanlines = Buffer.alloc(height * (width * 4 + 1));
  let scanIdx = 0;
  for (let y = 0; y < height; y++) {
    scanlines[scanIdx++] = 0; // Filter: None
    const rowStart = y * width * 4;
    buffer.copy(scanlines, scanIdx, rowStart, rowStart + width * 4);
    scanIdx += width * 4;
  }

  const compressed = zlib.deflateSync(scanlines, { level: 9 });

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR Chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type RGBA
  ihdrData[10] = 0; // compression
  ihdrData[11] = 0; // filter
  ihdrData[12] = 0; // interlace

  const ihdrChunk = makeChunk('IHDR', ihdrData);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const chunk = Buffer.alloc(4 + 4 + len + 4);
  chunk.writeUInt32BE(len, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crcTarget = Buffer.alloc(4 + len);
  chunk.copy(crcTarget, 0, 4, 8 + len);
  const crc = crc32(crcTarget);
  chunk.writeUInt32BE(crc, 8 + len);

  return chunk;
}

// CRC32 table
const crcTable = new Uint32Array(256);
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) {
      c = 0xedb88320 ^ (c >>> 1);
    } else {
      c = c >>> 1;
    }
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

// Ensure public directory
const publicDir = path.resolve('public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Icon design: PocketSmart AI branding (Emerald Green + Deep Navy/Slate + White Wallet/Graph motif)
function drawAppIcon(x, y, w, h, isMaskable = false) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2;
  const dist = Math.hypot(x - cx, y - cy);

  // Background
  const gradientT = (x + y) / (w + h);
  // Slate-900 (#0f172a) to Slate-950 (#020617)
  let bgR = Math.round(15 * (1 - gradientT) + 2 * gradientT);
  let bgG = Math.round(23 * (1 - gradientT) + 6 * gradientT);
  let bgB = Math.round(42 * (1 - gradientT) + 23 * gradientT);

  if (!isMaskable && dist > r) {
    return [0, 0, 0, 0]; // Rounded outer icon
  }

  // Emerald glowing circle border in center
  const ringRadius = w * 0.38;
  const ringDist = Math.abs(dist - ringRadius);
  if (ringDist < w * 0.02) {
    const ringAlpha = Math.max(0, 1 - ringDist / (w * 0.02));
    bgR = Math.round(bgR * (1 - ringAlpha) + 16 * ringAlpha);
    bgG = Math.round(bgG * (1 - ringAlpha) + 185 * ringAlpha);
    bgB = Math.round(bgB * (1 - ringAlpha) + 129 * ringAlpha);
  }

  // Center wallet / credit symbol & upward growth arrow
  const nx = (x - cx) / (w * 0.32);
  const ny = (y - cy) / (h * 0.32);

  // Draw card/wallet rectangle (-0.6 <= nx <= 0.6, -0.4 <= ny <= 0.4)
  if (nx >= -0.65 && nx <= 0.65 && ny >= -0.45 && ny <= 0.45) {
    // Card base emerald-500 gradient
    const cardG = 185;
    const cardR = 16;
    const cardB = 129;

    // Card chip or fold
    if (nx <= -0.15 && ny >= -0.15 && ny <= 0.15) {
      return [254, 240, 138, 255]; // Yellow gold chip
    }

    // Chart trend line inside card
    const targetY = -0.3 + (nx + 0.5) * 0.5; // upward slope
    if (Math.abs(ny - targetY) < 0.08 && nx >= -0.1 && nx <= 0.55) {
      return [255, 255, 255, 255]; // White trend line
    }

    return [cardR, cardG, cardB, 255];
  }

  // Upward Arrow above card (-0.2 <= nx <= 0.5, -0.8 <= ny <= -0.45)
  if (ny < -0.45 && ny > -0.85) {
    const arrowX = nx - 0.3;
    const arrowY = ny + 0.65;
    if (Math.abs(arrowX) + Math.abs(arrowY) < 0.22) {
      return [52, 211, 153, 255]; // Light emerald growth arrow
    }
  }

  return [bgR, bgG, bgB, 255];
}

console.log('Generating PNG icons for Android PWA...');

const pwa192 = createPNG(192, 192, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.png'), pwa192);

const pwa512 = createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.png'), pwa512);

const pwaMaskable = createPNG(512, 512, (x, y, w, h) => drawAppIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.png'), pwaMaskable);

const appleTouch = createPNG(180, 180, (x, y, w, h) => drawAppIcon(x, y, w, h, true));
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), appleTouch);

const favicon = createPNG(64, 64, (x, y, w, h) => drawAppIcon(x, y, w, h, false));
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), favicon);

// Brand SVG
const svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f172a" />
      <stop offset="100%" stop-color="#020617" />
    </linearGradient>
    <linearGradient id="emerald" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#10b981" />
      <stop offset="100%" stop-color="#059669" />
    </linearGradient>
    <linearGradient id="glow" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#34d399" />
      <stop offset="100%" stop-color="#10b981" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="128" fill="url(#bg)" />
  <circle cx="256" cy="256" r="190" stroke="#10b981" stroke-width="8" stroke-dasharray="12 12" fill="none" opacity="0.4" />
  <!-- Wallet / Card Base -->
  <rect x="136" y="180" width="240" height="152" rx="24" fill="url(#emerald)" filter="drop-shadow(0 12px 24px rgba(16, 185, 129, 0.35))" />
  <!-- Card Detail -->
  <rect x="160" y="210" width="48" height="36" rx="8" fill="#fef08a" opacity="0.9" />
  <path d="M228 280 L272 236 L304 256 L348 204" stroke="#ffffff" stroke-width="12" stroke-linecap="round" stroke-linejoin="round" fill="none" />
  <polygon points="348,224 348,204 328,204" fill="#ffffff" />
  <!-- Upward Trend Badge -->
  <circle cx="348" cy="150" r="32" fill="url(#glow)" />
  <path d="M340 160 L348 142 L356 160 M348 142 L348 166" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round" fill="none" />
</svg>`;
fs.writeFileSync(path.join(publicDir, 'icon.svg'), svgContent);

console.log('Icons generated successfully in public/');
