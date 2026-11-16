export type SyncStatus = 'SYNCED' | 'PENDING' | 'CONFLICT' | 'OFFLINE';

export interface FileChangeRecord {
  path: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  sha256?: string;
  timestamp: number;
}

export interface FileConflict {
  path: string;
  baseHash?: string;
  localHash: string;
  remoteHash: string;
  baseContent?: string;
  localContent: string;
  remoteContent: string;
}

export interface SyncResult {
  status: SyncStatus;
  syncedFilesCount: number;
  conflicts: FileConflict[];
  remoteRevisionId?: string;
  timestamp: string;
}

export type ConflictChoice = 'KEEP_LOCAL' | 'KEEP_REMOTE' | 'MANUAL_MERGE';

export interface ConflictResolution {
  path: string;
  choice: ConflictChoice;
  resolvedContent?: string;
}
