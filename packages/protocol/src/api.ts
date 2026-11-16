import { Project, DeviceProfile, BuildResult, SyncResult } from '@esp-studio/shared-types';

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface CreateProjectRequest {
  name: string;
  templateId: 'esp32s3-arduino' | 'esp32s3-esp-idf';
  description?: string;
}

export interface BuildJobRequest {
  projectId: string;
  boardTarget: string;
  framework: string;
  clean?: boolean;
}

export interface RegisterDeviceRequest {
  deviceId: string;
  chipFamily: string;
  macAddress: string;
  firmwareVersion?: string;
}

export type ProjectResponse = ApiResponse<Project>;
export type DeviceResponse = ApiResponse<DeviceProfile>;
export type BuildResponse = ApiResponse<BuildResult>;
export type SyncResponse = ApiResponse<SyncResult>;
