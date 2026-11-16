import { Project } from '@esp-studio/shared-types';

export interface ValidationIssue {
  type: 'error' | 'warning';
  message: string;
  path?: string;
}

export function validateProject(project: Project): ValidationIssue[] {
  const issues: ValidationIssue[] = [];

  if (!project.metadata.name || project.metadata.name.trim().length === 0) {
    issues.push({ type: 'error', message: 'Project name cannot be empty.' });
  }

  if (!project.metadata.id) {
    issues.push({ type: 'error', message: 'Project must contain a unique UUID.' });
  }

  // Validate critical files
  const fileKeys = Object.keys(project.files);
  if (!fileKeys.some((f) => f.startsWith('src/'))) {
    issues.push({
      type: 'warning',
      message: 'No source files found under "src/" directory.',
    });
  }

  // Check path traversal attempts
  for (const path of fileKeys) {
    if (path.includes('..') || path.startsWith('/') || path.startsWith('\\')) {
      issues.push({
        type: 'error',
        message: `Security violation: Invalid or traversing file path: ${path}`,
        path,
      });
    }
  }

  return issues;
}
