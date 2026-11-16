import { Project, ProjectFile } from '@esp-studio/shared-types';
import { ESP32S3_ARDUINO_TEMPLATE } from './templates';

export class ProjectManager {
  private currentProject: Project;

  constructor(initialProject?: Project) {
    this.currentProject = initialProject || ESP32S3_ARDUINO_TEMPLATE('default-proj-1', 'esp32s3-blink-demo');
  }

  public getProject(): Project {
    return this.currentProject;
  }

  public setFile(path: string, content: string): void {
    this.currentProject.files[path] = {
      path,
      content,
      lastModified: Date.now(),
    };
    this.currentProject.metadata.updatedAt = new Date().toISOString();
  }

  public deleteFile(path: string): void {
    delete this.currentProject.files[path];
    this.currentProject.metadata.updatedAt = new Date().toISOString();
  }

  public getFile(path: string): ProjectFile | undefined {
    return this.currentProject.files[path];
  }

  public listFiles(): string[] {
    return Object.keys(this.currentProject.files).sort();
  }
}
