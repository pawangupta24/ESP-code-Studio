import { Project, SyncResult } from '@esp-studio/shared-types';
import { computeSha256 } from './hasher';

export interface SyncEngineOptions {
  online?: boolean;
}

export class SyncEngine {
  private isOnline: boolean = true;

  constructor(options?: SyncEngineOptions) {
    if (options?.online !== undefined) {
      this.isOnline = options.online;
    }
  }

  public setOnline(status: boolean): void {
    this.isOnline = status;
  }

  public async sync(project: Project): Promise<SyncResult> {
    if (!this.isOnline) {
      return {
        status: 'OFFLINE',
        syncedFilesCount: 0,
        conflicts: [],
        timestamp: new Date().toISOString(),
      };
    }

    const files = Object.values(project.files);
    let count = 0;

    for (const f of files) {
      f.sha256 = await computeSha256(f.content);
      count++;
    }

    return {
      status: 'SYNCED',
      syncedFilesCount: count,
      conflicts: [],
      remoteRevisionId: `rev-${Date.now().toString(36)}`,
      timestamp: new Date().toISOString(),
    };
  }
}
