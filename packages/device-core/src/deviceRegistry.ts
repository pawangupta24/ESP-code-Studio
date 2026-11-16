import { DeviceProfile } from '@esp-studio/shared-types';

export class DeviceRegistry {
  private devices: Map<string, DeviceProfile> = new Map();

  constructor() {
    // Seed with the flagship design profile SPRAYER-001
    this.registerDevice({
      deviceId: 'SPRAYER-001',
      chipFamily: 'ESP32-S3',
      chipRevision: 0,
      macAddress: '84:F7:03:1A:2B:3C',
      flashSizeBytes: 8 * 1024 * 1024,
      firmwareVersion: '1.0.5',
      assignedProjectId: 'default-proj-1',
      lastConnectedAt: new Date().toISOString(),
    });
  }

  public registerDevice(profile: DeviceProfile): void {
    this.devices.set(profile.deviceId, profile);
  }

  public getDevice(deviceId: string): DeviceProfile | undefined {
    return this.devices.get(deviceId);
  }

  public listDevices(): DeviceProfile[] {
    return Array.from(this.devices.values());
  }

  public updateFirmwareVersion(deviceId: string, version: string): void {
    const dev = this.devices.get(deviceId);
    if (dev) {
      dev.firmwareVersion = version;
      dev.lastConnectedAt = new Date().toISOString();
    }
  }
}
