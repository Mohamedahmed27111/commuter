// Fix mojibake (double-encoded UTF-8 bytes misread as Windows-1252) across all source files.
// Algorithm: convert each character back to its CP1252 byte value, then re-decode as UTF-8.

const fs = require('fs');
const path = require('path');

// Reverse mapping: Unicode code point → CP1252 byte (for the 0x80–0x9F special range)
const cp1252RevSpecial = {
  0x20AC: 0x80, 0x201A: 0x82, 0x0192: 0x83, 0x201E: 0x84, 0x2026: 0x85,
  0x2020: 0x86, 0x2021: 0x87, 0x02C6: 0x88, 0x2030: 0x89, 0x0160: 0x8A,
  0x2039: 0x8B, 0x0152: 0x8C, 0x017D: 0x8E, 0x2018: 0x91, 0x2019: 0x92,
  0x201C: 0x93, 0x201D: 0x94, 0x2022: 0x95, 0x2013: 0x96, 0x2014: 0x97,
  0x02DC: 0x98, 0x2122: 0x99, 0x0161: 0x9A, 0x203A: 0x9B, 0x0153: 0x9C,
  0x017E: 0x9E, 0x0178: 0x9F,
};

function toCP1252Byte(code) {
  if (cp1252RevSpecial[code] !== undefined) return cp1252RevSpecial[code];
  if (code <= 0xFF) return code;                    // Latin-1 direct
  if (code >= 0x80 && code <= 0x9F) return code;   // C1 controls (undefined in CP1252, pass through as byte)
  return null;                                       // Cannot map to single byte → leave as-is
}

function fixMojibake(str) {
  // Try to convert each char to a byte. If ALL chars in a candidate window map to bytes
  // and the resulting byte sequence is valid UTF-8 that differs from the input, apply the fix.
  // We do this character-by-character, accumulating a byte buffer.
  const bytes = [];
  let i = 0;
  let changed = false;

  while (i < str.length) {
    const code = str.codePointAt(i);
    const step = code > 0xFFFF ? 2 : 1; // surrogate pair = 2 code units
    const byte = toCP1252Byte(code);

    if (byte !== null) {
      bytes.push(byte);
      if (code > 127) changed = true; // indicates possible mojibake
    } else {
      // Character can't map to a single CP1252 byte.
      // Flush what we have so far as UTF-8, then emit this char's UTF-8 bytes directly.
      if (bytes.length) {
        // Flush bytes as UTF-8
        const chunk = Buffer.from(bytes);
        try {
          const decoded = chunk.toString('utf8');
          // If decoding produced replacement chars, it's not valid UTF-8 — revert
          if (decoded.includes('\uFFFD')) {
            // Not valid UTF-8, emit as-is (Latin-1)
            for (const b of bytes) bytes_out_push(b);
          }
        } catch(e) {}
        bytes.length = 0;
      }
      // Emit the un-mappable char as its actual UTF-8
      const buf = Buffer.alloc(4);
      const len = buf.write(String.fromCodePoint(code), 'utf8');
      for (let k = 0; k < len; k++) bytes.push(buf[k]);
    }
    i += step;
  }

  if (!changed) return str; // Fast-path: no non-ASCII → nothing to fix

  // Try decoding the full byte buffer as UTF-8
  const full = Buffer.from(bytes);
  const decoded = full.toString('utf8');

  // If the result contains replacement chars, the decode failed — return original
  if (decoded.includes('\uFFFD')) return str;

  return decoded;
}

// Simpler and more reliable: just do the byte-by-byte encode→decode
function fix(str) {
  // Convert each character back to its CP1252 byte, build byte array, decode as UTF-8
  let hasMojibake = false;
  const arr = [];
  for (let i = 0; i < str.length; ) {
    const code = str.codePointAt(i);
    const step = code > 0xFFFF ? 2 : 1;

    if (code < 0x80) {
      arr.push(code);
    } else {
      const b = toCP1252Byte(code);
      if (b !== null) {
        arr.push(b);
        if (code > 0x7F) hasMojibake = true;
      } else {
        // Un-mappable (emoji > U+00FF not in CP1252): write its UTF-8 bytes
        const buf = Buffer.alloc(8);
        const len = buf.write(String.fromCodePoint(code), 'utf8');
        for (let k = 0; k < len; k++) arr.push(buf[k]);
      }
    }
    i += step;
  }
  if (!hasMojibake) return str;

  const decoded = Buffer.from(arr).toString('utf8');
  if (decoded.includes('\uFFFD')) {
    console.log('  ⚠ decode produced replacement chars, skipping');
    return str;
  }
  return decoded;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir)) {
    const p = path.join(dir, e);
    if (fs.statSync(p).isDirectory() && !e.startsWith('.') && e !== 'node_modules') walk(p, out);
    else if (/\.(tsx|ts|css|mjs)$/.test(p)) out.push(p);
  }
  return out;
}

const files = walk('src');
let fixedCount = 0;

for (const f of files) {
  const orig = fs.readFileSync(f, 'utf8');
  // Strip BOM if present
  const content = orig.startsWith('\uFEFF') ? orig.slice(1) : orig;
  const fixed = fix(content);

  if (fixed !== content) {
    fs.writeFileSync(f, fixed, 'utf8');
    console.log('Fixed: ' + f);
    fixedCount++;
  }
}

console.log('\nDone. Fixed ' + fixedCount + ' file(s).');