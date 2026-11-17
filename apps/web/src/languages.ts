// Language detection and metadata. Monaco ships ~80 languages; once it has loaded we use
// its own registry so every one of them is detected and selectable. The small table
// below covers the moments before Monaco loads and adds names/templates for common ones.

interface MonacoLanguage {
  id: string;
  extensions?: string[];
  filenames?: string[];
  aliases?: string[];
}

const getMonacoLanguages = (): MonacoLanguage[] =>
  (typeof window !== 'undefined' && (window as any).monaco?.languages.getLanguages()) || [];

// Extensions Monaco does not know, or where embedded projects expect something else.
const EXTENSION_OVERRIDES: Record<string, string> = {
  '.ino': 'cpp',
  '.pde': 'cpp',
  '.h': 'cpp',
  '.cfg': 'ini',
  '.conf': 'ini',
  '.cmake': 'plaintext',
  '.S': 'mips',
};

const FALLBACK: Record<string, string> = {
  '.cpp': 'cpp', '.cc': 'cpp', '.hpp': 'cpp', '.c': 'c', '.py': 'python', '.rs': 'rust',
  '.js': 'javascript', '.mjs': 'javascript', '.ts': 'typescript', '.tsx': 'typescript',
  '.json': 'json', '.ini': 'ini', '.md': 'markdown', '.html': 'html', '.css': 'css',
  '.sh': 'shell', '.ps1': 'powershell', '.yaml': 'yaml', '.yml': 'yaml', '.xml': 'xml',
  '.go': 'go', '.java': 'java', '.cs': 'csharp', '.lua': 'lua', '.rb': 'ruby', '.php': 'php',
  '.sql': 'sql', '.kt': 'kotlin', '.swift': 'swift', '.dart': 'dart', '.toml': 'ini',
};

/** Language id for a file, honouring a user-picked override first. */
export function detectLanguage(path: string, override?: string): string {
  if (override) return override;
  const fileName = path.split('/').pop() || path;
  const base = fileName.toLowerCase();
  const dot = fileName.lastIndexOf('.');
  const rawExt = dot >= 0 ? fileName.slice(dot) : '';
  const ext = rawExt.toLowerCase();
  if (EXTENSION_OVERRIDES[rawExt]) return EXTENSION_OVERRIDES[rawExt];
  if (EXTENSION_OVERRIDES[ext]) return EXTENSION_OVERRIDES[ext];

  const langs = getMonacoLanguages();
  const byName = langs.find((l) => l.filenames?.some((f) => f.toLowerCase() === base));
  if (byName) return byName.id;
  const byExt = ext ? langs.find((l) => l.extensions?.some((e) => e.toLowerCase() === ext)) : undefined;
  if (byExt) return byExt.id;
  if (base === 'dockerfile') return 'dockerfile';
  return FALLBACK[ext] || 'plaintext';
}

const NAMES: Record<string, string> = {
  plaintext: 'Plain Text', cpp: 'C++', c: 'C', csharp: 'C#', fsharp: 'F#', javascript: 'JavaScript',
  typescript: 'TypeScript', python: 'Python', json: 'JSON', ini: 'Ini', html: 'HTML', css: 'CSS',
  scss: 'SCSS', less: 'Less', markdown: 'Markdown', shell: 'Shell Script', powershell: 'PowerShell',
  yaml: 'YAML', xml: 'XML', sql: 'SQL', mysql: 'MySQL', pgsql: 'PostgreSQL', go: 'Go', java: 'Java',
  rust: 'Rust', php: 'PHP', ruby: 'Ruby', lua: 'Lua', kotlin: 'Kotlin', swift: 'Swift', dart: 'Dart',
  dockerfile: 'Dockerfile', bat: 'Batch', 'objective-c': 'Objective-C', r: 'R', perl: 'Perl',
  scala: 'Scala', graphql: 'GraphQL', solidity: 'Solidity', mips: 'MIPS Assembly', systemverilog: 'SystemVerilog',
};

export function languageName(id: string): string {
  if (NAMES[id]) return NAMES[id];
  const alias = getMonacoLanguages().find((l) => l.id === id)?.aliases?.[0];
  return alias || id;
}

export interface LanguageChoice {
  id: string;
  name: string;
  extensions: string[];
}

/** Every language the editor can highlight, sorted by display name. */
export function allLanguages(): LanguageChoice[] {
  const langs = getMonacoLanguages();
  const list = langs.length
    ? langs.map((l) => ({ id: l.id, name: languageName(l.id), extensions: l.extensions || [] }))
    : Object.entries(FALLBACK).map(([ext, id]) => ({ id, name: languageName(id), extensions: [ext] }));
  const seen = new Set<string>();
  return list
    .filter((l) => {
      if (seen.has(l.id)) return false;
      seen.add(l.id);
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** Preferred file extension when creating a new file in a language. */
export function defaultExtension(id: string): string {
  const preferred: Record<string, string> = {
    cpp: '.cpp', c: '.c', python: '.py', javascript: '.js', typescript: '.ts',
    markdown: '.md', plaintext: '.txt', shell: '.sh', yaml: '.yaml',
  };
  return preferred[id] || allLanguages().find((l) => l.id === id)?.extensions[0] || '.txt';
}

/** Starter content for a new file. */
export const NEW_FILE_TEMPLATES: Record<string, string> = {
  cpp: '#include <Arduino.h>\n\nvoid setup() {\n  Serial.begin(115200);\n}\n\nvoid loop() {\n}\n',
  c: '#include <stdio.h>\n\nint main(void) {\n    return 0;\n}\n',
  python: 'def main():\n    print("Hello from Python")\n\n\nif __name__ == "__main__":\n    main()\n',
  javascript: "'use strict';\n\nfunction main() {\n  console.log('Hello');\n}\n\nmain();\n",
  typescript: 'export function main(): void {\n  console.log("Hello");\n}\n',
  rust: 'fn main() {\n    println!("Hello, world!");\n}\n',
  go: 'package main\n\nimport "fmt"\n\nfunc main() {\n\tfmt.Println("Hello, world!")\n}\n',
  java: 'public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello, world!");\n    }\n}\n',
  csharp: 'using System;\n\nclass Program\n{\n    static void Main()\n    {\n        Console.WriteLine("Hello, world!");\n    }\n}\n',
  html: '<!DOCTYPE html>\n<html lang="en">\n<head>\n  <meta charset="UTF-8">\n  <title>Document</title>\n</head>\n<body>\n\n</body>\n</html>\n',
  css: 'body {\n  margin: 0;\n}\n',
  json: '{\n  \n}\n',
  markdown: '# Title\n\n',
  shell: '#!/usr/bin/env bash\nset -euo pipefail\n\n',
  yaml: 'key: value\n',
  lua: 'local function main()\n  print("Hello")\nend\n\nmain()\n',
  php: '<?php\n\necho "Hello";\n',
  ruby: 'def main\n  puts "Hello"\nend\n\nmain\n',
  kotlin: 'fun main() {\n    println("Hello, world!")\n}\n',
  dart: "void main() {\n  print('Hello, world!');\n}\n",
  sql: 'SELECT 1;\n',
};
