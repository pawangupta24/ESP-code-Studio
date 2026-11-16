import React, { useState } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, ChevronLeft, ChevronRight, Search, FileText } from 'lucide-react';
import { THEME_PALETTES } from '../../themeTokens';
import { useWorkspaceStore } from '../../stores/useWorkspaceStore';

interface PdfViewerProps {
  filePath: string;
}

export const PdfViewer: React.FC<PdfViewerProps> = ({ filePath }) => {
  const [state] = useWorkspaceStore();
  const [zoom, setZoom] = useState(100);
  const [page, setPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const palette = THEME_PALETTES[state.theme] || THEME_PALETTES['github-dark'];
  const totalPages = 8;

  const fileName = filePath.split('/').pop() || filePath;

  return (
    <div
      style={{ backgroundColor: '#1a1d24', color: '#c9d1d9' }}
      className="flex-1 flex flex-col h-full overflow-hidden select-none font-mono text-xs"
    >
      {/* Top PDF Toolbar */}
      <div
        style={{ backgroundColor: palette.bgSidebar, borderColor: palette.border }}
        className="h-9 border-b px-3 flex items-center justify-between text-[11px]"
      >
        <div className="flex items-center space-x-2">
          <FileText className="w-4 h-4 text-rose-500" />
          <span className="font-semibold text-white">{fileName}</span>
          <span className="text-[10px] text-[#8b949e]">ESP32-S3 Technical Reference</span>
        </div>

        {/* Page navigation controls */}
        <div className="flex items-center space-x-1 bg-[#0d1117] px-2 py-0.5 rounded border border-[#30363d]">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="p-1 hover:text-white disabled:opacity-40"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-[11px] px-1 font-semibold text-white">
            Page {page} / {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="p-1 hover:text-white disabled:opacity-40"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom & Search Controls */}
        <div className="flex items-center space-x-2">
          {showSearch ? (
            <div className="flex items-center space-x-1 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Find in PDF..."
                className="bg-transparent text-white text-[10px] outline-none w-24"
              />
              <button onClick={() => setShowSearch(false)} className="text-[#8b949e] hover:text-white text-xs">
                ✕
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowSearch(true)}
              className="p-1 rounded hover:bg-[#21262d] text-[#8b949e] hover:text-white"
              title="Search in PDF"
            >
              <Search className="w-3.5 h-3.5" />
            </button>
          )}

          <div className="flex items-center space-x-1 bg-[#0d1117] border border-[#30363d] rounded px-1.5 py-0.5">
            <button onClick={() => setZoom((z) => Math.max(50, z - 15))} className="hover:text-white p-0.5">
              <ZoomOut className="w-3 h-3" />
            </button>
            <span className="text-[10px] px-1 text-white">{zoom}%</span>
            <button onClick={() => setZoom((z) => Math.min(200, z + 15))} className="hover:text-white p-0.5">
              <ZoomIn className="w-3 h-3" />
            </button>
            <button onClick={() => setZoom(100)} className="hover:text-white p-0.5" title="Fit to Page">
              <RotateCcw className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* PDF Document Canvas View */}
      <div className="flex-1 overflow-auto p-6 flex justify-center bg-[#252830]">
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top center',
            transition: 'transform 0.15s ease',
          }}
          className="w-[620px] min-h-[820px] bg-white text-slate-900 rounded-sm shadow-2xl p-10 flex flex-col justify-between font-sans select-text"
        >
          {/* Document Header */}
          <div className="border-b-2 border-red-600 pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded bg-red-600 text-white font-bold flex items-center justify-center text-sm">
                  ES
                </div>
                <div>
                  <h1 className="text-base font-bold text-slate-900">ESPRESSIF SYSTEMS</h1>
                  <p className="text-[10px] text-slate-500">ESP32-S3 Series Hardware Datasheet</p>
                </div>
              </div>
              <span className="text-[10px] font-mono text-slate-400">DOC-ESP32S3-v2.1</span>
            </div>
          </div>

          {/* Document Body Page */}
          <div className="flex-1 py-6 space-y-4 text-xs leading-relaxed text-slate-800">
            <h2 className="text-sm font-bold text-slate-900 border-b border-slate-200 pb-1">
              Section {page}.0: System Architecture & LX7 Dual-Core Overview
            </h2>

            <p>
              The <strong>ESP32-S3</strong> is a dual-core XTENSA LX7 microcontroller designed for high-performance AI
              acceleration and IoT sensing. Operating at clock frequencies up to 240 MHz, it features 512 KB of internal
              SRAM and supports external octal SPI flash and PSRAM.
            </p>

            <div className="bg-slate-50 border border-slate-200 rounded p-3 space-y-2 text-[11px]">
              <div className="font-bold text-slate-700">Key Electrical & Pin Specifications:</div>
              <ul className="list-disc ml-5 space-y-1 text-slate-600">
                <li>Core 0: Primary RTOS and RF WiFi / Bluetooth LE communications stack.</li>
                <li>Core 1: Dedicated application logic, sensor DSP, and telemetry loops.</li>
                <li>GPIO 48: High-speed RMT channel assigned to onboard RGB WS2812 status LED.</li>
                <li>Operating Voltage: 3.0V to 3.6V (Typical: 3.3V).</li>
              </ul>
            </div>

            <div className="p-3 bg-red-50 border-l-4 border-red-600 rounded text-[11px] text-red-900">
              <strong>Strapping Pin Warning:</strong> GPIO 0, GPIO 45, and GPIO 46 govern chip boot modes and voltage
              rail select. Avoid external pull-ups that interfere with flash voltage configuration during boot.
            </div>
          </div>

          {/* Document Footer */}
          <div className="border-t border-slate-200 pt-3 flex items-center justify-between text-[10px] text-slate-400">
            <span>© 2026 Espressif Systems Co., Ltd. All rights reserved.</span>
            <span>Page {page} of {totalPages}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
