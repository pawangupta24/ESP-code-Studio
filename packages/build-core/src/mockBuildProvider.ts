import { Project, BuildResult, BuildOptions } from '@esp-studio/shared-types';
import { BuildProvider } from './provider';
import { createStandardEsp32s3Manifest } from './manifest';

export class SimulatedBuildProvider implements BuildProvider {
  public name: 'simulated' = 'simulated';
  private logListeners: Set<(line: string) => void> = new Set();
  private _isCancelled: boolean = false;

  public isBuildCancelled(): boolean {
    return this._isCancelled;
  }

  public async build(project: Project, _options?: BuildOptions): Promise<BuildResult> {
    this._isCancelled = false;
    const startTime = Date.now();
    const buildId = `build-${Math.random().toString(36).substring(2, 9)}`;

    this.emitLog(`[ESP Studio Build Engine] Initializing build for project: ${project.metadata.name}`);
    this.emitLog(`[Target] Board: ${project.metadata.boardTarget} | Framework: ${project.metadata.framework}`);
    this.emitLog(`[Toolchain] Pinned PlatformIO Core 6.1.15 | platform-espressif32 @ 6.7.0`);
    
    await this.delay(400);
    this.emitLog(`Processing ${project.metadata.boardTarget} (platform: espressif32; board: esp32-s3-devkitc-1; framework: arduino)`);
    this.emitLog(`CONFIGURATION: https://docs.platformio.org/page/boards/espressif32/esp32-s3-devkitc-1.html`);
    this.emitLog(`PLATFORM: Espressif 32 (6.7.0) > Espressif ESP32-S3-DevKitC-1-N8 (8 MB QD, No PSRAM)`);
    this.emitLog(`HARDWARE: ESP32S3 240MHz, 320KB RAM, 8MB Flash`);

    await this.delay(500);
    this.emitLog(`Compiling .pio/build/esp32-s3-devkitc-1/src/main.cpp.o`);
    this.emitLog(`Linking .pio/build/esp32-s3-devkitc-1/firmware.elf`);
    this.emitLog(`Building .pio/build/esp32-s3-devkitc-1/firmware.bin`);
    this.emitLog(`esptool.py v4.7.0`);
    this.emitLog(`Creating esp32s3 image...`);
    this.emitLog(`Merged 3 ELF sections`);
    this.emitLog(`Successfully created esp32s3 image.`);

    await this.delay(300);
    const durationMs = Date.now() - startTime;
    this.emitLog(`RAM:   [=         ]  11.4% (used 37496 bytes from 327680 bytes)`);
    this.emitLog(`Flash: [==        ]  16.8% (used 324160 bytes from 1925120 bytes)`);
    this.emitLog(`========================= [SUCCESS] Took ${durationMs}ms =========================`);

    const manifest = createStandardEsp32s3Manifest(324160, 'mock-sha-esp32s3-app');

    return {
      buildId,
      status: 'SUCCESS',
      diagnostics: [],
      rawLog: 'Build finished successfully',
      durationMs,
      artifact: {
        buildId,
        projectId: project.metadata.id,
        manifest,
        binaries: {
          'firmware.bin': new Uint8Array([0xe9, 0x03, 0x02, 0x20]),
          'bootloader.bin': new Uint8Array([0xe9, 0x01, 0x02, 0x20]),
          'partitions.bin': new Uint8Array([0xaa, 0x50, 0x01, 0x02]),
        },
        buildInfo: {
          compilerVersion: 'gcc-12.2.0-esp32s3',
          timestamp: new Date().toISOString(),
          durationMs,
        },
      },
    };
  }

  public async cancel(_jobId: string): Promise<void> {
    this._isCancelled = true;
    this.emitLog('[BUILD CANCELLED BY USER]');
  }

  public onLog(handler: (line: string) => void): () => void {
    this.logListeners.add(handler);
    return () => this.logListeners.delete(handler);
  }

  private emitLog(line: string): void {
    this.logListeners.forEach((fn) => fn(line));
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
