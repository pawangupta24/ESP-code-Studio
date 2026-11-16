export type BoardFamily = 'ESP32' | 'ESP32-S2' | 'ESP32-S3' | 'ESP32-C3' | 'ESP32-C6' | 'STM32';

export type Framework = 'arduino' | 'espidf';

export interface ProjectFile {
  path: string;            // Relative to project root e.g. "src/main.cpp"
  content: string;         // UTF-8 string content
  sha256?: string;
  isBinary?: boolean;
  lastModified?: number;
}

export interface ProjectMetadata {
  id: string;              // Permanent UUID
  name: string;
  description?: string;
  boardTarget: string;     // e.g. "esp32-s3-devkitc-1"
  boardFamily: BoardFamily;
  framework: Framework;
  createdAt: string;
  updatedAt: string;
  currentRevisionId?: string;
}

export interface Project {
  metadata: ProjectMetadata;
  files: Record<string, ProjectFile>; // key is normalized file path
}
