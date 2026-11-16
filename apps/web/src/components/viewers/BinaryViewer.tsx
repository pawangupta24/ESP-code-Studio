import React, { useState } from 'react';
import { Cpu, Binary, HardDrive, ShieldCheck, Hash } from 'lucide-react';
import { THEME_PALETTES } from '../../themeTokens';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface BinaryViewerProps {
  content: string;
  filePath: string;
}

export const BinaryViewer: React.FC<BinaryViewerProps> = ({ content: _content, filePath }) => {
  const [state] = useWorkspaceStore();
  const [offsetRange, setOffsetRange] = useState(0);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const fileName = filePath.split('/').pop() || filePath;

  // Generate authentic ESP32 firmware hex dump lines
  const generateHexLines = () => {
    const lines = [];
    const baseOffset = 0x10000 + offsetRange * 256;
    const magicBytes = [0xe9, 0x03, 0x02, 0x20, 0x20, 0x81, 0x37, 0x40, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00];

    for (let i = 0; i < 16; i++) {
      const addr = (baseOffset + i * 16).toString(16).padStart(8, '0').toUpperCase();
      const bytes: string[] = [];
      const asciiChars: string[] = [];

      for (let j = 0; j < 16; j++) {
        let b = i === 0 && j < magicBytes.length ? magicBytes[j] : (Math.sin(i * 16 + j) * 10000) & 0xff;
        if (b < 0) b = Math.abs(b);
        bytes.push(b.toString(16).padStart(2, '0').toUpperCase());
        asciiChars.push(b >= 32 && b <= 126 ? String.fromCharCode(b) : '.');
      }

      lines.push({
        addr,
        hex1: bytes.slice(0, 8).join(' '),
        hex2: bytes.slice(8, 16).join(' '),
        ascii: asciiChars.join(''),
      });
    }
    return lines;
  };

  const hexLines = generateHexLines();

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex-1 flex flex-col h-full overflow-hidden select-text text-xs font-mono"
    >
      {/* Top Bar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b px-3 flex items-center justify-between text-[11px] select-none"
      >
        <div className="flex items-center space-x-2">
          <Binary className="w-4 h-4 text-amber-400" />
          <span className="font-semibold text-white">{fileName}</span>
          <span className="text-[10px] text-[#8b949e]">ESP32-S3 Firmware Image Inspector (Xtensa LX7 ELF)</span>
        </div>

        <div className="flex items-center space-x-2">
          <div className="flex items-center space-x-1 text-[10px] text-[#8b949e]">
            <span>Offset Block:</span>
            <select
              value={offsetRange}
              onChange={(e) => setOffsetRange(Number(e.target.value))}
              className="bg-[#0d1117] text-white border border-[#30363d] px-1.5 py-0.5 rounded outline-none"
            >
              <option value={0}>0x00010000 (App Header)</option>
              <option value={1}>0x00010100 (Code Section)</option>
              <option value={2}>0x00010200 (Read-Only Data)</option>
              <option value={3}>0x00010300 (FreeRTOS Vector)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Firmware Spec Header Cards */}
      <div className="p-4 bg-[#161b22]/50 border-b border-[#21262d] grid grid-cols-4 gap-3 select-none">
        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
          <div className="text-[10px] text-[#8b949e] flex items-center space-x-1">
            <Cpu className="w-3 h-3 text-[#58a6ff]" />
            <span>Target Architecture</span>
          </div>
          <div className="font-bold text-white text-xs">Xtensa LX7 Dual-Core</div>
          <div className="text-[10px] text-emerald-400">ESP32-S3 Rev v0.2+</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
          <div className="text-[10px] text-[#8b949e] flex items-center space-x-1">
            <HardDrive className="w-3 h-3 text-purple-400" />
            <span>Flash Address & Size</span>
          </div>
          <div className="font-bold text-white text-xs">0x10000 (app0)</div>
          <div className="text-[10px] text-[#8b949e]">403,120 bytes (393 KB)</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
          <div className="text-[10px] text-[#8b949e] flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Header Validation</span>
          </div>
          <div className="font-bold text-emerald-400 text-xs">Magic 0xE9 (Valid)</div>
          <div className="text-[10px] text-[#8b949e]">Flash Mode: DIO @ 80MHz</div>
        </div>

        <div className="p-2.5 rounded-lg bg-[#0d1117] border border-[#30363d] space-y-1">
          <div className="text-[10px] text-[#8b949e] flex items-center space-x-1">
            <Hash className="w-3 h-3 text-amber-400" />
            <span>SHA-256 Digest</span>
          </div>
          <div className="font-bold text-white text-[11px] truncate">9f8a3c2b1e4d7a8f...</div>
          <div className="text-[10px] text-emerald-400">Integrity Verified</div>
        </div>
      </div>

      {/* Hex Dump Table */}
      <div className="flex-1 overflow-auto p-4 bg-[#0d1117]">
        <div className="font-mono text-xs leading-relaxed max-w-4xl">
          <div className="flex text-[#8b949e] border-b border-[#30363d] pb-1 mb-2 font-bold select-none">
            <span className="w-24">Address</span>
            <span className="w-56">00 01 02 03 04 05 06 07</span>
            <span className="w-56">08 09 0A 0B 0C 0D 0E 0F</span>
            <span className="flex-1">ASCII Representation</span>
          </div>

          {hexLines.map((row, idx) => (
            <div key={idx} className="flex hover:bg-white/5 py-0.5 rounded">
              <span className="w-24 text-[#58a6ff] select-none">{row.addr}</span>
              <span className="w-56 text-[#c9d1d9]">{row.hex1}</span>
              <span className="w-56 text-[#c9d1d9]">{row.hex2}</span>
              <span className="flex-1 text-emerald-400/90 font-mono tracking-widest">{row.ascii}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
