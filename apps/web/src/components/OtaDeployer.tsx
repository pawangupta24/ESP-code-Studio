import React, { useState } from 'react';
import { Wifi, UploadCloud, Shield, Lock, Radio } from 'lucide-react';

export const OtaDeployer: React.FC = () => {
  const [targetIp, setTargetIp] = useState('192.168.1.142');
  const [targetHost, setTargetHost] = useState('sprayer-001.local');
  const [otaPort, setOtaPort] = useState('3232');
  const [otaPassword, setOtaPassword] = useState('esp32s3_secret_ota');
  const [isDeploying, setIsDeploying] = useState(false);
  const [otaProgress, setOtaProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleStartOta = async () => {
    setIsDeploying(true);
    setOtaProgress(5);
    setStatusMessage(`Resolving mDNS node: ${targetHost}...`);

    await new Promise((r) => setTimeout(r, 600));
    setOtaProgress(20);
    setStatusMessage(`Authenticating with ESP32-S3 (${targetIp}:${otaPort})...`);

    await new Promise((r) => setTimeout(r, 700));
    setOtaProgress(45);
    setStatusMessage('Selecting next inactive OTA partition slot: ota_1...');

    await new Promise((r) => setTimeout(r, 800));
    setOtaProgress(80);
    setStatusMessage('Streaming application payload: firmware.bin (324 KB)...');

    await new Promise((r) => setTimeout(r, 1000));
    setOtaProgress(95);
    setStatusMessage('Verifying SHA-256 partition checksum...');

    await new Promise((r) => setTimeout(r, 500));
    setOtaProgress(100);
    setStatusMessage('OTA Upload Successful! Board rebooting into new firmware version 1.0.6.');
    setIsDeploying(false);
  };

  return (
    <div className="flex-1 p-6 bg-[#0d1117] overflow-y-auto text-xs font-mono select-none">
      <div className="max-w-3xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center space-x-2">
              <Wifi className="w-5 h-5 text-[#58a6ff]" />
              <span>Over-The-Air (OTA) Wireless Firmware Flasher</span>
            </h2>
            <p className="text-[#8b949e] mt-0.5">
              Flash firmware wirelessly to deployed field units over WiFi / mDNS without physical USB cable access.
            </p>
          </div>

          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-400 border border-emerald-800 flex items-center space-x-1.5">
            <Radio className="w-3.5 h-3.5 animate-pulse" />
            <span>WiFi Station Online</span>
          </span>
        </div>

        {/* Target Deployment Card */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between border-b border-[#30363d] pb-2.5">
            <span className="font-bold text-white text-xs">Target Device Wireless Parameters</span>
            <span className="text-[10px] text-[#58a6ff]">ESP-OTA Standard Protocol</span>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[#8b949e] block mb-1">Target IP Address:</label>
              <input
                type="text"
                value={targetIp}
                onChange={(e) => setTargetIp(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] p-2 rounded text-white text-xs outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div>
              <label className="text-[#8b949e] block mb-1">mDNS Hostname:</label>
              <input
                type="text"
                value={targetHost}
                onChange={(e) => setTargetHost(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] p-2 rounded text-white text-xs outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div>
              <label className="text-[#8b949e] block mb-1">OTA Port:</label>
              <input
                type="text"
                value={otaPort}
                onChange={(e) => setOtaPort(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] p-2 rounded text-white text-xs outline-none focus:border-[#58a6ff]"
              />
            </div>

            <div>
              <label className="text-[#8b949e] block mb-1 flex items-center space-x-1">
                <Lock className="w-3 h-3 text-[#58a6ff]" />
                <span>OTA Auth Key / Password:</span>
              </label>
              <input
                type="password"
                value={otaPassword}
                onChange={(e) => setOtaPassword(e.target.value)}
                className="w-full bg-[#0d1117] border border-[#30363d] p-2 rounded text-white text-xs outline-none focus:border-[#58a6ff]"
              />
            </div>
          </div>
        </div>

        {/* Dual Partition Safety Explanation */}
        <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/50 space-y-2">
          <div className="flex items-center space-x-2 text-[#58a6ff] font-bold">
            <Shield className="w-4 h-4" />
            <span>Automatic Anti-Brick Rollback Safety</span>
          </div>
          <p className="text-[#8b949e] text-[11px] leading-relaxed">
            ESP Studio compiles with dual partition switching (`ota_0` and `ota_1`). If the new firmware crashes or fails to execute `esp_ota_mark_app_valid_cancel_rollback()` during initial boot, the ESP32-S3 automatically reboots into the previous working firmware image.
          </p>
        </div>

        {/* Execution & Progress */}
        <div className="p-4 rounded-xl bg-[#161b22] border border-[#30363d] space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="font-bold text-white text-xs">Deploy Active Firmware via WiFi</div>
              <div className="text-[11px] text-[#8b949e]">Payload: firmware.bin (324 KB)</div>
            </div>

            <button
              onClick={handleStartOta}
              disabled={isDeploying}
              className="px-5 py-2.5 bg-[#1f6feb] hover:bg-[#388bfd] text-white rounded-lg font-bold text-xs flex items-center space-x-2 shadow-md transition-all disabled:opacity-50"
            >
              <UploadCloud className="w-4 h-4" />
              <span>{isDeploying ? 'Deploying OTA...' : 'Start Wireless OTA Flash'}</span>
            </button>
          </div>

          {(isDeploying || otaProgress > 0) && (
            <div className="space-y-2 pt-2 border-t border-[#21262d]">
              <div className="flex justify-between text-[11px]">
                <span className="text-white font-semibold">{statusMessage}</span>
                <span className="text-[#58a6ff] font-bold">{otaProgress}%</span>
              </div>
              <div className="w-full bg-[#0d1117] h-2.5 rounded-full overflow-hidden border border-[#30363d]">
                <div
                  className="bg-gradient-to-r from-blue-600 via-indigo-500 to-emerald-400 h-full transition-all duration-300"
                  style={{ width: `${otaProgress}%` }}
                ></div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
