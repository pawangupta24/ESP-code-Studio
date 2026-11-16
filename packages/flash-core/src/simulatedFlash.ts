import { FirmwareArtifact } from '@esp-studio/shared-types';
import { FlashProvider, FlashProgress, FlashOptions } from './provider';

export class SimulatedFlashProvider implements FlashProvider {
  private active: boolean = false;
  private progressListeners: Set<(p: FlashProgress) => void> = new Set();

  public async flash(artifact: FirmwareArtifact, _options?: FlashOptions): Promise<void> {
    if (this.active) throw new Error('Flashing session already in progress.');
    this.active = true;

    try {
      this.emitProgress(5, 'CONNECTING', 0, 350000, 'Connecting to ESP32-S3 ROM bootloader at 115200 baud...');
      await this.sleep(300);

      this.emitProgress(15, 'CONNECTING', 0, 350000, 'Handshake succeeded. Switching baud rate to 921600 baud...');
      await this.sleep(250);

      this.emitProgress(25, 'ERASING', 0, 350000, 'Erasing target flash blocks...');
      await this.sleep(400);

      this.emitProgress(40, 'WRITING_BOOTLOADER', 21856, 350000, 'Writing bootloader at offset 0x0000...');
      await this.sleep(300);

      this.emitProgress(55, 'WRITING_PARTITIONS', 24928, 350000, 'Writing partition table at offset 0x8000...');
      await this.sleep(300);

      this.emitProgress(80, 'WRITING_APP', 320000, 350000, `Writing application (${artifact.manifest.segments[2]?.sizeBytes || 324160} bytes) at offset 0x10000...`);
      await this.sleep(500);

      this.emitProgress(95, 'VERIFYING', 350000, 350000, 'Verifying MD5 / SHA-256 image checksums...');
      await this.sleep(300);

      this.emitProgress(100, 'FINISHED', 350000, 350000, 'Flash verified successfully! Hard resetting ESP32-S3 via RTS pin...');
    } finally {
      this.active = false;
    }
  }

  public async erase(_options?: FlashOptions): Promise<void> {
    this.active = true;
    try {
      this.emitProgress(50, 'ERASING', 0, 0, 'Performing chip full erase...');
      await this.sleep(1000);
      this.emitProgress(100, 'FINISHED', 0, 0, 'Chip erased.');
    } finally {
      this.active = false;
    }
  }

  public onProgress(handler: (p: FlashProgress) => void): () => void {
    this.progressListeners.add(handler);
    return () => this.progressListeners.delete(handler);
  }

  public isFlashing(): boolean {
    return this.active;
  }

  private emitProgress(percentage: number, stage: FlashProgress['stage'], bytesWritten: number, totalBytes: number, message: string): void {
    const p: FlashProgress = { percentage, stage, bytesWritten, totalBytes, message };
    this.progressListeners.forEach((fn) => fn(p));
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((r) => setTimeout(r, ms));
  }
}
