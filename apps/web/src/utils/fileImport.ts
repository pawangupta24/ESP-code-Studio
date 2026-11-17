// Reading files from the user's disk (File > Open, drag & drop) into the workspace.

const SKIP_DIRS = /(^|\/)(node_modules|\.git|\.pio|build|dist|target|__pycache__)\//;
const BINARY_EXT = /\.(png|jpe?g|gif|webp|ico|pdf|zip|gz|7z|bin|elf|exe|dll|so|o|a|woff2?|ttf|mp[34]|wav)$/i;
const MAX_FILE_BYTES = 2 * 1024 * 1024;

export interface ImportResult {
  files: Record<string, string>;
  skipped: number;
}

/**
 * Read text files. `pathOf` maps each File to its workspace path; build folders, binary
 * files and files over 2 MB are skipped (the editor stores text only).
 */
export async function readTextFiles(list: Iterable<File>, pathOf: (f: File) => string): Promise<ImportResult> {
  const files: Record<string, string> = {};
  let skipped = 0;
  for (const f of list) {
    const path = pathOf(f).replace(/\\/g, '/').replace(/^\/+/, '');
    if (!path || SKIP_DIRS.test(path) || BINARY_EXT.test(path) || f.size > MAX_FILE_BYTES) {
      skipped++;
      continue;
    }
    files[path] = await f.text();
  }
  return { files, skipped };
}

/** True when a drag event carries files from the OS (not an internal drag). */
export function isFileDrag(e: { dataTransfer: DataTransfer | null }): boolean {
  return !!e.dataTransfer && Array.from(e.dataTransfer.types).includes('Files');
}
