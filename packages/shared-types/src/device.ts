import { BoardFamily } from './project';

export interface DeviceProfile {
  deviceId: string;          // Provisioned UUID / name e.g. "SPRAYER-001"
  chipFamily: BoardFamily;   // e.g. "ESP32-S3"
  chipRevision?: number;
  macAddress: string;        // e.g. "84:F7:03:1A:2B:3C"
  flashSizeBytes?: number;   // e.g. 8388608 (8MB)
  firmwareVersion?: string;  // e.g. "1.0.5"
  assignedProjectId?: string;
  lastConnectedAt?: string;
}

export interface ConnectedPort {
  portId: string;
  usbVendorId?: number;
  usbProductId?: number;
  friendlyName?: string;
  serialNumber?: string;
  isOpen: boolean;
}
