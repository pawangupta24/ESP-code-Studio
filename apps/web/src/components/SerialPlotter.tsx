import React, { useRef, useEffect, useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Play, Pause, Trash2, Activity } from 'lucide-react';

export const SerialPlotter: React.FC = () => {
  const [state, actions] = useWorkspaceStore();
  const [isPaused, setIsPaused] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const data = state.telemetryData;

  useEffect(() => {
    if (isPaused) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Handle high-DPI displays
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    canvas.width = width * window.devicePixelRatio;
    canvas.height = height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    // Clear background
    ctx.fillStyle = '#090d12';
    ctx.fillRect(0, 0, width, height);

    // Draw grid lines
    ctx.strokeStyle = '#1e2633';
    ctx.lineWidth = 1;
    for (let x = 0; x < width; x += 60) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    for (let y = 0; y < height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    if (data.length < 2) {
      ctx.fillStyle = '#484f58';
      ctx.font = '12px "JetBrains Mono", monospace';
      ctx.fillText('Waiting for serial telemetry data streams...', 20, height / 2);
      return;
    }

    // Channels to plot
    const channels = [
      { key: 'Heap', color: '#58a6ff', label: 'Free Heap (KB)', min: 250, max: 320 },
      { key: 'Pressure', color: '#2ea043', label: 'Tank Pressure (bar)', min: 1.5, max: 3.5 },
    ];

    channels.forEach((ch) => {
      ctx.strokeStyle = ch.color;
      ctx.lineWidth = 2;
      ctx.beginPath();

      const stepX = width / Math.max(data.length - 1, 10);

      data.forEach((pt, idx) => {
        const val = Number(pt[ch.key] || 0);
        // Normalize val to height
        const normalized = (val - ch.min) / (ch.max - ch.min);
        const clamped = Math.max(0, Math.min(1, normalized));
        const y = height - clamped * (height - 30) - 15;
        const x = idx * stepX;

        if (idx === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      });
      ctx.stroke();
    });
  }, [data, isPaused]);

  const latest = data[data.length - 1] || {};

  return (
    <div className="flex-1 flex flex-col h-full bg-[#090d12] overflow-hidden select-none font-mono text-xs">
      {/* Plotter Header / Legend */}
      <div className="h-10 bg-[#161b22] border-b border-[#30363d] px-4 flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-1.5 font-semibold text-[#c9d1d9]">
            <Activity className="w-4 h-4 text-[#58a6ff]" />
            <span>ESP32-S3 Waveform Plotter</span>
          </div>

          {/* Dynamic Legends */}
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#58a6ff]"></span>
              <span className="text-[#8b949e]">Heap:</span>
              <span className="text-[#58a6ff] font-bold">{latest.Heap ?? '--'} KB</span>
            </div>
            <div className="flex items-center space-x-1.5 text-[11px]">
              <span className="w-2.5 h-2.5 rounded-sm bg-[#2ea043]"></span>
              <span className="text-[#8b949e]">Pressure:</span>
              <span className="text-[#2ea043] font-bold">{latest.Pressure ?? '--'} bar</span>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPaused(!isPaused)}
            className={`flex items-center space-x-1 px-2.5 py-1 rounded border text-[11px] ${
              isPaused
                ? 'bg-amber-950 text-amber-400 border-amber-800'
                : 'bg-[#21262d] text-[#c9d1d9] border-[#30363d] hover:bg-[#30363d]'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume' : 'Pause'}</span>
          </button>
          <button
            onClick={actions.clearSerialLogs}
            className="flex items-center space-x-1 px-2.5 py-1 rounded bg-[#21262d] text-[#8b949e] hover:text-white border border-[#30363d] text-[11px]"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Canvas Area */}
      <div className="flex-1 relative p-2">
        <canvas ref={canvasRef} className="w-full h-full block rounded bg-[#090d12]" />
      </div>
    </div>
  );
};
