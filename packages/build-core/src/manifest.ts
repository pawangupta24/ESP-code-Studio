import { FlashManifest } from '@esp-studio/shared-types';

export function createStandardEsp32s3Manifest(appSizeBytes: number, appSha256: string): FlashManifest {
  return {
    manifestVersion: '1.0',
    chipFamily: 'ESP32-S3',
    flashMode: 'qio',
    flashFreq: '80m',
    flashSize: '8MB',
    segments: [
      {
        name: 'bootloader',
        offset: '0x0000',
        path: 'bootloader.bin',
        sizeBytes: 21856,
        sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      },
      {
        name: 'partitions',
        offset: '0x8000',
        path: 'partitions.bin',
        sizeBytes: 3072,
        sha256: '5d41402abc4b2a76b9719d911017c592',
      },
      {
        name: 'application',
        offset: '0x10000',
        path: 'firmware.bin',
        sizeBytes: appSizeBytes,
        sha256: appSha256,
      },
    ],
  };
}
