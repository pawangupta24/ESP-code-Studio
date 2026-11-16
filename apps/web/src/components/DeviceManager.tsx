import React, { useState } from 'react';
import { useWorkspaceStore } from '../stores/useWorkspaceStore';
import { Cpu, HardDrive, ShieldCheck, Key, CheckCircle2, Zap } from 'lucide-react';

export const DeviceManager: React.FC = () => {
  const [state] = useWorkspaceStore();
  const [customId, setCustomId] = useState(state.activeDevice.deviceId);
  const [isProvisioned, setIsProvisioned] = useState(false);

  const partitionTable = [
    { name: 'bootloader', offset: '0x000000', size: '21.3 KB', type: 'system', desc: 'ESP32-S3 ROM 2nd Stage Bootloader' },
    { name: 'partitions', offset: '0x008000', size: '3.0 KB', type: 'system', desc: 'Partition Table Definition' },
    { name: 'nvs', offset: '0x009000', size: '20.0 KB', type: 'data', desc: 'Non-Volatile Storage (Device Identity: SPRAYER-001)' },
    { name: 'otadata', offset: '0x00e000', size: '8.0 KB', type: 'system', desc: 'OTA Selection & Boot Flag Slot' },
    { name: 'app0 (factory)', offset: '0x010000', size: '3.0 MB', type: 'app', desc: 'Primary Firmware Application' },
    { name: 'spiffs', offset: '0x310000', size: '4.9 MB', type: 'storage', desc: 'SPI Flash File System Assets & Web UI' },
  ];

  const handleWriteNvs = () => {
    state.activeDevice.deviceId = customId;
    setIsProvisioned(true);
    setTimeout(() => setIsProvisioned(false), 3000);
  };

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Cpu className="w-5 h-5 text-[#58a6ff]" />
              <span>ESP32-S3 Device Profile & Hardware Inspector</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Target board: {state.targetBoard} | Dual Xtensa LX7 @ 240 MHz | 8 MB Octal SPI Flash
            </p>
          </div>
          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>Hardware Online</span>
          </span>
        </div>

        {/* Live Hardware Gauges */}
        <div className="grid grid-cols-2 gap-4">
          {/* SRAM Gauge */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8b949e] flex items-center space-x-1.5 font-bold">
                <HardDrive className="w-4 h-4 text-[#58a6ff]" />
                <span>Internal SRAM (320 KB)</span>
              </span>
              <span className="text-white font-bold">37.5 KB / 320 KB (11.7%)</span>
            </div>
            <div className="w-full bg-[#0d1117] h-2.5 rounded-full overflow-hidden border border-[#30363d]">
              <div className="bg-gradient-to-r from-blue-600 to-cyan-400 h-full w-[11.7%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Free Heap: ~282 KB</span>
              <span>DMA Compatible</span>
            </div>
          </div>

          {/* Flash Gauge */}
          <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-[#8b949e] flex items-center space-x-1.5 font-bold">
                <Zap className="w-4 h-4 text-emerald-400" />
                <span>SPI Flash Memory (8 MB)</span>
              </span>
              <span className="text-white font-bold">324 KB / 8192 KB (3.9%)</span>
            </div>
            <div className="w-full bg-[#0d1117] h-2.5 rounded-full overflow-hidden border border-[#30363d]">
              <div className="bg-gradient-to-r from-emerald-600 to-teal-400 h-full w-[3.9%]"></div>
            </div>
            <div className="flex justify-between text-[10px] text-[#8b949e]">
              <span>Flash Mode: QIO @ 80MHz</span>
              <span>Available: 7.86 MB</span>
            </div>
          </div>
        </div>

        {/* NVS Provisioning Box */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-[#58a6ff]" />
              <span className="font-bold text-white text-xs">Non-Volatile Storage (NVS) Identity Provisioning</span>
            </div>
            <span className="text-[10px] text-[#8b949e]">Namespace: <code className="text-[#58a6ff]">esp_studio</code></span>
          </div>

          <p className="text-[11px] text-[#8b949e] leading-relaxed">
            Provision a persistent logical device identifier into the ESP32-S3 hardware NVS memory partition. This device ID persists across firmware flashes and identifies this unit in cloud telemetry.
          </p>

          <div className="flex items-center space-x-3">
            <input
              type="text"
              value={customId}
              onChange={(e) => setCustomId(e.target.value)}
              className="flex-1 bg-[#0d1117] border border-[#30363d] px-3 py-2 rounded-lg text-white font-mono text-xs outline-none focus:border-[#58a6ff]"
              placeholder="e.g. SPRAYER-001"
            />
            <button
              onClick={handleWriteNvs}
              className="px-4 py-2 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg font-semibold text-xs flex items-center space-x-1.5 transition-colors"
            >
              {isProvisioned ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <ShieldCheck className="w-4 h-4" />}
              <span>{isProvisioned ? 'Written to NVS!' : 'Provision Device ID'}</span>
            </button>
          </div>
        </div>

        {/* Partition Table Viewer */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-3">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="font-bold text-white text-xs">ESP32-S3 Flash Partition Map</span>
            <span className="text-[10px] text-[#8b949e]">Custom 8MB partitions.csv</span>
          </div>

          <div className="divide-y divide-[#21262d] overflow-hidden rounded-lg border border-[#21262d]">
            {partitionTable.map((p) => (
              <div key={p.name} className="p-2.5 bg-[#0d1117] flex items-center justify-between text-[11px]">
                <div className="flex items-center space-x-3">
                  <span className={`w-2 h-2 rounded-full ${
                    p.type === 'app' ? 'bg-emerald-400' :
                    p.type === 'data' ? 'bg-amber-400' :
                    p.type === 'storage' ? 'bg-purple-400' : 'bg-blue-400'
                  }`}></span>
                  <div>
                    <div className="text-white font-semibold">{p.name}</div>
                    <div className="text-[#8b949e] text-[10px]">{p.desc}</div>
                  </div>
                </div>

                <div className="flex items-center space-x-6">
                  <span className="text-[#58a6ff] font-mono">{p.offset}</span>
                  <span className="text-slate-300 font-mono w-16 text-right">{p.size}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
