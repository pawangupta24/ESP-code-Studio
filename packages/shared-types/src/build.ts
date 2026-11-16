export type BuildStatus = 'IDLE' | 'QUEUED' | 'COMPILING' | 'SUCCESS' | 'FAILED' | 'CANCELLED';

export interface CompilerDiagnostic {
  file: string;
  line: number;
  column: number;
  severity: 'error' | 'warning' | 'info';
  message: string;
}

export interface FlashSegment {
  name: string;
  offset: string;          // Hex string e.g. "0x10000"
  path: string;            // Name of artifact binary
  sizeBytes: number;
  sha256: string;
  data?: Uint8Array;       // Raw bytes when in-memory
}

export interface FlashManifest {
  manifestVersion: string;
  chipFamily: string;
  flashMode: 'qio' | 'qout' | 'dio' | 'dout';
  flashFreq: string;       // e.g. "80m"
  flashSize: string;       // e.g. "8MB"
  segments: FlashSegment[];
}

export interface FirmwareArtifact {
  buildId: string;
  projectId: string;
  manifest: FlashManifest;
  binaries: Record<string, Uint8Array>; // filename -> bytes
  buildInfo: {
    compilerVersion: string;
    timestamp: string;
    durationMs: number;
  };
}

export interface BuildResult {
  buildId: string;
  status: BuildStatus;
  diagnostics: CompilerDiagnostic[];
  artifact?: FirmwareArtifact;
  rawLog: string;
  durationMs: number;
}

export interface BuildOptions {
  clean?: boolean;
  verbose?: boolean;
  flags?: string[];
}
