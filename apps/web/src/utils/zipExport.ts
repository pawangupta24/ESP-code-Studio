import { Project } from '@esp-studio/shared-types';

// Precomputed CRC32 lookup table
const CRC_TABLE = new Uint32Array(256);
for (let i = 0; i < 256; i++) {
  let c = i;
  for (let k = 0; k < 8; k++) {
    c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  }
  CRC_TABLE[i] = c >>> 0;
}

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ bytes[i]) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

/**
 * Generates and downloads a valid ZIP archive of all project files using pure TypeScript
 */
export function downloadProjectAsZip(project: Project): void {
  const encoder = new TextEncoder();
  const fileEntries = Object.entries(project.files);

  interface ZipItem {
    nameBytes: Uint8Array;
    contentBytes: Uint8Array;
    crc: number;
    offset: number;
  }

  const items: ZipItem[] = [];
  const localHeaderChunks: Uint8Array[] = [];
  let currentOffset = 0;

  // 1. Build Local File Headers and Data Chunks
  for (const [path, file] of fileEntries) {
    const nameBytes = encoder.encode(path);
    const contentBytes = encoder.encode(file.content);
    const crc = crc32(contentBytes);

    const localHeader = new Uint8Array(30 + nameBytes.length);
    const view = new DataView(localHeader.buffer);

    view.setUint32(0, 0x04034b50, true); // Local file header signature
    view.setUint16(4, 20, true);         // Version needed: 2.0
    view.setUint16(6, 0, true);          // General purpose bit flag
    view.setUint16(8, 0, true);          // Compression method: Stored (0)
    view.setUint16(10, 0x4821, true);    // Last mod file time
    view.setUint16(12, 0x589b, true);    // Last mod file date
    view.setUint32(14, crc, true);       // CRC-32
    view.setUint32(18, contentBytes.length, true); // Compressed size
    view.setUint32(22, contentBytes.length, true); // Uncompressed size
    view.setUint16(26, nameBytes.length, true);    // File name length
    view.setUint16(28, 0, true);                   // Extra field length

    localHeader.set(nameBytes, 30);

    items.push({
      nameBytes,
      contentBytes,
      crc,
      offset: currentOffset,
    });

    localHeaderChunks.push(localHeader);
    localHeaderChunks.push(contentBytes);
    currentOffset += localHeader.length + contentBytes.length;
  }

  // 2. Build Central Directory Headers
  const centralDirChunks: Uint8Array[] = [];
  const centralDirStartOffset = currentOffset;
  let centralDirSize = 0;

  for (const item of items) {
    const centralHeader = new Uint8Array(46 + item.nameBytes.length);
    const view = new DataView(centralHeader.buffer);

    view.setUint32(0, 0x02014b50, true); // Central directory file header signature
    view.setUint16(4, 20, true);         // Version made by: 2.0
    view.setUint16(6, 20, true);         // Version needed to extract: 2.0
    view.setUint16(8, 0, true);          // General purpose bit flag
    view.setUint16(10, 0, true);         // Compression method: Stored (0)
    view.setUint16(12, 0x4821, true);    // Last mod file time
    view.setUint16(14, 0x589b, true);    // Last mod file date
    view.setUint32(16, item.crc, true);  // CRC-32
    view.setUint32(20, item.contentBytes.length, true); // Compressed size
    view.setUint32(24, item.contentBytes.length, true); // Uncompressed size
    view.setUint16(28, item.nameBytes.length, true);    // File name length
    view.setUint16(30, 0, true);                        // Extra field length
    view.setUint16(32, 0, true);                        // File comment length
    view.setUint16(34, 0, true);                        // Disk number start
    view.setUint16(36, 0, true);                        // Internal file attributes
    view.setUint32(38, 0x81a40000, true);               // External file attributes (-rw-r--r--)
    view.setUint32(42, item.offset, true);              // Relative offset of local header

    centralHeader.set(item.nameBytes, 46);

    centralDirChunks.push(centralHeader);
    centralDirSize += centralHeader.length;
  }

  // 3. End of Central Directory Record (EOCD)
  const eocd = new Uint8Array(22);
  const eocdView = new DataView(eocd.buffer);

  eocdView.setUint32(0, 0x06054b50, true);       // End of central directory signature
  eocdView.setUint16(4, 0, true);                // Number of this disk
  eocdView.setUint16(6, 0, true);                // Disk where central directory starts
  eocdView.setUint16(8, items.length, true);     // Number of central directory records on this disk
  eocdView.setUint16(10, items.length, true);    // Total number of central directory records
  eocdView.setUint32(12, centralDirSize, true);  // Size of central directory
  eocdView.setUint32(16, centralDirStartOffset, true); // Offset of start of central directory
  eocdView.setUint16(20, 0, true);               // Comment length

  // Combine all chunks into a single Blob
  const allChunks: (Uint8Array | ArrayBuffer | string)[] = [...localHeaderChunks, ...centralDirChunks, eocd];
  const blob = new Blob(allChunks as BlobPart[], { type: 'application/zip' });

  // Trigger client-side browser download
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const sanitizedName = (project.metadata.name || 'esp32s3-project')
    .toLowerCase()
    .replace(/[^a-z0-9_-]/g, '-');
  a.href = url;
  a.download = `${sanitizedName}-esp-studio.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
