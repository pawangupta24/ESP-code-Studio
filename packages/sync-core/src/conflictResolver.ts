import { FileConflict, ConflictResolution } from '@esp-studio/shared-types';

export class ConflictResolver {
  public static resolve(conflict: FileConflict, resolution: ConflictResolution): string {
    switch (resolution.choice) {
      case 'KEEP_LOCAL':
        return conflict.localContent;
      case 'KEEP_REMOTE':
        return conflict.remoteContent;
      case 'MANUAL_MERGE':
        return resolution.resolvedContent ?? conflict.localContent;
      default:
        return conflict.localContent;
    }
  }

  /**
   * Generates a standard 3-way merge annotated representation for the UI.
   */
  public static formatDiffMarkers(conflict: FileConflict): string {
    return `<<<<<<< LOCAL (Offline Edit)
${conflict.localContent}
=======
${conflict.remoteContent}
>>>>>>> REMOTE (Cloud Revision)
`;
  }
}
