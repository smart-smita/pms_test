const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Generates a valid raw PNG file in pure Node without external dependencies
function createPNG(width, height, colorFn) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = colorFn(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Header
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr.writeUInt8(8, 8); // bit depth
  ihdr.writeUInt8(6, 9); // color type 6 = RGBA
  ihdr.writeUInt8(0, 10); // compression
  ihdr.writeUInt8(0, 11); // filter
  ihdr.writeUInt8(0, 12); // interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressed);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function crc32(buf) {
  let table = [];
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      if (c & 1) c = 0xedb88320 ^ (c >>> 1);
      else c = c >>> 1;
    }
    table[n] = c;
  }
  let c = 0 ^ (-1);
  for (let i = 0; i < buf.length; i++) {
    c = table[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ (-1)) >>> 0;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);

  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  const crcData = Buffer.concat([typeBuf, data]);
  crcBuf.writeUInt32BE(crc32(crcData), 0);

  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

// Icon design function
function pmsIconColor(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);
  const radius = w * 0.44;

  // Background rounded rect / circle
  const normX = (x / w) * 2 - 1;
  const normY = (y / h) * 2 - 1;
  const cornerDist = Math.pow(Math.abs(normX), 4) + Math.pow(Math.abs(normY), 4);

  if (cornerDist > 1.0) {
    return [0, 0, 0, 0]; // Transparent outside squircle
  }

  // Gradient: Indigo to Violet (#4F46E5 -> #7C3AED -> #0F172A)
  const t = y / h;
  let bgR = Math.round(79 * (1 - t) + 15 * t);
  let bgG = Math.round(70 * (1 - t) + 23 * t);
  let bgB = Math.round(229 * (1 - t) + 42 * t);

  // Draw Pin / Central Emblem
  // Head of pin (circle at cx, cy - h*0.08, r = w*0.22)
  const pinHeadCy = cy - h * 0.08;
  const distPinHead = Math.sqrt(dx * dx + (y - pinHeadCy) * (y - pinHeadCy));
  const pinHeadR = w * 0.22;

  // Pin Point (triangle from head to cy + h*0.22)
  const pinPointY = cy + h * 0.24;
  const inPinCone = y >= pinHeadCy && y <= pinPointY && Math.abs(dx) <= (1 - (y - pinHeadCy) / (pinPointY - pinHeadCy)) * pinHeadR;

  if (distPinHead <= pinHeadR || inPinCone) {
    // Inner hole of pin
    const innerHoleR = pinHeadR * 0.45;
    const distInnerHole = Math.sqrt(dx * dx + (y - pinHeadCy) * (y - pinHeadCy));

    if (distInnerHole <= innerHoleR) {
      // Inner circle background: deep indigo
      return [30, 27, 75, 255];
    }

    // Pin body: Crisp White with slight gradient
    return [245, 247, 255, 255];
  }

  // Draw checkmark badge in lower right
  const badgeCx = cx + w * 0.22;
  const badgeCy = cy + h * 0.20;
  const distBadge = Math.sqrt((x - badgeCx) * (x - badgeCx) + (y - badgeCy) * (y - badgeCy));
  const badgeR = w * 0.16;

  if (distBadge <= badgeR) {
    // Emerald green ring / fill (#10B981)
    if (distBadge <= badgeR * 0.85) {
      return [16, 185, 129, 255];
    }
    return [255, 255, 255, 255];
  }

  return [bgR, bgG, bgB, 255];
}

const targetDir = path.resolve(__dirname, '../frontend/public');
if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

// Generate PNG sizes
const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 },
  { name: 'apple-touch-icon-180x180.png', size: 180 },
  { name: 'maskable-icon-512x512.png', size: 512 },
];

sizes.forEach(({ name, size }) => {
  const buf = createPNG(size, size, pmsIconColor);
  fs.writeFileSync(path.join(targetDir, name), buf);
  console.log(`Generated ${name} (${size}x${size})`);
});
