import React from 'react';
import {
  FileCode,
  FileText,
  FileSpreadsheet,
  Settings,
  Terminal,
  FileCheck,
  Cpu,
  Layers,
  Folder,
  FolderOpen,
  Image,
  Binary,
  Code2,
} from 'lucide-react';

const BADGES: Record<string, [string, string]> = {
  '.go': ['GO', '#00add8'],
  '.java': ['JV', '#e76f00'],
  '.cs': ['C#', '#9b4f96'],
  '.rb': ['RB', '#cc342d'],
  '.php': ['PHP', '#8892bf'],
  '.lua': ['LUA', '#000080'],
  '.kt': ['KT', '#a97bff'],
  '.kts': ['KT', '#a97bff'],
  '.dart': ['DT', '#0175c2'],
  '.swift': ['SW', '#f05138'],
  '.sql': ['SQL', '#e38c00'],
  '.r': ['R', '#276dc3'],
  '.scala': ['SC', '#dc322f'],
  '.pl': ['PL', '#39457e'],
  '.bat': ['BAT', '#c1f12e'],
  '.jsx': ['JSX', '#61dafb'],
  '.vue': ['VUE', '#41b883'],
  '.graphql': ['GQL', '#e10098'],
  '.sol': ['SOL', '#aaaaaa'],
};

interface FileIconProps {
  filename: string;
  isFolder?: boolean;
  isOpen?: boolean;
  className?: string;
}

export const FileIcon: React.FC<FileIconProps> = ({
  filename,
  isFolder = false,
  isOpen = false,
  className = 'w-4 h-4',
}) => {
  if (isFolder) {
    if (isOpen) {
      return <FolderOpen className={`${className} text-[#58a6ff]`} />;
    }
    return <Folder className={`${className} text-[#58a6ff]/80`} />;
  }

  const lower = filename.toLowerCase();

  // Specific special filenames
  if (lower === 'dockerfile' || lower.startsWith('dockerfile.')) {
    return <span className={`${className} flex items-center justify-center text-sky-400 font-bold text-[10px]`}>🐳</span>;
  }
  if (lower.includes('docker-compose')) {
    return <span className={`${className} flex items-center justify-center text-blue-400 font-bold text-[10px]`}>🐙</span>;
  }
  if (lower === 'cmakelists.txt' || lower.endsWith('.cmake')) {
    return <span className={`${className} flex items-center justify-center text-emerald-400 font-bold text-[10px]`}>⚙️</span>;
  }
  if (lower === 'platformio.ini') {
    return <Settings className={`${className} text-amber-400`} />;
  }
  if (lower.startsWith('.git') || lower === '.gitignore' || lower === '.gitattributes') {
    return <span className={`${className} flex items-center justify-center text-orange-500 font-bold text-[10px]`}>⎇</span>;
  }

  // Extensions
  if (lower.endsWith('.cpp') || lower.endsWith('.hpp') || lower.endsWith('.cc')) {
    return <FileCode className={`${className} text-[#58a6ff]`} />;
  }
  if (lower.endsWith('.c')) {
    return <FileCode className={`${className} text-blue-300`} />;
  }
  if (lower.endsWith('.h')) {
    return <FileCode className={`${className} text-purple-400`} />;
  }
  if (lower.endsWith('.ino')) {
    return <span className={`${className} flex items-center justify-center text-teal-400 font-bold text-[10px]`}>♾️</span>;
  }
  if (lower.endsWith('.py')) {
    return <span className={`${className} flex items-center justify-center text-yellow-400 text-xs`}>🐍</span>;
  }
  if (lower.endsWith('.rs')) {
    return <span className={`${className} flex items-center justify-center text-orange-400 text-xs`}>🦀</span>;
  }
  if (lower.endsWith('.js') || lower.endsWith('.mjs')) {
    return <span className={`${className} flex items-center justify-center text-yellow-400 font-bold text-[10px]`}>JS</span>;
  }
  if (lower.endsWith('.ts') || lower.endsWith('.tsx')) {
    return <span className={`${className} flex items-center justify-center text-blue-400 font-bold text-[10px]`}>TS</span>;
  }
  if (lower.endsWith('.json')) {
    return <span className={`${className} flex items-center justify-center text-yellow-500 font-bold text-[10px]`}>{`{ }`}</span>;
  }
  if (lower.endsWith('.yaml') || lower.endsWith('.yml')) {
    return <Layers className={`${className} text-purple-400`} />;
  }
  if (lower.endsWith('.toml')) {
    return <Settings className={`${className} text-orange-300`} />;
  }
  if (lower.endsWith('.md') || lower.endsWith('.markdown')) {
    return <span className={`${className} flex items-center justify-center text-sky-300 font-bold text-[10px]`}>M↓</span>;
  }
  if (lower.endsWith('.html') || lower.endsWith('.htm')) {
    return <Code2 className={`${className} text-orange-500`} />;
  }
  if (lower.endsWith('.css') || lower.endsWith('.scss')) {
    return <FileCode className={`${className} text-blue-400`} />;
  }
  if (lower.endsWith('.xml')) {
    return <Code2 className={`${className} text-amber-500`} />;
  }
  if (lower.endsWith('.sh') || lower.endsWith('.bash')) {
    return <Terminal className={`${className} text-emerald-400`} />;
  }
  if (lower.endsWith('.ps1')) {
    return <Terminal className={`${className} text-sky-400`} />;
  }
  if (lower.endsWith('.pdf')) {
    return <span className={`${className} flex items-center justify-center text-red-500 font-bold text-[9px] bg-red-950/40 rounded`}>PDF</span>;
  }
  if (lower.endsWith('.csv')) {
    return <FileSpreadsheet className={`${className} text-emerald-400`} />;
  }
  if (lower.endsWith('.bin') || lower.endsWith('.hex') || lower.endsWith('.elf')) {
    return <Binary className={`${className} text-amber-400`} />;
  }
  if (lower.endsWith('.log')) {
    return <FileText className={`${className} text-slate-400`} />;
  }
  if (lower.endsWith('.svg') || lower.endsWith('.png') || lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.webp') || lower.endsWith('.gif')) {
    return <Image className={`${className} text-purple-400`} />;
  }
  if (lower.endsWith('.s') || lower.endsWith('.asm')) {
    return <Cpu className={`${className} text-rose-400`} />;
  }
  if (lower.endsWith('.txt')) {
    return <FileText className={`${className} text-[#8b949e]`} />;
  }

  // Short text badges for other common languages
  const badge = BADGES[lower.slice(lower.lastIndexOf('.'))];
  if (badge) {
    return (
      <span className={`${className} flex items-center justify-center font-bold text-[8px] leading-none`} style={{ color: badge[1] }}>
        {badge[0]}
      </span>
    );
  }

  return <FileCheck className={`${className} text-[#8b949e]`} />;
};
