import { Project, BuildResult, BuildOptions } from '@esp-studio/shared-types';

export interface BuildProvider {
  name: 'cloud' | 'local' | 'simulated';
  build(project: Project, options?: BuildOptions): Promise<BuildResult>;
  cancel(jobId: string): Promise<void>;
  onLog(handler: (line: string) => void): () => void;
}
