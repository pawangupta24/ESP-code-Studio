import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Image as ImageIcon, CheckSquare, Square } from 'lucide-react';
import { THEME_PALETTES } from '../../themeTokens';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface ImagePreviewProps {
  content: string;
  filePath: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({ content, filePath }) => {
  const [state] = useWorkspaceStore();
  const [zoom, setZoom] = useState(100);
  const [showCheckerboard, setShowCheckerboard] = useState(true);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];

  const fileName = filePath.split('/').pop() || filePath;
  const isSvg = filePath.toLowerCase().endsWith('.svg');

  return (
    <div
      style={{ backgroundColor: palette.bgMain, color: palette.text }}
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-mono text-xs"
    >
      {/* Top Bar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b px-3 flex items-center justify-between text-[11px]"
      >
        <div className="flex items-center space-x-2">
          <ImageIcon className="w-4 h-4 text-purple-400" />
          <span className="font-semibold text-white">{fileName}</span>
          <span className="text-[10px] text-[#8b949e]">Vector Graphic / Image</span>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setShowCheckerboard(!showCheckerboard)}
            className="flex items-center space-x-1 px-2 py-0.5 rounded bg-[#0d1117] border border-[#30363d] text-[#8b949e] hover:text-white text-[10px]"
          >
            {showCheckerboard ? <CheckSquare className="w-3 h-3 text-[#58a6ff]" /> : <Square className="w-3 h-3" />}
            <span>Checkerboard</span>
          </button>

          <div className="flex items-center space-x-1 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5">
            <button onClick={() => setZoom((z) => Math.max(25, z - 25))} className="hover:text-white p-0.5">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 text-white">{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(300, z + 25))} className="hover:text-white p-0.5">
              <ZoomIn className="w-3 h-3" />
            </button>
            <button onClick={() => setZoom(100)} className="hover:text-white p-0.5" title="Reset Zoom">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Image Canvas Container */}
      <div
        className={`flex-1 overflow-auto p-8 flex items-center justify-center ${
          showCheckerboard
            ? 'bg-[radial-gradient(#30363d_1px,transparent_1px)] [background-size:16px_16px] bg-[#090d12]'
            : 'bg-[#090d12]'
        }`}
      >
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transition: 'transform 0.15s ease',
          }}
          className="max-w-2xl max-h-[500px] border border-[#30363d] rounded-xl shadow-2xl p-4 bg-[#0d1117] flex items-center justify-center"
        >
          {isSvg ? (
            <div dangerouslySetInnerHTML={{ __html: content }} className="w-full h-full flex items-center justify-center" />
          ) : (
            <div className="text-center p-8 text-[#8b949e]">
              <ImageIcon className="w-12 h-12 mx-auto mb-2 text-purple-400" />
              <p>Image preview for {fileName}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
