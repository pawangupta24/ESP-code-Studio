import { BuildStatus, CompilerDiagnostic } from '@esp-studio/shared-types';

export interface BuildLogEvent {
  jobId: string;
  projectId: string;
  line: string;
  timestamp: number;
}

export interface BuildStatusEvent {
  jobId: string;
  projectId: string;
  status: BuildStatus;
  diagnostics: CompilerDiagnostic[];
  durationMs: number;
}

export interface RemoteSyncEvent {
  projectId: string;
  newRevisionId: string;
  author: string;
  timestamp: string;
}

export interface DeviceTelemetryEvent {
  deviceId: string;
  heapFree: number;
  uptimeMs: number;
  rssi?: number;
}
