import { FirmwareArtifact } from '@esp-studio/shared-types';

export interface FlashProgress {
  percentage: number;
  stage: 'CONNECTING' | 'ERASING' | 'WRITING_BOOTLOADER' | 'WRITING_PARTITIONS' | 'WRITING_APP' | 'VERIFYING' | 'FINISHED' | 'FAILED';
  bytesWritten: number;
  totalBytes: number;
  message: string;
}

export interface FlashOptions {
  baudRate?: number;
  eraseAll?: boolean;
}

export interface FlashProvider {
  flash(artifact: FirmwareArtifact, options?: FlashOptions): Promise<void>;
  erase(options?: FlashOptions): Promise<void>;
  onProgress(handler: (progress: FlashProgress) => void): () => void;
  isFlashing(): boolean;
}
