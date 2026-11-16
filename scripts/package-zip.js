import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

const EXCLUDE_DIRS = new Set([
  'node_modules',
  '.git',
  'dist',
  'build',
  'target',
  '.pio',
  '.pnpm-store',
]);

const EXCLUDE_FILES = new Set([
  'esp-studio-starter.zip',
]);

function getCrc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function collectFiles(dir, baseDir = dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  let files = [];

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (!EXCLUDE_DIRS.has(entry.name)) {
        files = files.concat(collectFiles(fullPath, baseDir));
      }
    } else {
      if (!EXCLUDE_FILES.has(entry.name)) {
        files.push({ fullPath, relPath });
      }
    }
  }
  return files;
}

function packageZip(outputFile = 'esp-studio-starter.zip') {
  const rootDir = path.resolve('.');
  const outputPath = path.join(rootDir, outputFile);

  console.log('========================================================');
  console.log(' ESP Studio — Cross-Platform Starter Packager (Node.js)');
  console.log('========================================================');
  console.log(`Platform: ${process.platform} (${process.arch})`);
  console.log(`Source:   ${rootDir}`);
  console.log(`Output:   ${outputPath}`);

  const files = collectFiles(rootDir);
  console.log(`Found ${files.length} clean source files to archive.`);

  const localHeaders = [];
  const centralHeaders = [];
  let currentOffset = 0;

  for (const file of files) {
    const rawData = fs.readFileSync(file.fullPath);
    const nameBytes = Buffer.from(file.relPath, 'utf8');
    const crc = getCrc32(rawData);

    // Compress using raw deflate (standard PKZIP)
    const compressed = zlib.deflateRawSync(rawData);
    const useCompressed = compressed.length < rawData.length;
    const finalData = useCompressed ? compressed : rawData;
    const method = useCompressed ? 8 : 0; // 8 = Deflate, 0 = Store

    // 1. Local File Header
    const localHdr = Buffer.alloc(30 + nameBytes.length);
    localHdr.writeUInt32LE(0x04034b50, 0); // Signature
    localHdr.writeUInt16LE(20, 4);         // Version needed (2.0)
    localHdr.writeUInt16LE(0, 6);          // Flags
    localHdr.writeUInt16LE(method, 8);     // Method
    localHdr.writeUInt16LE(0x4a00, 10);    // Time (arbitrary static)
    localHdr.writeUInt16LE(0x56a6, 12);    // Date (arbitrary static)
    localHdr.writeUInt32LE(crc, 14);       // CRC32
    localHdr.writeUInt32LE(finalData.length, 18); // Compressed size
    localHdr.writeUInt32LE(rawData.length, 22);   // Uncompressed size
    localHdr.writeUInt16LE(nameBytes.length, 26); // Name length
    localHdr.writeUInt16LE(0, 28);         // Extra field length
    nameBytes.copy(localHdr, 30);

    // Save for central dir
    centralHeaders.push({
      relPath: file.relPath,
      nameBytes,
      method,
      crc,
      compSize: finalData.length,
      uncompSize: rawData.length,
      offset: currentOffset,
    });

    localHeaders.push(localHdr);
    localHeaders.push(finalData);
    currentOffset += localHdr.length + finalData.length;
  }

  // 2. Central Directory
  const centralDirStart = currentOffset;
  const centralParts = [];

  for (const c of centralHeaders) {
    const ch = Buffer.alloc(46 + c.nameBytes.length);
    ch.writeUInt32LE(0x02014b50, 0); // Central header signature
    ch.writeUInt16LE(20, 4);         // Version made by
    ch.writeUInt16LE(20, 6);         // Version needed
    ch.writeUInt16LE(0, 8);          // Flags
    ch.writeUInt16LE(c.method, 10);  // Method
    ch.writeUInt16LE(0x4a00, 12);    // Time
    ch.writeUInt16LE(0x56a6, 14);    // Date
    ch.writeUInt32LE(c.crc, 16);     // CRC32
    ch.writeUInt32LE(c.compSize, 20);// Comp size
    ch.writeUInt32LE(c.uncompSize, 24); // Uncomp size
    ch.writeUInt16LE(c.nameBytes.length, 28);
    ch.writeUInt16LE(0, 30);         // Extra len
    ch.writeUInt16LE(0, 32);         // Comment len
    ch.writeUInt16LE(0, 34);         // Disk start
    ch.writeUInt16LE(0, 36);         // Internal attr
    ch.writeUInt32LE(0, 38);         // External attr
    ch.writeUInt32LE(c.offset, 42);  // Offset
    c.nameBytes.copy(ch, 46);
    centralParts.push(ch);
  }

  const centralDirBuf = Buffer.concat(centralParts);
  const centralDirSize = centralDirBuf.length;

  // 3. End of Central Directory (EOCD)
  const eocd = Buffer.alloc(22);
  eocd.writeUInt32LE(0x06054b50, 0);     // Signature
  eocd.writeUInt16LE(0, 4);              // Disk num
  eocd.writeUInt16LE(0, 6);              // Disk where central dir starts
  eocd.writeUInt16LE(files.length, 8);   // Entries on this disk
  eocd.writeUInt16LE(files.length, 10);  // Total entries
  eocd.writeUInt32LE(centralDirSize, 12);// Central dir size
  eocd.writeUInt32LE(centralDirStart, 16); // Central dir offset
  eocd.writeUInt16LE(0, 20);             // Comment length

  // Write full archive
  const finalZip = Buffer.concat([...localHeaders, centralDirBuf, eocd]);
  fs.writeFileSync(outputPath, finalZip);

  const kb = (finalZip.length / 1024).toFixed(2);
  console.log(`[SUCCESS] Generated ${outputPath} (${kb} KB) cleanly on ${process.platform}!`);
}

packageZip();
